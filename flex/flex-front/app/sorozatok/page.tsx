import React from 'react';
import Link from 'next/link';

// Típus a backend válaszhoz
interface MediaItem {
  id: number;
  name: string;
  extension: string;
  size: number;
}

async function getSeries(): Promise<MediaItem[]> {
  const res = await fetch('http://localhost:8000/api/sorozatok', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.series || [];
}

const Page = async () => {
  const series = await getSeries();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Sorozatok</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {series.length === 0 ? (
          <div role="alert" className="alert alert-warning mb-8">
            <span>
              Nincs indexelt tartalom. Kérlek, indítsd el az indexelést a backend oldalon!
            </span>
          </div>
        ) : (
          series.map((item) => (
            <Link key={item.id} href={`/sorozatok/${item.id}`}>
              <div className="card bg-base-100 shadow-md hover:shadow-xl transition cursor-pointer">
                <div className="card-body">
                  <h2 className="card-title">{item.name}</h2>
                  <p className="text-sm text-base-content/70">
                    {item.extension} • {(item.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  <div className="card-actions justify-end">
                    <button className="btn btn-primary btn-sm">Részletek</button>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Page;
