import { InputNumber, Switch } from 'antd'

// Settings tables from the backend (`{key, label, def, min, max}`) store on/off switches as numbers 0/1.
// A field with min 0 and max 1 is such a switch: it is shown as a toggle, everything else as a number box.
export const isFlagField = f => Number(f?.min) === 0 && Number(f?.max) === 1

// Labels written for the number box ("Bật (1 = có, 0 = tắt)", "... (1 = bật)") lose the 0/1 hint next to a toggle.
export const settingLabel = f => (isFlagField(f) ? String(f.label).replace(/\s*\((?:[^()]*\b[01]\s*=[^()]*)\)\s*$/, '') : f.label)

export const settingHint = f => isFlagField(f)
  ? `Mặc định ${Number(f.def) === 1 ? 'bật' : 'tắt'}`
  : `Mặc định ${Number(f.def).toLocaleString('vi-VN')} · từ ${Number(f.min).toLocaleString('vi-VN')} đến ${Number(f.max).toLocaleString('vi-VN')}`

/** Form control for one settings field: value stays a number (0/1 for a switch), so saving is unchanged. */
export default function SettingInput({ field, value, onChange, style, ...rest }) {
  if (isFlagField(field)) {
    return <Switch checked={Number(value) === 1} onChange={v => onChange?.(v ? 1 : 0)} checkedChildren="Bật" unCheckedChildren="Tắt" {...rest} />
  }
  return <InputNumber min={field.min} max={field.max} value={value} onChange={onChange} style={{ width: '100%', ...style }} {...rest} />
}
