import React from 'react';
import DirectoryCard from './DirectoryCard';
import { Directory } from '@/app/lib/directoryApi';

interface DirectoryListProps {
  directories: Directory[];
  reload: () => void;
}

const DirectoryList: React.FC<DirectoryListProps> = ({ directories, reload }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {directories.map((dir) => (
        <DirectoryCard key={dir.id} directory={dir} reload={reload} />
      ))}
    </div>
  );
};

export default DirectoryList;
