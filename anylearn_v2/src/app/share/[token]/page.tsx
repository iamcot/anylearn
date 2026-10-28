import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicAchievement } from '@/lib/api/achievements'
import { invitePath, siteOrigin } from '@/lib/achievements/share'
import CountOpen from '@/components/fun/share/CountOpen'

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const a = await getPublicAchievement(token)
  if (!a) return { title: 'Banner không tồn tại' }
  const image = `${siteOrigin()}/share/${token}/banner?size=og`
  const description = `${a.subtitle}. Cùng chơi Vui học với Leo trên anyLEARN.`
  return {
    title: `${a.name}: ${a.title}`,
    description,
    openGraph: { title: `${a.name}: ${a.title}`, description, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [image] },
  }
}

// The page a shared achievement link opens: the banner and a button that registers through the friend's invitation.
export default async function SharePage({ params }: Props) {
  const { token } = await params
  const a = await getPublicAchievement(token)
  if (!a) notFound()
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 pb-16 pt-6 text-center">
      <CountOpen token={token} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/share/${token}/banner`} alt={`${a.name}: ${a.title}`} className="w-full rounded-3xl shadow-lg ring-1 ring-line" />
      <h1 className="mb-0 mt-5 text-xl font-black">{a.name} vừa đạt: {a.title}</h1>
      <p className="mt-1 text-sm text-muted">{a.subtitle}</p>
      <Link href={invitePath(a.refCode, a.game, token)} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-green px-8 text-base font-extrabold text-white no-underline">Cùng chơi với {a.name}</Link>
      <p className="mt-2 text-xs text-muted">Đăng ký miễn phí, điểm danh mỗi ngày nhận quà từ Leo.</p>
    </main>
  )
}
