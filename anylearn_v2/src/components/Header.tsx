'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

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
            { href: '/search', label: 'anySCHOOL' },
            { href: '/search', label: 'anyPROFESSOR' },
            { href: '/search', label: 'anyCOURSE' },
            { href: '/search', label: 'Tìm kiếm' },
          ].map(({ href, label }) => (
            <Link key={label} href={href} style={{
              fontWeight: 800, color: '#4d5968', fontSize: 15,
              textDecoration: 'none', padding: '9px 0',
              borderBottom: '2px solid transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.color = '#00539b';
              (e.target as HTMLElement).style.borderBottomColor = '#00a651';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.color = '#4d5968';
              (e.target as HTMLElement).style.borderBottomColor = 'transparent';
            }}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hidden-mobile">
          <span style={{ fontSize: 14, fontWeight: 800, color: '#4d5968' }}>Tải app</span>
          <div style={{ position: 'relative' }}>
            <button style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1px solid #e6edf4', background: 'white',
              display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 18,
            }}>🛒</button>
            <span style={{
              position: 'absolute', top: -5, right: -4,
              minWidth: 18, height: 18, borderRadius: 999,
              background: '#e73348', color: 'white',
              fontSize: 11, fontWeight: 900,
              display: 'grid', placeItems: 'center', padding: '0 4px',
            }}>0</span>
          </div>
          <button style={{
            width: 38, height: 38, borderRadius: '50%',
            border: '1px solid #e6edf4', background: 'white',
            display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 18,
          }}>🇻🇳</button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none', width: 38, height: 38, borderRadius: 10,
            border: '1px solid #e6edf4', background: 'white',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 20,
          }}
          className="show-mobile"
          aria-label="Mở menu"
        >☰</button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          borderTop: '1px solid #e6edf4', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
          background: 'white',
        }}>
          {[
            { href: '/info', label: 'Giới thiệu' },
            { href: '/search', label: 'Tìm kiếm' },
            { href: '/search', label: 'anySCHOOL' },
            { href: '/search', label: 'anyPROFESSOR' },
            { href: '/search', label: 'anyCOURSE' },
          ].map(({ href, label }) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)}
              style={{ fontWeight: 800, color: '#4d5968', textDecoration: 'none', fontSize: 16 }}>
              {label}
            </Link>
          ))}
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
