'use client'

import Link from 'next/link'
import { useState } from 'react'
import { getArticleUrl } from '@/lib/api'
import { ChevronLeftIcon, ChevronRightIcon, GiftIcon } from '@/components/icons'

interface Promo {
  id: number
  title: string
  short_content?: string
  image?: string
}

const ARROW_CLASS = 'absolute top-1/2 hidden size-11 md:grid -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/40 bg-white/25 p-0 text-white'

export default function PromoSlider({ promos }: { promos: Promo[] }) {
  const [current, setCurrent] = useState(0)

  if (!promos.length) return null

  const showPrevious = () => setCurrent(c => (c - 1 + promos.length) % promos.length)
  const showNext = () => setCurrent(c => (c + 1) % promos.length)

  return (
    <section className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-[32px]">
          <div
            className="flex w-full transition-transform duration-[400ms] ease-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {promos.map(promo => (
              <div
                key={promo.id}
                className="grid min-h-[300px] min-w-full grid-cols-1 overflow-hidden bg-linear-[100deg] from-blue-dark/95 to-green/80 text-white shadow-card md:grid-cols-[1.2fr_0.8fr]"
              >
                <div className="p-6 md:p-10">
                  <span className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium">Chương trình nổi bật</span>
                  <h2 className="m-0 mb-3 text-[clamp(26px,4vw,44px)] font-medium leading-[1.1]">{promo.title}</h2>
                  {promo.short_content && <p className="mb-5 max-w-[630px] text-white/90">{promo.short_content}</p>}
                  <Link href={getArticleUrl(promo)} className="btn btn--yellow">Tìm hiểu chương trình</Link>
                </div>
                <div className="hidden place-items-center overflow-hidden p-7 md:grid">
                  {promo.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={promo.image} alt={promo.title} className="size-full rounded-3xl object-cover" />
                  ) : (
                    <div className="grid aspect-square w-[min(240px,100%)] place-items-center rounded-[36px] border-2 border-white/35 bg-white/10 text-yellow">
                      <GiftIcon className="size-16" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {promos.length > 1 && (
            <>
              <button type="button" aria-label="Chương trình trước" onClick={showPrevious} className={`${ARROW_CLASS} left-3`}>
                <ChevronLeftIcon />
              </button>
              <button type="button" aria-label="Chương trình sau" onClick={showNext} className={`${ARROW_CLASS} right-3`}>
                <ChevronRightIcon />
              </button>
            </>
          )}
        </div>

        {promos.length > 1 && (
          <div className="mt-2 flex justify-center">
            {promos.map((promo, index) => (
              <button
                key={promo.id}
                type="button"
                aria-label={`Chương trình ${index + 1}`}
                aria-current={index === current}
                onClick={() => setCurrent(index)}
                className="grid h-11 min-w-8 cursor-pointer place-items-center border-0 bg-transparent p-0"
              >
                <span className={`h-2 rounded-full transition-all duration-300 ${index === current ? 'w-6 bg-blue' : 'w-2 bg-line'}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
