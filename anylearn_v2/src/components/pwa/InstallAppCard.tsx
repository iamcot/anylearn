'use client'

import { useState, useSyncExternalStore } from 'react'
import CopyButton from '@/components/CopyButton'
import { DownloadIcon, PlusSquareIcon, ShareIcon } from '@/components/icons'
import { useIsClient } from '@/components/useIsClient'
import {
  INSTALL_DISMISS_DAYS, INSTALL_DISMISSED_KEY, INSTALL_MIN_TODAY_VISITS, TODAY_VISIT_COUNTED_KEY, TODAY_VISITS_KEY,
} from '@/config/pwa'
import { detectPlatform, installMode, isInAppBrowser, type InstallMode } from '@/lib/pwa/installPrompt'
import { getInstallPrompt, showInstallPrompt, subscribeInstallPrompt } from './installPromptStore'

type Context = 'today' | 'order'

const COPY: Record<Context, { title: string; body: string }> = {
  today: {
    title: 'Cài anyLEARN lên điện thoại',
    body: 'Mở lịch học của con bằng 1 chạm từ màn hình chính, không cần tìm lại link.',
  },
  order: {
    title: 'Cài anyLEARN để theo dõi lịch học',
    body: 'Lịch học, đơn hàng và nhắc nhở luôn nằm ở màn hình chính điện thoại.',
  },
}

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    // Private mode can block storage; the card then simply shows again next time.
  }
}

let todayVisitsThisLoad: number | null = null

// Counts one visit per browser tab session, so moving around /today does not inflate it.
function countTodayVisit(): number {
  if (todayVisitsThisLoad !== null) return todayVisitsThisLoad
  const previous = Number(readStorage(localStorage, TODAY_VISITS_KEY)) || 0
  const alreadyCounted = readStorage(sessionStorage, TODAY_VISIT_COUNTED_KEY) === '1'
  todayVisitsThisLoad = alreadyCounted ? previous : previous + 1
  if (!alreadyCounted) {
    writeStorage(localStorage, TODAY_VISITS_KEY, String(todayVisitsThisLoad))
    writeStorage(sessionStorage, TODAY_VISIT_COUNTED_KEY, '1')
  }
  return todayVisitsThisLoad
}

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

function useInstallMode(): InstallMode {
  const isClient = useIsClient()
  const hasNativePrompt = useSyncExternalStore(subscribeInstallPrompt, () => getInstallPrompt() !== null, () => false)
  if (!isClient) return 'hidden'
  const userAgent = navigator.userAgent
  return installMode({
    platform: detectPlatform(userAgent, navigator.maxTouchPoints),
    standalone: isStandalone(),
    inAppBrowser: isInAppBrowser(userAgent),
    hasNativePrompt,
    dismissedAt: readStorage(localStorage, INSTALL_DISMISSED_KEY),
    now: new Date(),
    dismissDays: INSTALL_DISMISS_DAYS,
  })
}

function IosSteps() {
  return (
    <ol className="m-0 mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-text">
      <li>
        Bấm nút <strong className="font-medium">Chia sẻ</strong>{' '}
        <ShareIcon className="inline size-4 align-text-bottom text-blue" /> ở thanh dưới (hoặc trên) của Safari.
      </li>
      <li>
        Chọn <strong className="font-medium">Thêm vào MH chính</strong>{' '}
        <PlusSquareIcon className="inline size-4 align-text-bottom text-blue" />.
      </li>
      <li>Bấm <strong className="font-medium">Thêm</strong>, rồi mở anyLEARN từ biểu tượng trên màn hình chính.</li>
    </ol>
  )
}

function OpenInBrowserHint() {
  return (
    <div className="mt-3 text-sm text-text">
      <p className="m-0">
        Bạn đang mở trong Zalo hoặc Facebook nên chưa cài được. Bấm <strong className="font-medium">⋯</strong> ở góc
        trên, chọn <strong className="font-medium">Mở bằng trình duyệt</strong>, hoặc sao chép link rồi dán vào
        Safari / Chrome.
      </p>
      <div className="mt-3">
        <CopyButton text={window.location.href} label="Sao chép link" />
      </div>
    </div>
  )
}

export default function InstallAppCard({ context }: { context: Context }) {
  const mode = useInstallMode()
  const isClient = useIsClient()
  const [hidden, setHidden] = useState(false)
  const [showSteps, setShowSteps] = useState(false)

  if (hidden || mode === 'hidden') return null
  if (context === 'today' && isClient && countTodayVisit() < INSTALL_MIN_TODAY_VISITS) return null

  const dismiss = () => {
    writeStorage(localStorage, INSTALL_DISMISSED_KEY, new Date().toISOString())
    setHidden(true)
  }

  const install = async () => {
    if (await showInstallPrompt()) setHidden(true)
  }

  const { title, body } = COPY[context]

  return (
    <section className="rounded-card border border-green-line bg-green-soft p-4 text-left">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon, next/image adds nothing here */}
        <img src="/icons/icon-192.png" alt="" width={48} height={48} className="size-12 shrink-0 rounded-xl bg-white shadow-card" />
        <div className="flex-1">
          <h2 className="m-0 text-base font-medium text-ink">{title}</h2>
          <p className="m-0 mt-1 text-sm text-muted">{body}</p>
        </div>
      </div>

      {mode === 'ios-guide' && showSteps && <IosSteps />}
      {mode === 'open-in-browser' && <OpenInBrowserHint />}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 cursor-pointer rounded-full border-0 bg-transparent px-4 text-sm font-medium text-muted"
        >
          Để sau
        </button>
        {mode === 'native' && (
          <button
            type="button"
            onClick={install}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-0 bg-green px-5 text-sm font-medium text-white"
          >
            <DownloadIcon className="size-4" /> Cài ngay
          </button>
        )}
        {mode === 'ios-guide' && !showSteps && (
          <button
            type="button"
            onClick={() => setShowSteps(true)}
            className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-sm font-medium text-white"
          >
            Xem cách cài
          </button>
        )}
      </div>
    </section>
  )
}
