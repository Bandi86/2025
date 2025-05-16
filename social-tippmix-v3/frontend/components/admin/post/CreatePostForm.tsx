'use client'

import { useState, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPost, createPostAsAdmin } from '@/lib/apicalls/apiWithAxios'
import { useSession } from 'next-auth/react'
import axios from 'axios'

interface CreatePostFormProps {
  authorId: string // Assuming authorId will be passed as a prop
}

export default function CreatePostForm({ authorId }: CreatePostFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('HIR') // Default kategória a Prisma enum szerint
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [contentCharCount, setContentCharCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  //const { data: session } = useSession()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImage(file)
    setImageUrl(null)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleImageUpload = async () => {
    if (!image) return null
    const formData = new FormData()
    formData.append('image', image)
    formData.append('slug', title.replace(/\s+/g, '-').toLowerCase())
    try {
      const res = await axios.post('/api/auth/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImageUrl(res.data.imageUrl)
      return res.data.imageUrl
    } catch (err: any) {
      setError('Kép feltöltése sikertelen')
      return null
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (!title || !content || !category) {
      setError('Minden mező kitöltése kötelező.')
      setIsLoading(false)
      return
    }
    let uploadedImageUrl = imageUrl
    if (image && !imageUrl) {
      uploadedImageUrl = await handleImageUpload()
      if (!uploadedImageUrl) {
        setIsLoading(false)
        return
      }
    }
    const postData = {
      title,
      content,
      category,
      authorId,
      imageUrl: uploadedImageUrl || undefined,
    }


    try {
      const response = await createPostAsAdmin(postData)

      setSuccess(`Poszt sikeresen létrehozva: ${title}`)
      setTitle('')
      setContent('')
      setCategory('HIR')
      setImage(null)
      setImagePreview(null)
      setImageUrl(null)
      router.refresh()
      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Hiba történt a poszt létrehozása során')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-white shadow-xl rounded-2xl max-w-lg mx-auto border border-gray-200"
    >
      <h2 className="text-2xl font-bold text-center mb-2">Új poszt létrehozása</h2>
      {error && <p className="text-red-600 bg-red-100 p-3 rounded text-center">{error}</p>}
      {success && (
        <p className="text-green-600 bg-green-100 p-3 rounded text-center">{success}</p>
      )}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">Cím</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full px-4 py-2 text-black border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-base"
        />
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-1">Tartalom</label>
        <textarea
          id="content"
          name="content"
          rows={5}
          required
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setContentCharCount(e.target.value.length)
          }}
          maxLength={1000}
          className="mt-1 block w-full px-4 py-2 border text-black border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-base"
        />
        <div className="text-right text-xs text-gray-500 mt-1">{contentCharCount}/1000 karakter</div>
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">Kategória</label>
        <select
          id="category"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 rounded-lg"
        >
          <option value="HIR">Hír</option>
          <option value="TIPP">Tipp</option>
          <option value="ELEMZES">Elemzés</option>
          <option value="KOZLEMENY">Közlemény</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Fénykép hozzáadása</label>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {imagePreview && (
            <img src={imagePreview} alt="Előnézet" className="h-16 w-16 object-cover rounded-lg border border-gray-300" />
          )}
        </div>
        {imageUrl && <p className="text-green-500 text-xs mt-1">Kép feltöltve!</p>}
      </div>
      <div>
        <button
          type="submit"
          disabled={isLoading || !title || !content || !category}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isLoading ? 'Létrehozás...' : 'Poszt Létrehozása'}
        </button>
      </div>
    </form>
  )
}
