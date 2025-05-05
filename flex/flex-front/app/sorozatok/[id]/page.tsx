import React from 'react';

interface MediaItem {
  id: number;
  name: string;
  extension: string;
  size: number;
}

async function getSeriesItem(id: string): Promise<MediaItem | null> {
  const res = await fetch(`http://localhost:8000/api/sorozatok`, { cache: 'no-store' });
  const data = await res.json();
  const item = data.series.find((s: MediaItem) => String(s.id) === id);
  return item || null;
}

interface PageProps {
  params: { id: string };
}

const Page = async ({ params }: PageProps) => {
  const item = await getSeriesItem(params.id);
  if (!item) {
    return (
      <div className="container mx-auto py-8">
        <div className="alert alert-error">Nincs ilyen sorozat.</div>
      </div>
    );
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
            src={`http://localhost:3000/api/stream/${item.id}`}
            poster={`https://picsum.photos/600/340?random=${item.id}`}
          >
            A böngésződ nem támogatja a videó lejátszást.
          </video>
        </div>
      </div>
    </div>
  );
};

export default Page;
