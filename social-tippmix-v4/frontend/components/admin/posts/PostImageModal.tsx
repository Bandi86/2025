'use client'
import React, { useState } from 'react'

export default function PostImageModal({ imageUrl, title }: { imageUrl: string; title: string }) {
  const [show, setShow] = useState(false)

  if (!imageUrl) return null

  return (
    <>
      <img
        src={imageUrl}
        alt={title}
        className="w-full max-h-96 object-cover rounded mb-4 cursor-pointer"
        onClick={() => setShow(true)}
      />
      {show && (
        <dialog id="post-image-modal" className="modal modal-middle open" open>
          <div className="modal-box p-2 max-w-2xl">
            <img src={imageUrl} alt={title} className="w-full h-auto rounded" />
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShow(false)}>close</button>
          </form>
        </dialog>
      )}
    </>
  )
}
