import { splitBrand } from '@/lib/fun/brand'

/** Plain text where the mascot and the game currency names are bold brand green (not italic). */
export default function BrandText({ text, coinName }: { text: string; coinName?: string }) {
  return (
    <>
      {splitBrand(text, coinName).map((part, i) => (part.brand
        ? <b key={i} className="font-extrabold not-italic text-green">{part.text}</b>
        : <span key={i}>{part.text}</span>))}
    </>
  )
}
