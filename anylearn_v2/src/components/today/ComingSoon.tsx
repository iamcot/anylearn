import Link from 'next/link'

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-16 text-center">
      <h1 className="text-2xl font-black text-ink">{title}</h1>
      <p className="mt-2 text-muted">Tính năng này sắp ra mắt.</p>
      <Link href="/today" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-green px-5 text-[15px] font-black text-white">
        Về Hôm nay
      </Link>
    </div>
  )
}
