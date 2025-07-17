import { Button } from '@/components/ui/button';
import { ChevronDown, ArrowUpDown, Clock, Users, Hash } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface SortOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SortDropdownProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  disabled?: boolean;
}

const sortOptions: SortOption[] = [
  { value: 'time', label: 'Időpont szerint', icon: <Clock className="h-4 w-4" /> },
  { value: 'team', label: 'Csapat szerint', icon: <Users className="h-4 w-4" /> },
  { value: 'id', label: 'ID szerint', icon: <Hash className="h-4 w-4" /> },
];

export default function SortDropdown({
  sortBy,
  sortOrder,
  onSortChange,
  disabled = false,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentOption = sortOptions.find((opt) => opt.value === sortBy);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSortByChange = (newSortBy: string) => {
    onSortChange(newSortBy, sortOrder);
    setIsOpen(false);
  };

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="flex items-center gap-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {currentOption?.icon}
          {currentOption?.label || 'Rendezés'}
          <ChevronDown className="h-4 w-4" />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortByChange(option.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 ${
                  sortBy === option.value ? 'bg-gray-50' : ''
                }`}
              >
                {option.icon}
                <span className="ml-2">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleSortOrder}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        <ArrowUpDown className="h-4 w-4" />
        {sortOrder === 'asc' ? 'Növekvő' : 'Csökkenő'}
      </Button>
    </div>
  );
}
