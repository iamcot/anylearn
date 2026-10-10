import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { Button, Space } from 'antd'
import {
  BoldOutlined, ItalicOutlined, OrderedListOutlined,
  UnorderedListOutlined, LinkOutlined, UndoOutlined, RedoOutlined,
  PictureOutlined, PlayCircleOutlined,
} from '@ant-design/icons'
import client from '../api/client'
import './RichEditor.css'

export default function RichEditor({ value, onChange, readOnly = false }) {
  const fileInputRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ width: 640, height: 360, nocookie: false }),
    ],
    content: value || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  }, [readOnly])

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await client.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = res.data?.data?.url
      if (url) editor.chain().focus().setImage({ src: url }).run()
    } catch { /* silent */ }
    e.target.value = ''
  }

  // Sync external value changes into editor (e.g. when form.setFieldsValue is called)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const incoming = value || ''
    if (incoming !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(incoming, false) // false = suppress onUpdate to avoid loop
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      {!readOnly && (
        <Space style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }} size={2}>
          <Button size="small" type={editor.isActive('bold') ? 'primary' : 'text'} icon={<BoldOutlined />}
            onClick={() => editor.chain().focus().toggleBold().run()} />
          <Button size="small" type={editor.isActive('italic') ? 'primary' : 'text'} icon={<ItalicOutlined />}
            onClick={() => editor.chain().focus().toggleItalic().run()} />
          <Button size="small" type={editor.isActive('bulletList') ? 'primary' : 'text'} icon={<UnorderedListOutlined />}
            onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <Button size="small" type={editor.isActive('orderedList') ? 'primary' : 'text'} icon={<OrderedListOutlined />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <Button size="small" type="text" icon={<LinkOutlined />}
            onClick={() => {
              const url = window.prompt('URL:')
              if (url) editor.chain().focus().setLink({ href: url }).run()
            }} />
          <Button size="small" type="text" icon={<PictureOutlined />}
            onClick={() => fileInputRef.current?.click()} />
          <Button size="small" type="text" icon={<PlayCircleOutlined />}
            onClick={() => {
              const url = window.prompt('Nhập link YouTube:')
              if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run()
            }} />
          <Button size="small" type="text" icon={<UndoOutlined />} onClick={() => editor.chain().focus().undo().run()} />
          <Button size="small" type="text" icon={<RedoOutlined />} onClick={() => editor.chain().focus().redo().run()} />
        </Space>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      <EditorContent editor={editor} style={{ padding: '8px 12px', minHeight: 200 }} />
    </div>
  )
}
