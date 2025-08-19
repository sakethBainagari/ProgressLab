import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Problem, Category, NewProblemForm } from '@/app/types';

// Helper function to convert Firestore data
const convertFirestoreData = (data: Record<string, unknown>): Record<string, unknown> => {
  const converted = { ...data };
  
  // Convert Timestamp fields to Date objects
  if (converted.createdAt && typeof (converted.createdAt as { toDate?: () => Date }).toDate === 'function') {
    converted.createdAt = (converted.createdAt as { toDate: () => Date }).toDate();
  }
  if (converted.updatedAt && typeof (converted.updatedAt as { toDate?: () => Date }).toDate === 'function') {
    converted.updatedAt = (converted.updatedAt as { toDate: () => Date }).toDate();
  }
  
  return converted;
};

export class FirebaseService {
  
  // Get user's categories
  static async getCategories(userId: string): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'users', userId, 'categories');
      const snapshot = await getDocs(query(categoriesRef, orderBy('name')));
      
      const categories: Category[] = [];
      for (const categoryDoc of snapshot.docs) {
        const categoryData = categoryDoc.data();
        
        // Get problems for this category
        const problemsRef = collection(db, 'users', userId, 'problems');
        const problemsQuery = query(problemsRef, where('category', '==', categoryDoc.id));
        const problemsSnapshot = await getDocs(problemsQuery);
        
        const problems = {
          Easy: [] as Problem[],
          Medium: [] as Problem[],
          Hard: [] as Problem[]
        };
        
        problemsSnapshot.docs.forEach(problemDoc => {
          const problemData = convertFirestoreData(problemDoc.data());
          const problem = { id: problemDoc.id, ...problemData } as Problem;
          problems[problem.difficulty].push(problem);
        });
        
        categories.push({
          id: categoryDoc.id,
          name: categoryData.name,
          description: categoryData.description,
          problems
        });
      }
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Add a new problem
  static async addProblem(userId: string, problemData: NewProblemForm): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Check if category exists, if not create it
      const categoriesRef = collection(db, 'users', userId, 'categories');
      const categoryQuery = query(categoriesRef, where('name', '==', problemData.category));
      const categorySnapshot = await getDocs(categoryQuery);
      
      let categoryId: string;
      
      if (categorySnapshot.empty) {
        // Create new category
        const newCategoryRef = doc(categoriesRef);
        categoryId = newCategoryRef.id;
        
        batch.set(newCategoryRef, {
          name: problemData.category,
          description: `Problems for ${problemData.category}`,
          createdAt: new Date()
        });
      } else {
        categoryId = categorySnapshot.docs[0].id;
      }
      
      // Add the problem
      const problemsRef = collection(db, 'users', userId, 'problems');
      const newProblemRef = doc(problemsRef);
      
      const problem: Omit<Problem, 'id'> = {
        title: problemData.title,
        difficulty: problemData.difficulty,
        category: categoryId,
        tags: problemData.tags,
        description: problemData.description,
        code: problemData.code,
        language: problemData.language,
        notes: problemData.notes,
        url: problemData.url,
        completed: false,
        createdAt: new Date()
      };
      
      batch.set(newProblemRef, problem);
      
      await batch.commit();
      console.log('✅ Problem added successfully to Firebase');
    } catch (error) {
      console.error('❌ Error adding problem:', error);
      throw error;
    }
  }

  // Update a problem
  static async updateProblem(userId: string, problemId: string, updates: Partial<Problem>): Promise<void> {
    try {
      const problemRef = doc(db, 'users', userId, 'problems', problemId);
      await updateDoc(problemRef, {
        ...updates,
        updatedAt: new Date()
      });
      console.log('✅ Problem updated successfully');
    } catch (error) {
      console.error('❌ Error updating problem:', error);
      throw error;
    }
  }

  // Toggle problem completion
  static async toggleProblemCompletion(userId: string, problemId: string): Promise<void> {
    try {
      const problemRef = doc(db, 'users', userId, 'problems', problemId);
      const problemDoc = await getDoc(problemRef);
      
      if (problemDoc.exists()) {
        const currentStatus = problemDoc.data().completed;
        await updateDoc(problemRef, {
          completed: !currentStatus,
          completedAt: !currentStatus ? new Date() : null,
          updatedAt: new Date()
        });
        console.log('✅ Problem completion toggled');
      }
    } catch (error) {
      console.error('❌ Error toggling problem completion:', error);
      throw error;
    }
  }

  // Delete a problem
  static async deleteProblem(userId: string, problemId: string): Promise<void> {
    try {
      const problemRef = doc(db, 'users', userId, 'problems', problemId);
      await deleteDoc(problemRef);
      console.log('✅ Problem deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting problem:', error);
      throw error;
    }
  }

  // Delete a category and all its problems
  static async deleteCategory(userId: string, categoryId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete all problems in this category
      const problemsRef = collection(db, 'users', userId, 'problems');
      const problemsQuery = query(problemsRef, where('category', '==', categoryId));
      const problemsSnapshot = await getDocs(problemsQuery);
      
      problemsSnapshot.docs.forEach(problemDoc => {
        batch.delete(problemDoc.ref);
      });
      
      // Delete the category
      const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
      batch.delete(categoryRef);
      
      await batch.commit();
      console.log('✅ Category and all problems deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      throw error;
    }
  }

  // Set up real-time listener for categories and problems
  static onCategoriesChange(userId: string, callback: (categories: Category[]) => void) {
    const categoriesRef = collection(db, 'users', userId, 'categories');
    const problemsRef = collection(db, 'users', userId, 'problems');
    
    // Function to rebuild categories with current data
    const rebuildCategories = async () => {
      try {
        const categories: Category[] = [];
        
        // Get all categories
        const categoriesSnapshot = await getDocs(query(categoriesRef, orderBy('name')));
        // Get all problems
        const problemsSnapshot = await getDocs(problemsRef);
        
        // Group problems by category
        const problemsByCategory: { [categoryId: string]: Problem[] } = {};
        problemsSnapshot.docs.forEach(problemDoc => {
          const problemData = convertFirestoreData(problemDoc.data());
          const problem = { id: problemDoc.id, ...problemData } as Problem;
          
          if (!problemsByCategory[problem.category]) {
            problemsByCategory[problem.category] = [];
          }
          problemsByCategory[problem.category].push(problem);
        });
        
        // Build categories with their problems
        for (const categoryDoc of categoriesSnapshot.docs) {
          const categoryData = categoryDoc.data();
          const categoryProblems = problemsByCategory[categoryDoc.id] || [];
          
          const problems = {
            Easy: [] as Problem[],
            Medium: [] as Problem[],
            Hard: [] as Problem[]
          };
          
          categoryProblems.forEach(problem => {
            problems[problem.difficulty].push(problem);
          });
          
          categories.push({
            id: categoryDoc.id,
            name: categoryData.name,
            description: categoryData.description,
            problems
          });
        }
        
        callback(categories);
      } catch (error) {
        console.error('Error rebuilding categories:', error);
      }
    };
    
    // Set up listeners for both collections
    const unsubscribeCategories = onSnapshot(categoriesRef, () => {
      rebuildCategories();
    });
    
    const unsubscribeProblems = onSnapshot(problemsRef, () => {
      rebuildCategories();
    });
    
    // Initial load
    rebuildCategories();
    
    // Return combined unsubscribe function
    return () => {
      unsubscribeCategories();
      unsubscribeProblems();
    };
  }
}
