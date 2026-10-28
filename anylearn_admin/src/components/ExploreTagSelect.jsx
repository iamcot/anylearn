import { Select, message } from 'antd'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'

/** Tags of an Explore post, from the dictionary shared with courses; an admin may create a missing one here. */
export default function ExploreTagSelect({ value, onChange }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const { data } = useQuery({
    queryKey: ['admin-tags-picker'],
    queryFn: () => client.get('/admin/tags').then(r => r.data?.data?.tags ?? []),
    staleTime: 5 * 60 * 1000,
  })
  const create = useMutation({
    mutationFn: name => client.post('/admin/tags', { name }).then(r => r.data),
    onSuccess: res => {
      if (res.resultCode !== 1) return message.error(res.message)
      onChange?.([...(value ?? []), res.data.id])
      setSearch('')
      qc.invalidateQueries({ queryKey: ['admin-tags-picker'] })
    },
  })
  const options = (data ?? []).filter(t => t.status === 1 || (value ?? []).includes(t.id)).map(t => ({ value: t.id, label: t.name }))
  const typed = search.trim()
  const exists = options.some(o => o.label.toLowerCase() === typed.toLowerCase())
  return (
    <Select mode="multiple" allowClear placeholder="Chọn tag (dùng chung với khóa học)" value={value ?? []} onChange={onChange} options={options}
      searchValue={search} onSearch={setSearch} optionFilterProp="label" maxCount={8}
      notFoundContent={typed && !exists ? <a onClick={() => create.mutate(typed)}>+ Tạo tag “{typed}”</a> : null} />
  )
}
