'use client'

import { useState } from 'react'
import type { PublicUserProfile } from '@/lib/api'
import ChevronLabel from '@/components/ChevronLabel'
import { CloseIcon, SchoolIcon, UserIcon } from '@/components/icons'

export default function AuthorProfileCard({ profile }: { profile: PublicUserProfile }) {
  const [showFullContent, setShowFullContent] = useState(false)
  const isTeacher = profile.role === 'teacher'

  return (
    <>
      <div className="mb-6 flex overflow-hidden rounded-[22px] border border-blue-line bg-gradient-to-br from-blue-soft to-green-soft">
        <div className="relative size-24 shrink-0 self-start overflow-hidden sm:size-40">
          {profile.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.image} alt={profile.name} className="absolute inset-0 size-full object-cover" />
            : (
              <div className="grid size-full place-items-center bg-blue text-white">
                {isTeacher ? <UserIcon className="size-12" /> : <SchoolIcon className="size-12" />}
              </div>
            )
          }
        </div>
        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-blue">{isTeacher ? 'Chuyên gia' : 'Trường học'}</div>
          <h3 className="m-0 mb-2 text-lg font-medium text-ink sm:text-[22px]">{profile.name}</h3>
          {profile.introduce && <p className="m-0 mb-3 text-sm leading-[1.6] text-text">{profile.introduce}</p>}
          {profile.full_content && (
            <button type="button" onClick={() => setShowFullContent(true)} className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-medium text-blue">
              <ChevronLabel>Xem giới thiệu đầy đủ</ChevronLabel>
            </button>
          )}
        </div>
      </div>

      {showFullContent && profile.full_content && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-5" onClick={() => setShowFullContent(false)}>
          <div className="relative max-h-[80vh] w-full max-w-[720px] overflow-y-auto rounded-[26px] bg-white p-6 sm:p-8" onClick={event => event.stopPropagation()}>
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => setShowFullContent(false)}
              className="absolute right-2 top-2 grid size-11 cursor-pointer place-items-center border-0 bg-transparent text-muted hover:text-ink"
            >
              <CloseIcon />
            </button>
            <h3 className="m-0 mb-4 pr-8 text-[22px] font-medium text-ink">{profile.name}</h3>
            <div className="cms-content" dangerouslySetInnerHTML={{ __html: profile.full_content }} />
          </div>
        </div>
      )}
    </>
  )
}
