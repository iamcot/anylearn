'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Modal from '@/components/Modal'
import { getNearbyPartners, type NearbyPartner } from '@/lib/api'

interface Props {
  center: { lat: number; lng: number }
  radiusKm?: number
  onClose: () => void
}

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'

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

function markerOf(partner: NearbyPartner): L.Marker {
  const marker = L.marker([partner.lat, partner.lng], { title: partner.name })
  const pin = element('div', 'flex -translate-x-1/2 -translate-y-full flex-col items-center')
  pin.appendChild(element('span', 'max-w-[140px] truncate whitespace-nowrap rounded-full border border-green bg-white px-2 py-0.5 text-[11px] font-extrabold text-green-dark shadow-card', partner.name))
  pin.appendChild(element('span', 'mt-0.5 block size-2.5 rounded-full border-2 border-white bg-green shadow-card'))
  marker.setIcon(L.divIcon({ className: '', html: pin.outerHTML, iconSize: [0, 0] }))
  marker.bindPopup(popupOf(partner), { closeButton: true })
  return marker
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
    const map = L.map(node, { zoomControl: true }).setView([center.lat, center.lng], 13)
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map)
    L.circleMarker([center.lat, center.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 })
      .bindTooltip('Vị trí của bạn').addTo(map)

    getNearbyPartners(center.lat, center.lng, radiusKm).then(result => {
      if (cancelled) return
      if (!result) { setStatus('error'); return }
      setUsedRadius(result.radiusKm)
      setCount(result.partners.length)
      const circle = L.circle([center.lat, center.lng], { radius: result.radiusKm * 1000, color: '#16a34a', weight: 1.5, fillOpacity: 0.05 }).addTo(map)
      result.partners.forEach(partner => markerOf(partner).addTo(map))
      map.fitBounds(circle.getBounds(), { padding: [16, 16] })
      setStatus('ready')
    })
    // The popup opens inside a modal that has just been laid out, so the map must measure itself again.
    const resize = window.setTimeout(() => map.invalidateSize(), 150)
    return () => { cancelled = true; window.clearTimeout(resize); map.remove() }
  }, [center.lat, center.lng, radiusKm])

  return (
    <Modal title="Trường học gần bạn" onClose={onClose} maxWidth="max-w-[720px]">
      <p className="m-0 mb-3 text-xs text-muted">
        {status === 'loading' && 'Đang tải bản đồ...'}
        {status === 'error' && 'Không tải được danh sách. Thử lại sau nhé.'}
        {status === 'ready' && (count > 0
          ? `${count} trường trong bán kính ${usedRadius} km. Bấm vào tên để xem giới thiệu.`
          : `Chưa có trường nào trong bán kính ${usedRadius} km quanh bạn.`)}
      </p>
      <div ref={mapRef} className="h-[60vh] min-h-[320px] w-full overflow-hidden rounded-xl border border-line" />
    </Modal>
  )
}
