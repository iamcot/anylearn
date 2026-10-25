import type { Metadata } from 'next'
import DocPage from '@/components/DocPage'
import { fetchDoc } from '@/lib/docs/fetchDoc'

const GUIDE_TITLES: Record<string, string> = {
  guide_toc: 'Điều khoản sử dụng',
  guide_del_account: 'Điều khoản xóa tài khoản',
  guide_privacy: 'Chính sách bảo mật thông tin',
  guide_payment_term: 'Chính sách bảo mật thanh toán',
  guide_toc_partner: 'Chính sách dành cho học viên - giảng viên',
  guide_return_term: 'Chính sách đổi - trả và hoàn tiền',
  guide_dispute_resolution: 'Quy trình giải quyết tranh chấp',
  guide_about: 'Giới thiệu về anyLEARN',
  guide_member: 'Hướng dẫn thành viên',
  guide_checkout: 'Hướng dẫn thanh toán',
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ p?: string }> }): Promise<Metadata> {
  const { p } = await searchParams
  const title = p ? (GUIDE_TITLES[p] ?? 'Hướng dẫn') : 'Hướng dẫn'
  return { title: `${title} - anyLEARN` }
}

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams
  if (!p) return <section className="py-10"><div className="container"><p className="text-muted">Trang không tìm thấy.</p></div></section>

  return <DocPage title={GUIDE_TITLES[p] ?? 'Hướng dẫn'} doc={await fetchDoc(p)} />
}
