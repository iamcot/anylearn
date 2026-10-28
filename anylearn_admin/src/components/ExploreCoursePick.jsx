import { Button, Select, Space, Spin, Typography } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import { fmtVND } from '../utils/format'

function CourseLine({ course, onClear }) {
  return (
    <Space style={{ width: '100%', padding: 8, border: '1px solid #f0f0f0', borderRadius: 8 }} align="center">
      {course.image ? <img src={course.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 6 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Typography.Text strong ellipsis style={{ display: 'block', maxWidth: 340 }}>{course.title ?? `Khóa học #${course.id}`}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>#{course.id}{course.price != null ? ` · ${fmtVND(course.price)}` : ''}</Typography.Text>
      </div>
      {onClear && <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClear} aria-label="Bỏ khóa học" />}
    </Space>
  )
}

/**
 * The course attached to an Explore post: type to search (the same search as collections), pick one, it shows as one
 * small line with a ×. `preset` = what the post already knows about its course (title, image, price), so nothing is loaded.
 */
export default function ExploreCoursePick({ value, onChange, preset }) {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [picked, setPicked] = useState(preset?.id === value ? preset : null)
  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 300); return () => clearTimeout(t) }, [q])
  useEffect(() => { if (!value) setPicked(null); else if (preset?.id === value) setPicked(preset) }, [value, preset])
  const { data, isFetching } = useQuery({
    queryKey: ['explore-course-pick', debounced],
    queryFn: () => client.get('/admin/collections/course-search', { params: { q: debounced, pageSize: 12 } }).then(r => r.data?.data?.items ?? []),
    enabled: debounced.length >= 2,
  })
  if (value) return <CourseLine course={picked ?? { id: value }} onClear={() => onChange?.(null)} />
  const items = data ?? []
  return (
    <Select showSearch allowClear filterOption={false} placeholder="Gõ tên khóa học để tìm" value={null} style={{ width: '100%' }}
      onSearch={setQ} notFoundContent={isFetching ? <Spin size="small" /> : debounced.length >= 2 ? 'Không thấy khóa học' : 'Gõ ít nhất 2 chữ'}
      onChange={id => { const c = items.find(i => i.id === id); setPicked(c ? { id: c.id, title: c.title, image: c.image, price: c.price } : null); onChange?.(id) }}
      options={items.map(i => ({ value: i.id, label: <CourseLine course={i} /> }))} listHeight={360} />
  )
}
