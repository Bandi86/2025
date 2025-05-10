import React from 'react';

export default function FilmekPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Filmek</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Itt jelennek majd meg a filmek kártyái */}
        <div className="p-4 bg-white rounded-lg shadow-md">
          <div className="h-40 bg-gray-200 rounded-md mb-3"></div>
          <h3 className="text-lg font-medium">Film címe betöltés alatt...</h3>
          <p className="text-sm text-gray-600">Hamarosan elérhető</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-md">
          <div className="h-40 bg-gray-200 rounded-md mb-3"></div>
          <h3 className="text-lg font-medium">Film címe betöltés alatt...</h3>
          <p className="text-sm text-gray-600">Hamarosan elérhető</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-md">
          <div className="h-40 bg-gray-200 rounded-md mb-3"></div>
          <h3 className="text-lg font-medium">Film címe betöltés alatt...</h3>
          <p className="text-sm text-gray-600">Hamarosan elérhető</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow-md">
          <div className="h-40 bg-gray-200 rounded-md mb-3"></div>
          <h3 className="text-lg font-medium">Film címe betöltés alatt...</h3>
          <p className="text-sm text-gray-600">Hamarosan elérhető</p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          A filmek hamarosan megjelennek. Jelenleg fejlesztés alatt áll ez a funkció.
        </p>
      </div>
    </div>
  );
}
