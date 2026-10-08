import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Button, Space } from 'antd'
import {
  BoldOutlined, ItalicOutlined, OrderedListOutlined,
  UnorderedListOutlined, LinkOutlined, UndoOutlined, RedoOutlined,
} from '@ant-design/icons'
import './RichEditor.css'

export default function RichEditor({ value, onChange, readOnly = false }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: value || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  }, [readOnly])

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
          <Button size="small" type="text" icon={<UndoOutlined />} onClick={() => editor.chain().focus().undo().run()} />
          <Button size="small" type="text" icon={<RedoOutlined />} onClick={() => editor.chain().focus().redo().run()} />
        </Space>
      )}
      <EditorContent editor={editor} style={{ padding: '8px 12px', minHeight: 200 }} />
    </div>
  )
}
