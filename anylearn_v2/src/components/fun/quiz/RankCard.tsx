import type { QuizProfile } from '@/lib/api/quiz'
import RankBadge from './RankBadge'

/** Rank, star bar and guard of the player. */
export default function RankCard({ profile }: { profile: QuizProfile }) {
  const top = profile.needed <= 0
  return (
    <section className="rounded-3xl border border-line bg-white p-4 shadow-sm" aria-label="Hạng của bạn">
      <div className="flex items-center gap-4">
        <RankBadge rankKey={profile.rankKey} className="size-20" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-muted">Hạng hiện tại</div>
          <div className="text-2xl font-black leading-tight">{profile.rankName}</div>
          <div className="mt-1 text-sm font-bold text-ink">{top ? `${profile.stars} sao` : `${profile.stars} / ${profile.needed} sao`}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${profile.guard ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-muted'}`}>
          {profile.guard ? 'Có bảo hộ' : 'Hết bảo hộ'}
        </span>
      </div>
      {profile.stars > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1" aria-hidden="true">
          {Array.from({ length: Math.min(profile.stars, 12) }, (_, i) => (
            <svg key={i} viewBox="0 0 24 24" className="size-6">
              <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          ))}
          {profile.stars > 12 && <span className="text-sm font-black text-[#b45309]">+{profile.stars - 12}</span>}
        </div>
      )}
    </section>
  )
}
