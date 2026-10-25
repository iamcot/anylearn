'use client'

import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

const QR_IMAGE_SIZE_PX = 512
const QR_MARGIN = 2

export { QR_IMAGE_SIZE_PX }

// Draws the VietQR payload to a PNG data URL; null until the image is ready
export function useQrImage(payload: string | null): string | null {
  const [image, setImage] = useState<{ payload: string; url: string } | null>(null)

  useEffect(() => {
    if (!payload) return
    let cancelled = false
    QRCode.toDataURL(payload, { width: QR_IMAGE_SIZE_PX, margin: QR_MARGIN })
      .then(url => { if (!cancelled) setImage({ payload, url }) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [payload])

  return payload && image?.payload === payload ? image.url : null
}

// Phones share the PNG as a file (so it can be opened from the bank app); other browsers download it
export async function saveQrImage(dataUrl: string, fileName: string): Promise<void> {
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], fileName, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] }).catch(() => undefined)
    return
  }
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  link.click()
}
