import type { ComponentType, SVGProps } from 'react'
import {
  BookIcon, CalculatorIcon, ChatIcon, CoinIcon, GlobeIcon, LightbulbIcon, MicIcon, MusicIcon, PencilIcon, SchoolIcon,
} from '@/components/icons'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const CATEGORY_ICONS: Record<string, IconComponent> = {
  'tieng-anh': GlobeIcon,
  'ielts': PencilIcon,
  'ky-nang-song': MicIcon,
  'tam-ly-hoc-duong': LightbulbIcon,
  'mam-non-tu-thuc': SchoolIcon,
  'mam-non-song-ngu': SchoolIcon,
  'mam-non-quoc-te': SchoolIcon,
  'toan-hoc': CalculatorIcon,
  'toan-pho-thong': CalculatorIcon,
  'toan-cambridge': CalculatorIcon,
  'ngoai-ngu': ChatIcon,
  'tai-chinh': CoinIcon,
  'cam-thu-am-nhac': MusicIcon,
}

export default function CategoryIcon({ url, className }: { url: string; className?: string }) {
  const Icon = CATEGORY_ICONS[url] ?? BookIcon
  return <Icon className={className} />
}
