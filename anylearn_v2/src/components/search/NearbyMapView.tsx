'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon } from '@/components/icons'
import { getNearbyPartners, type NearbyPartner } from '@/lib/api'
import { loadGoogleMaps } from '@/lib/maps/googleMaps'

interface Props {
  center: { lat: number; lng: number }
  radiusKm?: number
  backHref: string
}

// Without a custom map style, Google asks for any map id to allow the advanced (HTML) markers used for the labels.
const MAP_ID = 'DEMO_MAP_ID'
// The circle is fitted at this share of its radius: the edge may fall outside the screen so the schools show bigger.
const FIT_SHARE = 0.6

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function avatarOf(partner: NearbyPartner, size: string): HTMLElement {
  if (partner.image) {
    const avatar = element('img', `${size} shrink-0 rounded-full object-cover`)
    avatar.src = partner.image
    avatar.alt = ''
    return avatar
  }
  return element('div', `grid ${size} shrink-0 place-items-center rounded-full bg-blue-soft font-extrabold text-blue`, (partner.name ?? '?').charAt(0).toUpperCase())
}

function ratingLine(partner: NearbyPartner): HTMLElement | null {
  if (partner.rating == null || !partner.ratingCount) return null
  const line = element('span', 'flex items-center gap-0.5 text-[11px] font-bold text-ink')
  line.appendChild(element('span', 'text-star', '★'))
  line.appendChild(document.createTextNode(`${partner.rating.toFixed(1).replace('.', ',')} (${partner.ratingCount})`))
  return line
}

// Built with the DOM (textContent), so a partner name or introduction can never inject markup into the map.
function popupOf(partner: NearbyPartner): HTMLElement {
  const root = element('div', 'w-56')
  const head = element('div', 'mb-1.5 flex items-center gap-2')
  head.appendChild(avatarOf(partner, 'size-10'))
  const title = element('div', 'min-w-0')
  title.appendChild(element('div', 'text-sm font-extrabold leading-tight text-ink', partner.name))
  const rating = ratingLine(partner)
  if (rating) title.appendChild(rating)
  head.appendChild(title)
  root.appendChild(head)
  if (partner.intro) root.appendChild(element('p', 'm-0 mb-2 text-xs leading-snug text-muted', partner.intro))
  const link = element('a', 'text-xs font-bold text-green-dark', 'Tìm hiểu thêm')
  link.href = `/partner/${partner.id}`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  root.appendChild(link)
  return root
}

// Logo + name (+ stars when the partner has reviews), with a small dot under it on the exact spot.
function pinOf(partner: NearbyPartner): HTMLElement {
  const pin = element('div', 'flex cursor-pointer flex-col items-center')
  const card = element('div', 'flex max-w-[190px] items-center gap-1.5 rounded-full border border-green bg-white py-0.5 pl-0.5 pr-2.5 shadow-card')
  card.appendChild(avatarOf(partner, 'size-7'))
  const text = element('div', 'flex min-w-0 flex-col leading-tight')
  text.appendChild(element('span', 'truncate whitespace-nowrap text-[11px] font-extrabold text-green-dark', partner.name))
  const rating = ratingLine(partner)
  if (rating) text.appendChild(rating)
  card.appendChild(text)
  pin.appendChild(card)
  pin.appendChild(element('span', 'mt-0.5 block size-2.5 rounded-full border-2 border-white bg-green shadow-card'))
  return pin
}

function youAreHere(): HTMLElement {
  return element('div', 'size-4 rounded-full border-[3px] border-white bg-blue shadow-card')
}

async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  try { return await run() } catch {
    await new Promise(resolve => setTimeout(resolve, 800))
    return run()
  }
}

