'use client';

import { useState } from 'react';
import { NewProblemForm } from '@/app/types';
import { Plus, X, Link } from 'lucide-react';

interface AddProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (problem: NewProblemForm) => Promise<void>;
  categories: string[];
}

export const AddProblemModal = ({ isOpen, onClose, onAdd, categories }: AddProblemModalProps) => {
  const [formData, setFormData] = useState<NewProblemForm>({
    title: '',
    difficulty: 'Easy',
    category: '',
    url: '',
    description: '', // Keep for backend compatibility but will be auto-generated
    code: '',
    language: 'javascript',
    notes: '',
    tags: []
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.category.trim()) {
      alert('Please fill in all required fields (Title and Category)');
      return;
    }
    
    // Auto-generate description if empty
    const problemData = {
      ...formData,
      description: formData.description || `Problem: ${formData.title}`,
      category: formData.category.trim() // Clean up category name
    };
    
    await onAdd(problemData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      difficulty: 'Easy',
      category: '',
      url: '',
      description: '',
      code: '',
      language: 'javascript',
      notes: '',
      tags: []
    });
    setShowSuggestions(false);
    setFilteredCategories([]);
    setSelectedSuggestionIndex(-1);
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
    setSelectedSuggestionIndex(-1);
    
    if (value.trim()) {
      const filtered = categories.filter(cat => 
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredCategories([]);
      setShowSuggestions(false);
    }
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setFormData(prev => ({ ...prev, category: selectedCategory }));
    setShowSuggestions(false);
    setFilteredCategories([]);
    setSelectedSuggestionIndex(-1);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredCategories.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < filteredCategories.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredCategories.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleCategorySelect(filteredCategories[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  if (!isOpen) return null;

  return (
  <div className={"fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50 p-4"}>
  <div className={"bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"}>
  <div className={"flex items-center justify-between p-6 border-b border-gray-200"}>
          <h2 className={"text-2xl font-bold text-gray-900 flex items-center"}>
            <Plus className={"w-6 h-6 mr-2 text-blue-600"} />
            Add New Problem
          </h2>
          <button
            onClick={onClose}
            className={"text-gray-400 hover:text-gray-600 transition-colors"}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                placeholder="e.g., Two Sum"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem URL
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  placeholder="https://leetcode.com/problems/..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  onKeyDown={handleCategoryKeyDown}
                  onFocus={() => {
                    if (formData.category.trim()) {
                      handleCategoryChange(formData.category);
                    } else if (categories.length > 0) {
                      setFilteredCategories(categories);
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click
                    setTimeout(() => {
                      setShowSuggestions(false);
                      setSelectedSuggestionIndex(-1);
                    }, 200);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  placeholder="Type to search existing categories or create new one..."
                  required
                />
                
                {/* New Category Indicator */}
                {formData.category.trim() && !categories.some(cat => 
                  cat.toLowerCase() === formData.category.toLowerCase()
                ) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Plus className="w-3 h-3 mr-1" />
                      New
                    </span>
                  </div>
                )}
                
                {/* Suggestions Dropdown */}
                {showSuggestions && (filteredCategories.length > 0 || formData.category.trim()) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {/* Existing Categories */}
                    {filteredCategories.map((category, index) => (
                      <button
                        key={`existing-${index}`}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className={`w-full text-left px-3 py-2 transition-colors text-sm text-black ${
                          selectedSuggestionIndex === index 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <span className="flex items-center">
                          <span className="truncate">{category}</span>
                          <span className="ml-auto text-xs text-gray-500">existing</span>
                        </span>
                      </button>
                    ))}
                    
                    {/* Create New Category Option */}
                    {formData.category.trim() && !categories.some(cat => 
                      cat.toLowerCase() === formData.category.toLowerCase()
                    ) && (
                      <button
                        key="create-new"
                        type="button"
                        onClick={() => handleCategorySelect(formData.category.trim())}
                        className={`w-full text-left px-3 py-2 transition-colors text-sm border-t border-gray-200 ${
                          selectedSuggestionIndex === filteredCategories.length 
                            ? 'bg-green-100 text-green-700' 
                            : 'hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <span className="flex items-center">
                          <Plus className="w-4 h-4 mr-2" />
                          <span className="truncate">Create "{formData.category.trim()}"</span>
                          <span className="ml-auto text-xs text-green-600">new</span>
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-600 mt-1">
                {categories.length > 0 
                  ? `${categories.length} existing categories available. Start typing to search or create new.` 
                  : 'No existing categories. Create your first one!'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                style={{ color: 'black' }}
                required
              >
                <option value="Easy" style={{ color: 'black' }}>Easy</option>
                <option value="Medium" style={{ color: 'black' }}>Medium</option>
                <option value="Hard" style={{ color: 'black' }}>Hard</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Problem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};