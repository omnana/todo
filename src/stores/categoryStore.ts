import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '../types';
import { storageService } from '../services/storage';

interface CategoryStore {
  categories: Category[];
  isLoading: boolean;
  
  // 基本操作
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;
  
  // 批量操作
  bulkAddCategories: (categories: Omit<Category, 'id'>[]) => Promise<void>;
  bulkUpdateCategories: (ids: string[], updates: Partial<Category>) => Promise<void>;
  bulkDeleteCategories: (ids: string[]) => Promise<void>;
  
  // 工具方法
  resetToDefault: () => Promise<void>;
  getCategoryCount: () => number;
  getCategoriesWithTaskCount: (tasks: any[]) => (Category & { taskCount: number })[];
  
  // 数据管理
  loadCategories: () => Promise<void>;
  exportCategories: () => Promise<void>;
  importCategories: (categories: Category[]) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      categories: [],
      isLoading: false,

      // 基本操作
      addCategory: async (categoryData) => {
        set({ isLoading: true });
        try {
          const newCategory: Category = {
            ...categoryData,
            id: Date.now().toString(),
          };
          
          set(state => ({
            categories: [...state.categories, newCategory]
          }));
          
          await storageService.saveCategories(get().categories);
        } catch (error) {
          console.error('Error adding category:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateCategory: async (id, updates) => {
        set({ isLoading: true });
        try {
          set(state => ({
            categories: state.categories.map(category =>
              category.id === id ? { ...category, ...updates } : category
            )
          }));
          
          await storageService.saveCategories(get().categories);
        } catch (error) {
          console.error('Error updating category:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteCategory: async (id) => {
        set({ isLoading: true });
        try {
          set(state => ({
            categories: state.categories.filter(category => category.id !== id)
          }));
          
          await storageService.saveCategories(get().categories);
        } catch (error) {
          console.error('Error deleting category:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      getCategoryById: (id) => {
        const { categories } = get();
        return categories.find(category => category.id === id);
      },

      getCategoryByName: (name) => {
        const { categories } = get();
        return categories.find(category => category.name === name);
      },

      // 批量操作
      bulkAddCategories: async (categoriesData) => {
        set({ isLoading: true });
        try {
          const newCategories = categoriesData.map(categoryData => ({
            ...categoryData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          }));
          
          set(state => ({
            categories: [...state.categories, ...newCategories]
          }));
          
          await storageService.saveCategories(get().categories);
        } catch (error) {
          console.error('Error bulk adding categories:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      bulkUpdateCategories: async (ids, updates) => {
        set({ isLoading: true });
        try {
          set(state => ({
            categories: state.categories.map(category =>
              ids.includes(category.id) ? { ...category, ...updates } : category
            )
          }));
          
          await storageService.saveCategories(get().categories);
        } catch (error) {
          console.error('Error bulk updating categories:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      bulkDeleteCategories: async (ids) => {
        set({ isLoading: true });
        try {
          set(state => ({
            categories: state.categories.filter(category => !ids.includes(category.id))
          }));
          
          await storageService.saveCategories(get().categories);
        } catch (error) {
          console.error('Error bulk deleting categories:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // 工具方法
      resetToDefault: async () => {
        set({ isLoading: true });
        try {
          const defaultCategories = await storageService.getCategories();
          set({ categories: defaultCategories });
        } catch (error) {
          console.error('Error resetting categories:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      getCategoryCount: () => {
        const { categories } = get();
        return categories.length;
      },

      getCategoriesWithTaskCount: (tasks) => {
        const { categories } = get();
        return categories.map(category => {
          const taskCount = tasks.filter(task => task.category === category.name).length;
          return { ...category, taskCount };
        });
      },

      // 数据管理
      loadCategories: async () => {
        set({ isLoading: true });
        try {
          const categories = await storageService.getCategories();
          set({ categories });
        } catch (error) {
          console.error('Error loading categories:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      exportCategories: async () => {
        try {
          const data = await storageService.exportData();
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `categories-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error exporting categories:', error);
          throw error;
        }
      },

      importCategories: async (categories) => {
        set({ isLoading: true });
        try {
          await storageService.saveCategories(categories);
          set({ categories });
        } catch (error) {
          console.error('Error importing categories:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'category-store',
      partialize: (state) => ({ 
        categories: state.categories,
        isLoading: state.isLoading
      }),
    }
  )
);
