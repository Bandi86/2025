import React from 'react'
import { getMovieItem } from '@/app/helpers/getMovieItem'

interface PageProps {
  params: { id: string }
}

const Page = async ({ params }: PageProps) => {
  const { id } = await params
  const item = await getMovieItem(id)
  if (!item) {
    return (
      <div className="container mx-auto py-8">
        <div className="alert alert-error">Nincs ilyen film.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">{item.name}</h2>
          <p className="text-base-content/70 mb-2">
            {item.extension} • {(item.size / (1024 * 1024)).toFixed(1)} MB
          </p>
          <div className="divider" />
          <video
            className="w-full rounded-box"
            controls
            src={`http://localhost:8000/api/stream/${item.id}`}
            poster={`https://picsum.photos/600/340?random=${item.id}`}
          >
            A böngésződ nem támogatja a videó lejátszást.
          </video>
        </div>
      </div>
    </div>
  )
}

export default Page
