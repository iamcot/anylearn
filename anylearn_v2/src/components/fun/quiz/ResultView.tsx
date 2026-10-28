import Link from 'next/link'
import BrandText from '../BrandText'
import CoinIcon from '../CoinIcon'
import FixedBar from '../FixedBar'
import StickerArt from '../sticker/StickerArt'
import type { QuizMe, QuizResult } from '@/lib/api/quiz'
import { guardWarning, resultTitle, starsLine } from '@/lib/quiz/rules'
import ItemIcon from './ItemIcon'
import PrepRow, { type Prep } from './PrepRow'
import RankCard from './RankCard'
import StarRow, { changedStars, START_DELAY, STAR_STEP } from './StarBurst'

/** The page after a question: what happened to stars and rank, drops and rewards, then the next move. */
export default function ResultView({ me, result, prep, onMult, onShield, onTopic, onAgain, onLobby, busy }: {
  me: QuizMe
  result: QuizResult
  prep: Prep
  onMult: (item: Parameters<React.ComponentProps<typeof PrepRow>['onMult']>[0]) => void
  onShield: () => void
  onTopic: (topic: string | null) => void
  onAgain: () => void
  onLobby: () => void
  busy: boolean
}) {
  const warning = guardWarning(result.profile)
  const reward = result.reward
  const bigWin = result.rankedUp
  return (
    <div className="grid gap-4">
      <div className={`rounded-3xl p-5 text-center ${result.correct ? 'bg-green-soft' : 'bg-amber-50'}`}>
        <div className="text-3xl font-black">{resultTitle(result)}</div>
        {(result.shieldUsed || result.guardLost || result.rankedDown || (!result.correct && result.starsGained === 0)) && <div className={`mt-1 text-lg font-extrabold ${result.correct ? 'text-green-dark' : 'text-warn-text'}`}>{starsLine(result)}</div>}
        <StarRow result={result} />
        {result.multiplier > 1 && result.correct && <div className="text-sm font-bold text-green-dark">Sao may mắn x{result.multiplier}</div>}
      </div>

      {bigWin && (
        <div className="rounded-3xl border-2 border-green bg-white p-4 text-center">
          <div className="text-xl font-black text-green-dark">Lên hạng {result.profile.rankName}!</div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm font-bold">
            {!!reward.coins && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[#b45309]"><CoinIcon className="size-5" /> +{reward.coins} <BrandText text={me.coinName} coinName={me.coinName} /></span>}
            {!!reward.shield && <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-800"><ItemIcon item="shield" className="size-5" /> +{reward.shield} Khiên</span>}
            {reward.sticker && <span className="inline-flex items-center gap-1 rounded-full bg-green-soft px-3 py-1 text-green-dark"><span className="size-6"><StickerArt sticker={reward.sticker} className="size-full text-lg" /></span> <BrandText text={reward.sticker.name} /></span>}
          </div>
          {result.achievement && <Link href={`/today/fun/share/${result.achievement}`} className="mt-3 inline-flex min-h-10 items-center rounded-full bg-green px-5 text-sm font-extrabold text-white no-underline">Khoe thành tích với bạn bè</Link>}
        </div>
      )}
      {result.drop && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-3 text-sm font-bold ring-1 ring-line">
          <ItemIcon item={result.drop} className="size-7" /> Bạn nhặt được <b>{result.dropLabel}</b>
        </div>
      )}

      {result.explanation && (
        <div className="rounded-2xl border border-line bg-white p-3 text-sm">
          <b>Giải thích: </b>{result.explanation}
        </div>
      )}

      <RankCard profile={result.profile} fromRank={result.rankBefore} fromStars={result.starsBefore} delayMs={Math.round((START_DELAY + Math.max(changedStars(result), 1) * STAR_STEP + 0.4) * 1000)} />
      {warning && <p className="m-0 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900" role="status">{warning}</p>}

      <section>
        <h2 className="m-0 mb-2 text-sm font-extrabold">Chuẩn bị cho câu tiếp theo</h2>
        <PrepRow me={me} items={result.items} prep={prep} onMult={onMult} onShield={onShield} onTopic={onTopic} />
      </section>

      <FixedBar><div className="grid grid-cols-[auto_1fr] items-center gap-3">
        <button type="button" onClick={onLobby} className="min-h-12 cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-bold text-ink shadow-[0_6px_16px_rgba(15,23,42,.18)]">← Về sảnh</button>
        <button type="button" disabled={busy} onClick={onAgain} className="min-h-12 cursor-pointer rounded-full border-0 bg-green px-5 text-base font-black text-white shadow-[0_8px_20px_rgba(22,163,74,.45)] disabled:opacity-60">Chơi tiếp</button>
      </div></FixedBar>
    </div>
  )
}
