'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Promo {
  id: number
  title: string
  short_content?: string
  image?: string
}

export default function PromoSlider({ promos }: { promos: Promo[] }) {
  const [current, setCurrent] = useState(0)

  if (!promos.length) return null

  return (
    <section className="section">
      <div className="container">
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 32 }}>
          {/* Slides */}
          <div style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(-${current * 100}%)`,
            transition: 'transform 0.4s ease',
          }}>
            {promos.map(promo => (
              <div key={promo.id} style={{
                minWidth: '100%',
                background: 'linear-gradient(100deg, rgba(0,65,120,0.96), rgba(0,166,81,0.82))',
                color: 'white',
                display: 'grid', gridTemplateColumns: '1.2fr 0.8fr',
                minHeight: 300,
                boxShadow: '0 10px 26px rgba(15,23,42,0.08)',
                overflow: 'hidden',
              }} className="promo-slide">
                <div style={{ padding: 38 }}>
                  <span style={{
                    display: 'inline-flex', padding: '7px 11px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.16)', fontWeight: 900, marginBottom: 16, fontSize: 14,
                  }}>Chương trình nổi bật</span>
                  <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, lineHeight: 1.08 }}>
                    {promo.title}
                  </h2>
                  {promo.short_content && (
                    <p style={{ margin: '0 0 20px', maxWidth: 630, color: 'rgba(255,255,255,0.9)' }}>
                      {promo.short_content}
                    </p>
                  )}
                  <Link href="/search" className="btn btn--yellow">Tìm hiểu chương trình</Link>
                </div>
                <div style={{ display: 'grid', placeItems: 'center', padding: 28, overflow: 'hidden' }} className="promo-image-col">
                  {promo.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={promo.image} alt={promo.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24 }} />
                  ) : (
                    <div style={{
                      width: 'min(240px,100%)', aspectRatio: '1/1', borderRadius: 36,
                      border: '2px solid rgba(255,255,255,0.35)',
                      background: 'rgba(255,255,255,0.12)',
                      display: 'grid', placeItems: 'center',
                      textAlign: 'center', fontSize: 48, fontWeight: 900, color: '#ffca05', lineHeight: 1.1,
                    }}>🎁</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Prev / Next arrows */}
          {promos.length > 1 && (
            <>
              <button onClick={() => setCurrent(c => (c - 1 + promos.length) % promos.length)}
                style={{
                  position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)',
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white', fontSize: 20, cursor: 'pointer',
                  display: 'grid', placeItems: 'center',
                }}>‹</button>
              <button onClick={() => setCurrent(c => (c + 1) % promos.length)}
                style={{
                  position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)',
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white', fontSize: 20, cursor: 'pointer',
                  display: 'grid', placeItems: 'center',
                }}>›</button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {promos.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {promos.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? 24 : 8, height: 8,
                  borderRadius: 999, border: 0, cursor: 'pointer',
                  background: i === current ? '#00539b' : '#e6edf4',
                  transition: 'all 0.3s',
                  padding: 0,
                }} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
