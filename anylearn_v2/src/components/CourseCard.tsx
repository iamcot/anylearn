import Link from 'next/link'
import { Item } from '@/lib/api'

interface Props {
  item: Item
}

function formatPrice(price: number) {
  if (!price) return 'Liên hệ'
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return price.toLocaleString('vi-VN') + ' đ'
}

const SUBTYPE_LABELS: Record<string, string> = {
  extra:      'Ngoại khóa',
  offline:    'Học trực tiếp',
  online:     'Học online',
  digital:    'Kỹ thuật số',
  video:      'Video',
  preschool:  'Mầm non',
}

export default function CourseCard({ item }: Props) {
  return (
    <article style={{
      background: 'white',
      border: '1px solid #e6edf4',
      borderRadius: 22,
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Image area */}
      <div style={{
        minHeight: 165,
        background: 'linear-gradient(135deg, #dff7e8, #e7f3ff)',
        display: 'grid', placeItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        ) : (
          <span style={{ fontSize: 46 }}>📚</span>
        )}
        {item.isHot ? (
          <span style={{
            position: 'absolute', top: 12, left: 12,
            background: '#ffca05', color: '#17212f',
            borderRadius: 999, padding: '6px 10px',
            fontWeight: 900, fontSize: 12,
          }}>HOT</span>
        ) : null}
      </div>

      {/* Body */}
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ margin: '0 0 10px', color: '#008244', lineHeight: 1.35, fontSize: 18, fontWeight: 900 }}>
          {item.title}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {item.subtype && (
            <span style={{ borderRadius: 999, padding: '5px 9px', background: '#e9fff3', color: '#008244', fontSize: 12, fontWeight: 900 }}>
              {SUBTYPE_LABELS[item.subtype] ?? item.subtype}
            </span>
          )}
        </div>

        {item.shortContent && (
          <p style={{ color: '#6d7a8a', fontSize: 14, margin: '0 0 14px', flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.shortContent}
          </p>
        )}

        <div style={{ marginTop: 'auto' }}>
          <div style={{ color: '#e73348', fontWeight: 900, fontSize: 18, marginBottom: 14 }}>
            {formatPrice(item.price)}
          </div>
          <Link href={`/search`} className="btn btn--green" style={{ textAlign: 'center', width: '100%' }}>
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  )
}
