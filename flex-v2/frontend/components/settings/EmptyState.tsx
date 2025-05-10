import React from 'react';

interface EmptyStateProps {
  onAddClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick }) => (
  <div className="py-12 text-center">
    <div className="text-5xl mb-4 opacity-20">📁</div>
    <h3 className="text-xl font-medium mb-2">Még nincsenek szkennelt könyvtárak</h3>
    <p className="text-base-content/70 mb-4">
      Adj hozzá könyvtárakat a gépedről a médiatartalmak indexeléséhez
    </p>
    <button onClick={onAddClick} className="btn btn-primary">
      Könyvtár hozzáadása
    </button>
  </div>
);

export default EmptyState;