// "Gần tôi" map as a full page: the visitor in the middle, the circle of the search radius and the schools inside it.
export default function NearbyMapView({ center, radiusKm, backHref }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [count, setCount] = useState(0)
  const [usedRadius, setUsedRadius] = useState(radiusKm)
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => { setStatus('loading'); setAttempt(n => n + 1) }, [])

  useEffect(() => {
    const node = mapRef.current
    if (!node) return
    let cancelled = false
    const markers: google.maps.marker.AdvancedMarkerElement[] = []

    async function draw(container: HTMLDivElement) {
      // A first load sometimes fails (script or API not ready yet): each part is tried once more before giving up.
      const [result] = await Promise.all([
        withRetry(async () => {
          const found = await getNearbyPartners(center.lat, center.lng, radiusKm)
          if (!found) throw new Error('nearby failed')
          return found
        }),
        withRetry(loadGoogleMaps),
      ])
      if (cancelled) return
      const { Map, InfoWindow } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary
      const { AdvancedMarkerElement, CollisionBehavior } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary
      if (cancelled) return

      const position = { lat: center.lat, lng: center.lng }
      const map = new Map(container, { center: position, zoom: 14, mapId: MAP_ID, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, gestureHandling: 'greedy' })
      new google.maps.Circle({ map, center: position, radius: result.radiusKm * 1000, strokeColor: '#16a34a', strokeWeight: 1.5, fillColor: '#16a34a', fillOpacity: 0.05, clickable: false })
      const fit = new google.maps.Circle({ center: position, radius: result.radiusKm * 1000 * FIT_SHARE })
      map.fitBounds(fit.getBounds()!, 8)
      markers.push(new AdvancedMarkerElement({ map, position, content: youAreHere(), title: 'Vị trí của bạn', zIndex: 1000 }))

      const info = new InfoWindow()
      // Labels that overlap hide the lower ones; zooming in shows them. Nearer schools win.
      result.partners.forEach((partner, index) => {
        const marker = new AdvancedMarkerElement({
          map, position: { lat: partner.lat, lng: partner.lng }, content: pinOf(partner), title: partner.name,
          zIndex: result.partners.length - index, collisionBehavior: CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
        })
        marker.addListener('click', () => { info.setContent(popupOf(partner)); info.open({ map, anchor: marker }) })
        markers.push(marker)
      })
      setUsedRadius(result.radiusKm)
      setCount(result.partners.length)
      setStatus('ready')
    }

    draw(node).catch(error => {
      console.error('[nearby-map]', error)
      if (!cancelled) setStatus('error')
    })
    return () => { cancelled = true; markers.forEach(marker => { marker.map = null }) }
  }, [center.lat, center.lng, radiusKm, attempt])

  return (
    // Inside the normal page: the site header stays on top and the tabs at the bottom; the map takes what is left.
    <div className="flex h-[calc(100dvh-76px)] flex-col bg-white in-[.has-app-tabs]:max-lg:h-[calc(100dvh-76px-var(--app-tabs-h))]">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <Link href={backHref} aria-label="Quay lại kết quả" className="grid size-11 shrink-0 place-items-center text-ink"><ChevronLeftIcon /></Link>
        <div className="min-w-0">
          <h1 className="m-0 text-base font-extrabold text-ink">Trường học gần bạn</h1>
          <p className="m-0 text-xs text-muted">
            {status === 'loading' && 'Đang tải bản đồ...'}
            {status === 'error' && 'Không tải được bản đồ.'}
            {status === 'ready' && (count > 0
              ? `${count} trường trong bán kính ${usedRadius} km. Phóng to để thấy đủ tên.`
              : `Chưa có trường nào trong bán kính ${usedRadius} km quanh bạn.`)}
          </p>
        </div>
        {status === 'error' && (
          <button type="button" onClick={retry} className="ml-auto min-h-11 cursor-pointer rounded-full border border-green bg-white px-4 text-sm font-bold text-green-dark">Thử lại</button>
        )}
      </div>
      <div ref={mapRef} className="min-h-0 flex-1 bg-bg" />
    </div>
  )
}
