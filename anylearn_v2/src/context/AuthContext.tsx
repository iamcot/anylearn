'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useSyncExternalStore, ReactNode } from 'react'
import { AuthUser, loginApi, registerApi, getCart } from '@/lib/api'
import { API_BASE } from '@/lib/apiBase'
import { parseStoredUser, readStoredUserRaw, subscribeUser, writeStoredUser } from '@/lib/auth/userStore'
import { forgetPushDevice } from '@/components/pwa/pushDevice'
import { importGuestLearners } from '@/components/guest/importGuestLearners'

const subscribeNever = () => () => {}

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedUserRaw = useSyncExternalStore(subscribeUser, readStoredUserRaw, () => null)
  const user = useMemo(() => parseStoredUser(storedUserRaw), [storedUserRaw])
  const token = user?.jwtToken ?? null
  // True on the server and during hydration, false once the browser can read the stored user.
  const isAuthLoading = useSyncExternalStore(subscribeNever, () => false, () => true)
  const [cart, setCart] = useState<{ token: string; count: number } | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login')
  const [authModalOnSuccess, setAuthModalOnSuccess] = useState<(() => void) | null>(null)

  const cartCount = token && cart?.token === token ? cart.count : 0

  const refreshCartCount = useCallback(async () => {
    if (!token) return
    const items = await getCart(token)
    setCart({ token, count: items.length })
  }, [token])

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    const current = parseStoredUser(readStoredUserRaw())
    if (current) writeStoredUser({ ...current, ...patch })
  }, [])

  const refreshUser = useCallback(async () => {
    const current = parseStoredUser(readStoredUserRaw())
    if (!current?.jwtToken) return
    try {
      const res = await fetch(`${API_BASE}/user`, {
        headers: { Authorization: `Bearer ${current.jwtToken}` },
      })
      const json = await res.json()
      if (json?.resultCode === 1 && json?.data?.user) {
        const fresh = json.data.user
        // Merge: keep auth tokens from localStorage, update profile fields
        writeStoredUser({
          ...current,
          name: fresh.name ?? current.name,
          image: fresh.image ?? current.image,
          walletM: fresh.walletM ?? current.walletM,
          walletC: fresh.walletC ?? current.walletC,
          email: fresh.email ?? current.email,
        })
      }
    } catch {}
  }, [])

  // Refresh profile on every page load so wallet_c and other fields are always current
  useEffect(() => {
    if (!isAuthLoading) refreshUser()
  }, [isAuthLoading, refreshUser])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getCart(token).then(items => { if (!cancelled) setCart({ token, count: items.length }) })
    return () => { cancelled = true }
  }, [token])

  const login = async (phone: string, password: string) => {
    const { user: u, error } = await loginApi(phone, password)
    if (error || !u) return { error: error || 'Đăng nhập thất bại' }
    writeStoredUser(u)
    return {}
  }

  const register = async (name: string, phone: string, email: string, password: string) => {
    const { user: u, error } = await registerApi(name, phone, email, password)
    if (error || !u) return { error: error || 'Đăng ký thất bại' }
    // The children a visitor told us about become accounts of the new user before the pages see the login, so the next
    // step (add2cart) already lists them. A failure never blocks registering; leftovers are offered after the next login.
    await importGuestLearners(u.jwtToken).catch(() => {})
    writeStoredUser(u)
    return {}
  }

  // A shared phone must stop receiving the previous account's notifications.
  const logout = () => {
    if (token) void forgetPushDevice(token)
    writeStoredUser(null)
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
