'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, cartCount, logout, openAuthModal } = useAuth()

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(230,237,244,0.88)',
      minHeight: 76,
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, height: 76 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cdn/anylearn/img/LogoanyLEARN.svg" alt="anyLEARN" style={{ height: 60 }} />
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: 26, alignItems: 'center' }} className="hidden-mobile">
          {[
            { href: '/info', label: 'Giới thiệu' },
            { href: '/search?mode=school', label: 'anySCHOOL' },
            { href: '/search?mode=teacher', label: 'anyPROFESSOR' },
            { href: '/search', label: 'Tìm kiếm' },
          ].map(({ href, label }) => (
            <Link key={label} href={href} style={{
              fontWeight: 800, color: '#4d5968', fontSize: 15,
              textDecoration: 'none', padding: '9px 0',
              borderBottom: '2px solid transparent', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = '#00539b'; (e.target as HTMLElement).style.borderBottomColor = '#00a651' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = '#4d5968'; (e.target as HTMLElement).style.borderBottomColor = 'transparent' }}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="hidden-mobile">
          {/* Cart */}
          <Link href="/checkout" style={{ position: 'relative', textDecoration: 'none' }}>
            <button style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1px solid #e6edf4', background: 'white',
              display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 18,
            }}>🛒</button>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -4,
                minWidth: 18, height: 18, borderRadius: 999,
                background: '#e73348', color: 'white',
                fontSize: 11, fontWeight: 900,
                display: 'grid', placeItems: 'center', padding: '0 4px',
              }}>{cartCount}</span>
            )}
          </Link>

          {/* Auth */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.image} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e6edf4' }} />
                : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#00539b,#00a651)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 900, fontSize: 14 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
              }
              <span style={{ fontWeight: 700, color: '#17212f', fontSize: 14, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
              <button onClick={logout} className="btn btn--outline" style={{ padding: '7px 14px', fontSize: 13 }}>Đăng xuất</button>
            </div>
          ) : (
            <button onClick={() => openAuthModal('login')} className="btn btn--blue" style={{ padding: '9px 18px', fontSize: 14 }}>
              Đăng nhập
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', width: 38, height: 38, borderRadius: 10, border: '1px solid #e6edf4', background: 'white', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20 }}
          className="show-mobile" aria-label="Mở menu">☰</button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ borderTop: '1px solid #e6edf4', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: 'white' }}>
          {[
            { href: '/info', label: 'Giới thiệu' },
            { href: '/search', label: 'Tìm kiếm' },
            { href: '/search?mode=school', label: 'anySCHOOL' },
            { href: '/search?mode=teacher', label: 'anyPROFESSOR' },
          ].map(({ href, label }) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)}
              style={{ fontWeight: 800, color: '#4d5968', textDecoration: 'none', fontSize: 16 }}>
              {label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid #e6edf4', paddingTop: 12 }}>
            {user ? (
              <button onClick={logout} style={{ border: 0, background: 'transparent', color: '#e73348', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 }}>Đăng xuất</button>
            ) : (
              <button onClick={() => { setMenuOpen(false); openAuthModal('login') }} className="btn btn--blue" style={{ width: '100%' }}>Đăng nhập</button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
