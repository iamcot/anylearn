'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { AuthUser, loginApi, registerApi, getCart } from '@/lib/api'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  cartCount: number
  isAuthLoading: boolean
  login: (phone: string, password: string) => Promise<{ error?: string }>
  register: (name: string, phone: string, email: string, password: string) => Promise<{ error?: string }>
  logout: () => void
  updateUser: (patch: Partial<AuthUser>) => void
  refreshUser: () => Promise<void>
  refreshCartCount: () => Promise<void>
  isAuthModalOpen: boolean
  authModalTab: 'login' | 'register'
  openAuthModal: (tab?: 'login' | 'register', onSuccess?: () => void) => void
  closeAuthModal: () => void
  authModalOnSuccess: (() => void) | null
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'anylearn_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login')
  const [authModalOnSuccess, setAuthModalOnSuccess] = useState<(() => void) | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored)
        setUser(parsed)
        setToken(parsed.jwtToken)
      }
    } catch {}
    setIsAuthLoading(false)
  }, [])

  const refreshCartCount = useCallback(async () => {
    if (!token) { setCartCount(0); return }
    const items = await getCart(token)
    setCartCount(items.length)
  }, [token])

  useEffect(() => {
    if (token) refreshCartCount()
  }, [token, refreshCartCount])

  const persist = (u: AuthUser) => {
    setUser(u)
    setToken(u.jwtToken)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    const current: AuthUser = JSON.parse(stored)
    if (!current.jwtToken) return
    try {
      const res = await fetch(`${BASE}/user`, {
        headers: { Authorization: `Bearer ${current.jwtToken}` },
      })
      const json = await res.json()
      if (json?.resultCode === 1 && json?.data?.user) {
        const fresh = json.data.user
        // Merge: keep auth tokens from localStorage, update profile fields
        const merged: AuthUser = {
          ...current,
          name: fresh.name ?? current.name,
          image: fresh.image ?? current.image,
          walletM: fresh.walletM ?? current.walletM,
          walletC: fresh.walletC ?? current.walletC,
          email: fresh.email ?? current.email,
        }
        setUser(merged)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      }
    } catch {}
  }, [])

  const login = async (phone: string, password: string) => {
    const { user: u, error } = await loginApi(phone, password)
    if (error || !u) return { error: error || 'Đăng nhập thất bại' }
    persist(u)
    return {}
  }

  const register = async (name: string, phone: string, email: string, password: string) => {
    const { user: u, error } = await registerApi(name, phone, email, password)
    if (error || !u) return { error: error || 'Đăng ký thất bại' }
    persist(u)
    return {}
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setCartCount(0)
    localStorage.removeItem(STORAGE_KEY)
  }

  const openAuthModal = (tab: 'login' | 'register' = 'login', onSuccess?: () => void) => {
    setAuthModalTab(tab)
    setAuthModalOnSuccess(onSuccess ? () => onSuccess : null)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
    setAuthModalOnSuccess(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token, cartCount, isAuthLoading,
      login, register, logout, updateUser, refreshUser, refreshCartCount,
      isAuthModalOpen, authModalTab,
      openAuthModal, closeAuthModal, authModalOnSuccess,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
