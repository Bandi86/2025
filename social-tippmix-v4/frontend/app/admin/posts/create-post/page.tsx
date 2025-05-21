'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAdminPost, createUserPost } from '@/lib/admin/posts'
import { fetchCategories } from '@/lib/categories'


const postSchema = z.object({
  title: z.string().min(3, 'A cím legalább 3 karakter legyen!'),
  content: z.string().min(10, 'A tartalom legalább 10 karakter legyen!'),
  category: z.string().min(1, 'A kategória megadása kötelező!'),
  image: z.any().optional()
})

type PostFormValues = z.infer<typeof postSchema>

const CreatePostPage = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema)
  })

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  // Általános, újrahasznosítható submit handler
  const onSubmit = async (data: PostFormValues, mode: 'admin' | 'user' = 'admin') => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('content', data.content)
      if (data.category) formData.append('category', data.category)
      if (data.image && data.image[0]) formData.append('image', data.image[0])
      if (mode === 'admin') {
        await createAdminPost(formData)
      } else {
        await createUserPost(formData)
      }
      setSuccess('Sikeres poszt feltöltés!')
      reset()
    } catch (e: any) {
      setError(e?.message || 'Hiba történt a feltöltés során')
    } finally {
      setLoading(false)
    }
    
  }


  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-base-200 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Új poszt létrehozása</h1>
      <form className="space-y-4" onSubmit={handleSubmit((data) => onSubmit(data, 'admin'))}>

        <>
          <label className="label">
            <span className="label-text">Cím</span>
          </label>
          <input type="text" className="input input-bordered w-full" {...register('title')} />
          {errors.title && <span className="text-error text-sm">{errors.title.message}</span>}
        </>
        <div>
          <label className="label">
            <span className="label-text">Tartalom</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full min-h-[120px]"
            {...register('content')}
          />
          {errors.content && <span className="text-error text-sm">{errors.content.message}</span>}
        </div>
        <div>
          <label className="label">
            <span className="label-text">Kategória</span>
          </label>
          <select className="select select-bordered w-full" {...register('category')}>
            <option value="">Válassz kategóriát</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && <span className="text-error text-sm">{errors.category.message}</span>}
        </div>
        <div>
          <label className="label">
            <span className="label-text">Kép feltöltése (opcionális)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            className="file-input file-input-bordered w-full"
            {...register('image')}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Feltöltés...' : 'Poszt létrehozása'}
        </button>
        {error && <div className="alert alert-error mt-2">{error}</div>}
        {success && <div className="alert alert-success mt-2">{success}</div>}
      </form>
    </div>
  )
}

export default CreatePostPage
