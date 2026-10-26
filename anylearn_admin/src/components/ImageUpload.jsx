import { Button, Space, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import client from '../api/client'

// Picks an image, sends it to the server and hands back its address.
export default function ImageUpload({ value, onChange }) {
  const handleChange = async ({ file }) => {
    const f = file.originFileObj || file
    const formData = new FormData()
    formData.append('file', f)
    try {
      const res = await client.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data?.data?.url
      if (url) onChange(url)
    } catch {}
  }
  return (
    <Upload showUploadList={false} customRequest={({ file, onSuccess }) => { handleChange({ file }); onSuccess?.() }} accept="image/*">
      <Space>
        {value && <img src={value} style={{ maxHeight: 60, borderRadius: 4 }} alt="" />}
        <Button size="small" icon={<UploadOutlined />}>Upload ảnh</Button>
      </Space>
    </Upload>
  )
}
