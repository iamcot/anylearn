import { Button, Card, Col, Flex, Row, Select, Statistic, Table, Tag, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import { fmtDateTime } from '../utils/format'

const GAMES = {
  checkin: ['Điểm danh', 'green'],
  quiz: ['Quiz', 'blue'],
  sticker: ['Sticker', 'purple'],
  explore: ['Khám phá', 'orange'],
  banner: ['Banner', 'magenta'],
  ref: ['Giới thiệu', 'cyan'],
}
const GAME_OPTIONS = Object.entries(GAMES).map(([value, [label]]) => ({ value, label }))

const TYPE_LABELS = { claim: 'Mở quà điểm danh', register: 'Đăng ký qua link' }

export default function FunEvents() {
  const navigate = useNavigate()
  const [game, setGame] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 30

  const { data, isLoading } = useQuery({
    queryKey: ['admin-fun-events', game, page],
    queryFn: () => client.get('/admin/fun/events', { params: { game: game || undefined, page, size: pageSize } }).then(r => r.data?.data ?? {}),
    refetchInterval: 30000,
  })

  const columns = [
    { title: 'Giờ', dataIndex: 'createdAt', width: 150, render: fmtDateTime },
    { title: 'Game', dataIndex: 'game', width: 110, render: g => <Tag color={GAMES[g]?.[1]}>{GAMES[g]?.[0] ?? g}</Tag> },
    {
      title: 'Thành viên', key: 'user', width: 180,
      render: (_, r) => r.userId
        ? <div><a href={`/admin/users?q=${r.userPhone ?? r.userId}`}>{r.userName || `#${r.userId}`}</a><div style={{ fontSize: 12, color: '#888' }}>{r.userPhone}</div></div>
        : <span style={{ color: '#888' }}>—</span>,
    },
    { title: 'Sự kiện', dataIndex: 'type', width: 170, render: t => TYPE_LABELS[t] ?? t },
    { title: 'Chi tiết', dataIndex: 'detail' },
    { title: 'anyPoint', dataIndex: 'points', width: 90, align: 'right', render: p => (p ? `+${p}` : '') },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="flex-start" wrap gap={8}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>Sự kiện game</Typography.Title>
        <Flex gap={8}>
          <Button onClick={() => navigate('/fun-checkin')}>Điểm danh & quà</Button>
          <Button onClick={() => navigate('/stickers')}>Sticker</Button>
          <Button onClick={() => navigate('/quiz-bank')}>Kho câu hỏi</Button>
        </Flex>
      </Flex>
      <Typography.Paragraph type="secondary">Mọi việc xảy ra trong các game của Vui học, mới nhất ở trên. Tự làm mới mỗi 30 giây.</Typography.Paragraph>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Người chơi hôm nay" value={data?.playersToday ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Sự kiện hôm nay" value={data?.eventsToday ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="anyPoint phát ra hôm nay" value={data?.pointsToday ?? 0} /></Card></Col>
        <Col xs={12} md={6}><Card size="small"><Statistic title="Đăng ký từ link giới thiệu" value={data?.referralsToday ?? 0} /></Card></Col>
      </Row>
      <Card>
        <Select
          allowClear placeholder="Tất cả game" style={{ width: 200, marginBottom: 12 }}
          value={game || undefined} options={GAME_OPTIONS}
          onChange={value => { setGame(value ?? ''); setPage(1) }}
        />
        <Table
          rowKey="id" size="small" loading={isLoading} columns={columns} dataSource={data?.items ?? []}
          scroll={{ x: 760 }}
          pagination={{ current: page, pageSize, total: data?.total ?? 0, showSizeChanger: false, onChange: setPage }}
        />
      </Card>
    </div>
  )
}
