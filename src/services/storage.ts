import type { Task, Category } from '../types';

// 存储接口定义
export interface IStorageService {
  // 任务相关操作
  getTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<void>;
  getTaskById(id: string): Promise<Task | null>;
  
  // 分类相关操作
  getCategories(): Promise<Category[]>;
  saveCategories(categories: Category[]): Promise<void>;
  getCategoryById(id: string): Promise<Category | null>;
  
  // 数据管理
  exportData(): Promise<{ tasks: Task[]; categories: Category[] }>;
  importData(data: { tasks: Task[]; categories: Category[] }): Promise<void>;
  clearAll(): Promise<void>;
  
  // 存储信息
  getStorageInfo(): Promise<{ used: number; available: number; total: number }>;
}

// LocalStorage 实现类
export class LocalStorageService implements IStorageService {
  private static readonly STORAGE_KEYS = {
    TASKS: 'todo-tasks',
    CATEGORIES: 'todo-categories',
    SETTINGS: 'todo-settings',
    BACKUP: 'todo-backup',
  } as const;

  private static readonly DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: '工作', color: '#3B82F6' },
    { id: '2', name: '学习', color: '#10B981' },
    { id: '3', name: '生活', color: '#F59E0B' },
    { id: '4', name: '购物', color: '#EF4444' },
    { id: '5', name: '其他', color: '#6B7280' },
  ];

  // 通用存储方法
  private static async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      // 验证数据完整性
      const parsed = JSON.parse(item);
      return this.validateData(parsed, defaultValue);
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  private static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      throw new Error(`Failed to save data to localStorage: ${error}`);
    }
  }

  // 数据验证
  private static validateData<T>(data: any, defaultValue: T): T {
    if (!data || typeof data !== 'object') {
      return defaultValue;
    }
    
    // 验证数组类型数据
    if (Array.isArray(defaultValue)) {
      return (Array.isArray(data) ? data : defaultValue) as T;
    }
    
    return data;
  }

  // 获取任务列表
  async getTasks(): Promise<Task[]> {
    return LocalStorageService.getItem<Task[]>(
      LocalStorageService.STORAGE_KEYS.TASKS,
      []
    );
  }

  // 保存任务列表
  async saveTasks(tasks: Task[]): Promise<void> {
    // 验证任务数据
    const validatedTasks = tasks.map(task => ({
      id: task.id || Date.now().toString(),
      title: task.title || '未命名任务',
      description: task.description || '',
      category: task.category || '其他',
      priority: task.priority || 'medium',
      dueDate: task.dueDate || undefined,
      completed: Boolean(task.completed),
      createdAt: task.createdAt || new Date().toISOString(),
    }));

    await LocalStorageService.setItem(
      LocalStorageService.STORAGE_KEYS.TASKS,
      validatedTasks
    );
  }

  // 根据ID获取任务
  async getTaskById(id: string): Promise<Task | null> {
    const tasks = await this.getTasks();
    return tasks.find(task => task.id === id) || null;
  }

  // 获取分类列表
  async getCategories(): Promise<Category[]> {
    return LocalStorageService.getItem<Category[]>(
      LocalStorageService.STORAGE_KEYS.CATEGORIES,
      LocalStorageService.DEFAULT_CATEGORIES
    );
  }

  // 保存分类列表
  async saveCategories(categories: Category[]): Promise<void> {
    // 验证分类数据
    const validatedCategories = categories.map(category => ({
      id: category.id || Date.now().toString(),
      name: category.name || '未命名分类',
      color: category.color || '#6B7280',
    }));

    await LocalStorageService.setItem(
      LocalStorageService.STORAGE_KEYS.CATEGORIES,
      validatedCategories
    );
  }

  // 根据ID获取分类
  async getCategoryById(id: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find(category => category.id === id) || null;
  }

  // 导出数据
  async exportData(): Promise<{ tasks: Task[]; categories: Category[] }> {
    const [tasks, categories] = await Promise.all([
      this.getTasks(),
      this.getCategories()
    ]);

    return {
      tasks,
      categories,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    } as any;
  }

  // 导入数据
  async importData(data: { tasks: Task[]; categories: Category[] }): Promise<void> {
    // 验证导入数据
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid import data format');
    }

    const { tasks = [], categories = [] } = data;

    // 验证任务数据
    if (!Array.isArray(tasks)) {
      throw new Error('Tasks must be an array');
    }

    // 验证分类数据
    if (!Array.isArray(categories)) {
      throw new Error('Categories must be an array');
    }

    // 创建备份
    await this.createBackup();

    // 导入数据
    await Promise.all([
      this.saveTasks(tasks),
      this.saveCategories(categories)
    ]);
  }

  // 创建数据备份
  private async createBackup(): Promise<void> {
    const currentData = await this.exportData();
    await LocalStorageService.setItem(
      LocalStorageService.STORAGE_KEYS.BACKUP,
      currentData
    );
  }

  // 恢复备份数据
  async restoreBackup(): Promise<void> {
    const backup = await LocalStorageService.getItem(
      LocalStorageService.STORAGE_KEYS.BACKUP,
      null
    );

    if (!backup) {
      throw new Error('No backup found');
    }

    const { tasks, categories } = backup;
    await Promise.all([
      this.saveTasks(tasks),
      this.saveCategories(categories)
    ]);
  }

  // 清空所有数据
  async clearAll(): Promise<void> {
    try {
      Object.values(LocalStorageService.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw new Error(`Failed to clear data: ${error}`);
    }
  }

  // 获取存储信息
  async getStorageInfo(): Promise<{ used: number; available: number; total: number }> {
    try {
      let used = 0;
      
      // 计算已使用的存储空间
      Object.values(LocalStorageService.STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          used += new Blob([item]).size;
        }
      });

      // 估算可用空间 (通常为5-10MB)
      const estimated = 5 * 1024 * 1024; // 5MB
      const available = Math.max(0, estimated - used);
      const total = estimated;

      return { used, available, total };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }

  // 压缩存储数据
  async optimizeStorage(): Promise<void> {
    try {
      const [tasks, categories] = await Promise.all([
        this.getTasks(),
        this.getCategories()
      ]);

      // 清理无效数据
      const validTasks = tasks.filter(task => 
        task && task.id && task.title && typeof task.completed === 'boolean'
      );

      const validCategories = categories.filter(category =>
        category && category.id && category.name
      );

      // 重新保存清理后的数据
      await Promise.all([
        this.saveTasks(validTasks),
        this.saveCategories(validCategories)
      ]);
    } catch (error) {
      console.error('Error optimizing storage:', error);
      throw new Error(`Failed to optimize storage: ${error}`);
    }
  }

  // 检查存储可用性
  static isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // 获取默认分类
  static getDefaultCategories(): Category[] {
    return [...LocalStorageService.DEFAULT_CATEGORIES];
  }
}

// 创建存储服务实例
export const storageService = new LocalStorageService();

// 存储服务工厂（便于扩展其他存储方式）
export class StorageServiceFactory {
  static create(type: 'localStorage' = 'localStorage'): IStorageService {
    switch (type) {
      case 'localStorage':
        if (!LocalStorageService.isStorageAvailable()) {
          throw new Error('LocalStorage is not available in this environment');
        }
        return new LocalStorageService();
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
}
