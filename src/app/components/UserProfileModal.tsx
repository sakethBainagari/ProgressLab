'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDSAContext } from '../context/DSAContext';
import { User, Calendar, Trophy, Target, LogOut, X } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, logout } = useAuth();
  const { categories } = useDSAContext();
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate user statistics
  const userStats = React.useMemo(() => {
    const allProblems = categories.flatMap(category => [
      ...category.problems.Easy,
      ...category.problems.Medium,
      ...category.problems.Hard
    ]);
    
    const completed = allProblems.filter(p => p.completed);
    const totalProblems = allProblems.length;
    const completedCount = completed.length;
    
    const easyCompleted = categories.reduce((sum, cat) => 
      sum + cat.problems.Easy.filter(p => p.completed).length, 0
    );
    const mediumCompleted = categories.reduce((sum, cat) => 
      sum + cat.problems.Medium.filter(p => p.completed).length, 0
    );
    const hardCompleted = categories.reduce((sum, cat) => 
      sum + cat.problems.Hard.filter(p => p.completed).length, 0
    );

    const easyTotal = categories.reduce((sum, cat) => sum + cat.problems.Easy.length, 0);
    const mediumTotal = categories.reduce((sum, cat) => sum + cat.problems.Medium.length, 0);
    const hardTotal = categories.reduce((sum, cat) => sum + cat.problems.Hard.length, 0);

    return {
      totalProblems,
      completedCount,
      completionRate: totalProblems > 0 ? Math.round((completedCount / totalProblems) * 100) : 0,
      easyCompleted,
      mediumCompleted,
      hardCompleted,
      easyTotal,
      mediumTotal,
      hardTotal,
      lastSolved: completed.length > 0 ? 
        completed.reduce((latest, p) => 
          p.completedAt && new Date(p.completedAt) > new Date(latest.completedAt || 0) ? p : latest
        ).completedAt : null
    };
  }, [categories]);

  // Close modal on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                Member since {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Your Progress
          </h4>
          
          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-blue-600">{userStats.completedCount}/{userStats.totalProblems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${userStats.completionRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{userStats.completionRate}% Complete</span>
              <span>{userStats.totalProblems - userStats.completedCount} remaining</span>
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.easyCompleted}</div>
              <div className="text-xs text-gray-500">Easy</div>
              <div className="text-xs text-gray-400">{userStats.easyCompleted}/{userStats.easyTotal}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{userStats.mediumCompleted}</div>
              <div className="text-xs text-gray-500">Medium</div>
              <div className="text-xs text-gray-400">{userStats.mediumCompleted}/{userStats.mediumTotal}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{userStats.hardCompleted}</div>
              <div className="text-xs text-gray-500">Hard</div>
              <div className="text-xs text-gray-400">{userStats.hardCompleted}/{userStats.hardTotal}</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
              <div className="flex items-center text-green-600 mb-1">
                <Target className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Last Solved</span>
              </div>
              <div className="text-xs font-bold text-green-700">
                {userStats.lastSolved ? 
                  new Date(userStats.lastSolved).toLocaleDateString() : 
                  'No problems solved yet'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
