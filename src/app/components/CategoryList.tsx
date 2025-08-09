import { Category } from '@/app/types';
import { FolderOpen, Trash2 } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string | null;
  selectedDifficulty: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onDifficultySelect: (difficulty: string | null) => void;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
}

export const CategoryList = ({ 
  categories, 
  selectedCategory, 
  selectedDifficulty,
  onCategorySelect, 
  onDifficultySelect,
  onDeleteCategory
}: CategoryListProps) => {

  const getDifficultyCount = (category: Category, difficulty: 'Easy' | 'Medium' | 'Hard') => {
    return category.problems[difficulty].length;
  };

  const getCompletedCount = (category: Category, difficulty: 'Easy' | 'Medium' | 'Hard') => {
    return category.problems[difficulty].filter(p => p.completed).length;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        {categories.length > 0 && (
          <button
            onClick={() => {
              onCategorySelect(null);
              onDifficultySelect(null);
            }}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              selectedCategory === null && selectedDifficulty === null
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            All
          </button>
        )}
      </div>
      
      {categories.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-2">No categories yet</p>
          <p className="text-xs text-gray-500">Categories will appear when you add problems</p>
        </div>
      ) : (
        <div className="space-y-1">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            const totalCount = getDifficultyCount(category, 'Easy') + getDifficultyCount(category, 'Medium') + getDifficultyCount(category, 'Hard');
            const completedCount = getCompletedCount(category, 'Easy') + getCompletedCount(category, 'Medium') + getCompletedCount(category, 'Hard');
            
            return (
              <div key={category.id}>
                <div
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    onCategorySelect(category.id);
                    onDifficultySelect(null);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {completedCount}/{totalCount}
                    </span>
                    {completedCount === totalCount && totalCount > 0 && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {onDeleteCategory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCategory(category.id);
                        }}
                        className="p-1 hover:bg-red-100 text-red-500 hover:text-red-700 rounded transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
