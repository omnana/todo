import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '../types';
import { LocalStorageService } from '../services/localStorage';

interface CategoryStore {
  categories: Category[];
  
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
  resetToDefault: () => void;
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      categories: LocalStorageService.getDefaultCategories(),

      // 操作方法
      addCategory: (categoryData) => {
        const newCategory: Category = {
          ...categoryData,
          id: Date.now().toString(),
        };
        
        set(state => ({
          categories: [...state.categories, newCategory]
        }));
      },

      updateCategory: (id, updates) => {
        set(state => ({
          categories: state.categories.map(category =>
            category.id === id ? { ...category, ...updates } : category
          )
        }));
      },

      deleteCategory: (id) => {
        set(state => ({
          categories: state.categories.filter(category => category.id !== id)
        }));
      },

      getCategoryById: (id) => {
        const { categories } = get();
        return categories.find(category => category.id === id);
      },

      resetToDefault: () => {
        set({
          categories: LocalStorageService.getDefaultCategories()
        });
      },
    }),
    {
      name: 'category-store',
      storage: {
        getItem: () => {
          const categories = LocalStorageService.getCategories();
          return { state: { categories } };
        },
        setItem: (_, value) => {
          LocalStorageService.saveCategories(value.state.categories);
        },
        removeItem: () => {
          LocalStorageService.saveCategories(LocalStorageService.getDefaultCategories());
        },
      },
      partialize: (state) => ({ categories: state.categories }),
    }
  )
);
