const TONE_CLASS = {
  neutral: 'bg-bg text-muted',
  warning: 'bg-warn-soft text-warn-text',
  success: 'bg-green-soft text-green-dark',
  danger: 'bg-red-soft text-red',
  info: 'bg-blue-soft text-blue',
}

export type BadgeTone = keyof typeof TONE_CLASS

export default function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${TONE_CLASS[tone]}`}>{children}</span>
}
