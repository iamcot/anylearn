'use client'

import { useEffect, useRef, useState } from 'react'
import Modal from '@/components/Modal'
import { getNearbyPartners, type NearbyPartner } from '@/lib/api'
import { loadGoogleMaps } from '@/lib/maps/googleMaps'

interface Props {
  center: { lat: number; lng: number }
  radiusKm?: number
  onClose: () => void
}

// Without a custom map style, Google asks for any map id to allow the advanced (HTML) markers used for the name labels.
const MAP_ID = 'DEMO_MAP_ID'

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

// Built with the DOM (textContent), so a partner name or introduction can never inject markup into the map.
function popupOf(partner: NearbyPartner): HTMLElement {
  const root = element('div', 'w-56')
  const head = element('div', 'mb-1.5 flex items-center gap-2')
  if (partner.image) {
    const avatar = element('img', 'size-10 shrink-0 rounded-full object-cover')
    avatar.src = partner.image
    avatar.alt = ''
    head.appendChild(avatar)
  } else {
    head.appendChild(element('div', 'grid size-10 shrink-0 place-items-center rounded-full bg-blue-soft font-extrabold text-blue', partner.name.charAt(0).toUpperCase()))
  }
  head.appendChild(element('div', 'text-sm font-extrabold leading-tight text-ink', partner.name))
  root.appendChild(head)
  if (partner.intro) root.appendChild(element('p', 'm-0 mb-2 text-xs leading-snug text-muted', partner.intro))
  const link = element('a', 'text-xs font-bold text-green-dark', 'Tìm hiểu thêm')
  link.href = `/partner/${partner.id}`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  root.appendChild(link)
  return root
}

function pinOf(partner: NearbyPartner): HTMLElement {
  const pin = element('div', 'flex cursor-pointer flex-col items-center')
  pin.appendChild(element('span', 'max-w-[140px] truncate whitespace-nowrap rounded-full border border-green bg-white px-2 py-0.5 text-[11px] font-extrabold text-green-dark shadow-card', partner.name))
  pin.appendChild(element('span', 'mt-0.5 block size-2.5 rounded-full border-2 border-white bg-green shadow-card'))
  return pin
}

function youAreHere(): HTMLElement {
  return element('div', 'size-4 rounded-full border-[3px] border-white bg-blue shadow-card')
}

// The "Xem bản đồ" popup of "Gần tôi": the visitor in the middle, the circle of the search radius and the schools inside it.
export default function NearbyMapModal({ center, radiusKm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [count, setCount] = useState(0)
  const [usedRadius, setUsedRadius] = useState(radiusKm)

  useEffect(() => {
    const node = mapRef.current
    if (!node) return
    let cancelled = false
    const markers: google.maps.marker.AdvancedMarkerElement[] = []

    async function draw(container: HTMLDivElement) {
      const [result] = await Promise.all([getNearbyPartners(center.lat, center.lng, radiusKm), loadGoogleMaps()])
      if (cancelled) return
      if (!result) { setStatus('error'); return }
      const { Map, InfoWindow } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary
      const { AdvancedMarkerElement, CollisionBehavior } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary
      if (cancelled) return

      const position = { lat: center.lat, lng: center.lng }
      const map = new Map(container, { center: position, zoom: 13, mapId: MAP_ID, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, gestureHandling: 'greedy' })
      const circle = new google.maps.Circle({ map, center: position, radius: result.radiusKm * 1000, strokeColor: '#16a34a', strokeWeight: 1.5, fillColor: '#16a34a', fillOpacity: 0.05, clickable: false })
      map.fitBounds(circle.getBounds()!, 16)
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

    draw(node).catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true; markers.forEach(marker => { marker.map = null }) }
  }, [center.lat, center.lng, radiusKm])

  return (
    <Modal title="Trường học gần bạn" onClose={onClose} maxWidth="max-w-[720px]">
      <p className="m-0 mb-3 text-xs text-muted">
        {status === 'loading' && 'Đang tải bản đồ...'}
        {status === 'error' && 'Không tải được bản đồ. Thử lại sau nhé.'}
        {status === 'ready' && (count > 0
          ? `${count} trường trong bán kính ${usedRadius} km. Bấm vào tên để xem giới thiệu; phóng to để thấy đủ tên.`
          : `Chưa có trường nào trong bán kính ${usedRadius} km quanh bạn.`)}
      </p>
      <div ref={mapRef} className="h-[60vh] min-h-[320px] w-full overflow-hidden rounded-xl border border-line bg-bg" />
    </Modal>
  )
}
