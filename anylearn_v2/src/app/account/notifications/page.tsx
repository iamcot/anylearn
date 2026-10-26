'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { sendTestPush } from '@/lib/api'
import AccountCard from '@/components/account/AccountCard'
import Alert from '@/components/Alert'
import { ListSkeleton } from '@/components/PageSkeleton'
import { useToast } from '@/components/ToastProvider'
import { IosSteps } from '@/components/pwa/InstallAppCard'
import { usePushPrompt, type PushPrompt } from '@/components/pwa/usePushPrompt'

const PRIMARY_BUTTON = 'min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-sm font-medium text-white disabled:opacity-60'
const OUTLINE_BUTTON = 'min-h-11 cursor-pointer rounded-full border border-line bg-white px-5 text-sm font-medium text-text disabled:opacity-60'

function EnabledActions({ push }: { push: PushPrompt }) {
  const { token } = useAuth()
  const toast = useToast()
  const [testing, setTesting] = useState(false)

  const handleTest = async () => {
    if (!token) return
    setTesting(true)
    const { data, error } = await sendTestPush(token)
    setTesting(false)
    if (error || !data?.delivered) {
      toast({ kind: 'error', text: error || 'Chưa gửi được tới thiết bị này. Thử tắt rồi bật lại thông báo.' })
      return
    }
    toast({ kind: 'success', text: 'Đã gửi thông báo thử, kiểm tra điện thoại của bạn.' })
  }

  return (
    <>
      <Alert kind="success">Thông báo đang bật trên thiết bị này.</Alert>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={handleTest} disabled={testing} className={PRIMARY_BUTTON}>
          {testing ? 'Đang gửi...' : 'Gửi thông báo thử'}
        </button>
        <button type="button" onClick={push.disable} disabled={push.busy} className={OUTLINE_BUTTON}>
          Tắt trên thiết bị này
        </button>
      </div>
    </>
  )
}

function EnableButton({ push }: { push: PushPrompt }) {
  const toast = useToast()

  const handleEnable = async () => {
    const result = await push.enable()
    if (result === 'denied') toast({ kind: 'error', text: 'Bạn chưa cho phép thông báo trong trình duyệt.' })
    if (result === 'failed') toast({ kind: 'error', text: 'Chưa bật được thông báo, vui lòng thử lại sau.' })
  }

  return (
    <button type="button" onClick={handleEnable} disabled={push.busy} className={PRIMARY_BUTTON}>
      {push.busy ? 'Đang bật...' : 'Bật thông báo'}
    </button>
  )
}

function DeviceStatus({ push }: { push: PushPrompt }) {
  switch (push.mode) {
    case 'granted':
      return push.optedOut
        ? <><p className="m-0 mb-4 text-sm text-text">Bạn đã tắt thông báo trên thiết bị này.</p><EnableButton push={push} /></>
        : <EnabledActions push={push} />
    case 'ask':
    case 'hidden':
      return <><p className="m-0 mb-4 text-sm text-text">Thông báo đang tắt trên thiết bị này.</p><EnableButton push={push} /></>
    case 'needs-install':
      return (
        <div className="text-sm text-text">
          <p className="m-0">Trên iPhone, thông báo chỉ hoạt động khi anyLEARN được cài lên màn hình chính:</p>
          <IosSteps />
          <p className="m-0 mt-3">Sau đó mở lại trang này từ biểu tượng anyLEARN để bật thông báo.</p>
        </div>
      )
    case 'denied':
      return (
        <Alert kind="error">
          Trình duyệt đang chặn thông báo của anyLEARN. Mở cài đặt trình duyệt (biểu tượng ổ khóa cạnh địa chỉ web,
          hoặc Cài đặt &gt; Thông báo trên điện thoại), cho phép thông báo rồi tải lại trang.
        </Alert>
      )
    case 'unsupported':
      return (
        <p className="m-0 text-sm text-text">
          Thiết bị hoặc trình duyệt này chưa nhận được thông báo đẩy. Hãy dùng Chrome hoặc Safari mới nhất; bạn vẫn xem
          thông báo trong chuông khi mở anyLEARN.
        </p>
      )
  }
}

export default function NotificationSettingsPage() {
  const { isAuthLoading } = useAuth()
  const push = usePushPrompt()

  return (
    <AccountCard title="Thông báo" subtitle="Nhắc lịch học, xác nhận thanh toán, đổi lịch và tin từ anyLEARN">
      <div className="max-w-xl p-4 sm:p-5">
        {isAuthLoading ? <ListSkeleton showTitle={false} /> : <DeviceStatus push={push} />}
      </div>
    </AccountCard>
  )
}
