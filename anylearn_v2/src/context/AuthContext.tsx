'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { AuthUser, loginApi, registerApi, getCart } from '@/lib/api'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  cartCount: number
  login: (phone: string, password: string) => Promise<{ error?: string }>
  register: (name: string, phone: string, email: string, password: string) => Promise<{ error?: string }>
  logout: () => void
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
      user, token, cartCount,
      login, register, logout, refreshCartCount,
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
