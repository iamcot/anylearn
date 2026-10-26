import type { MetadataRoute } from 'next'

const SHORTCUT_ICON = [{ src: '/icons/icon-192.png', sizes: '192x192' }]

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'anyLEARN - Học không giới hạn',
    short_name: 'anyLEARN',
    description: 'Tìm, đăng ký và theo dõi lịch học của con ở một nơi.',
    lang: 'vi',
    display: 'standalone',
    start_url: '/?source=pwa',
    scope: '/',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Hôm nay', url: '/today', icons: SHORTCUT_ICON },
      { name: 'Tìm khóa học', url: '/search', icons: SHORTCUT_ICON },
      { name: 'Đơn hàng của tôi', url: '/account/orders', icons: SHORTCUT_ICON },
    ],
  }
}
