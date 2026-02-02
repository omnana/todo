import type { Task, Category } from '../types';

// LocalStorage 键名常量
export const STORAGE_KEYS = {
  TASKS: 'todo-tasks',
  CATEGORIES: 'todo-categories',
} as const;

// LocalStorage 服务类
export class LocalStorageService {
  // 获取任务列表
  static getTasks(): Task[] {
    try {
      const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('Error reading tasks from localStorage:', error);
      return [];
    }
  }

  // 保存任务列表
  static saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }

  // 获取分类列表
  static getCategories(): Category[] {
    try {
      const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return categories ? JSON.parse(categories) : this.getDefaultCategories();
    } catch (error) {
      console.error('Error reading categories from localStorage:', error);
      return this.getDefaultCategories();
    }
  }

  // 保存分类列表
  static saveCategories(categories: Category[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories to localStorage:', error);
    }
  }

  // 获取默认分类
  static getDefaultCategories(): Category[] {
    return [
      { id: '1', name: '工作', color: '#3B82F6' },
      { id: '2', name: '学习', color: '#10B981' },
      { id: '3', name: '生活', color: '#F59E0B' },
      { id: '4', name: '购物', color: '#EF4444' },
      { id: '5', name: '其他', color: '#6B7280' },
    ];
  }

  // 导出数据
  static exportData(): { tasks: Task[]; categories: Category[] } {
    return {
      tasks: this.getTasks(),
      categories: this.getCategories(),
    };
  }

  // 导入数据
  static importData(data: { tasks: Task[]; categories: Category[] }): void {
    this.saveTasks(data.tasks);
    this.saveCategories(data.categories);
  }

  // 清空所有数据
  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  }
}
