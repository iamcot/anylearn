export default function FloatContact() {
  return (
    <div
      className="fixed right-5 bottom-5 z-60 flex items-center gap-2 rounded-full bg-white border border-[#d8e8f8] shadow-[0_16px_42px_rgba(15,23,42,0.12)] py-2.5 pl-2.5 pr-3.5 text-blue font-black cursor-pointer no-underline"
      role="button"
    >
      <div className="w-10 h-10 rounded-full bg-blue text-white text-lg grid place-items-center">💬</div>
      <strong className="text-sm">Cần giúp đỡ?</strong>
    </div>
  )
}
