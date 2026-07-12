export default function FloatContact() {
  return (
    <div style={{
      position: 'fixed', right: 22, bottom: 22, zIndex: 60,
      display: 'flex', alignItems: 'center', gap: 9,
      borderRadius: 999, background: 'white',
      border: '1px solid #d8e8f8',
      boxShadow: '0 16px 42px rgba(15,23,42,0.12)',
      padding: '10px 14px 10px 10px',
      color: '#00539b', fontWeight: 900, cursor: 'pointer',
      textDecoration: 'none',
    }} role="button">
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: '#00539b', color: 'white',
        fontSize: 18, display: 'grid', placeItems: 'center',
      }}>💬</div>
      <strong style={{ fontSize: 14 }}>Cần giúp đỡ?</strong>
    </div>
  )
}
