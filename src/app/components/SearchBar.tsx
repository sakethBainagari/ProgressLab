import { Search, Shuffle } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onRandomProblem?: () => void;
}

export const SearchBar = ({ searchQuery, onSearchChange, onClearFilters, hasActiveFilters, onRandomProblem }: SearchBarProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleChange}
            placeholder="Search problems..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black placeholder-gray-500"
          />
        </div>
        
        {/* Random Problem Button */}
        {onRandomProblem && (
          <button
            onClick={onRandomProblem}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium whitespace-nowrap"
            title="Pick a random problem to solve"
          >
            <Shuffle className="w-4 h-4" />
            <span>Random</span>
          </button>
        )}
      </div>
      
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
};
