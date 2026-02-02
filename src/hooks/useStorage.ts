import { useState, useEffect, useCallback } from 'react';
import { storageService, LocalStorageService } from '../services/storage';
import type { Task, Category } from '../types';

// 存储状态钩子
export function useStorageState<T>(
  key: string,
  initialValue: T,
  fetchFn: () => Promise<T>,
  saveFn: (value: T) => Promise<void>
) {
  const [state, setState] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFn();
      setState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error(`Error loading ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn]);

  // 保存数据
  const save = useCallback(async (value: T) => {
    try {
      setError(null);
      await saveFn(value);
      setState(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save data');
      console.error(`Error saving ${key}:`, err);
      throw err;
    }
  }, [key, saveFn]);

  // 初始化加载
  useEffect(() => {
    load();
  }, [load]);

  return { state, setState: save, loading, error, reload: load };
}

// 任务存储钩子
export function useTasks() {
  const { state: tasks, setState: setTasks, loading, error, reload } = useStorageState(
    'tasks',
    [],
    () => storageService.getTasks(),
    (tasks) => storageService.saveTasks(tasks)
  );

  // 添加任务
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    const updatedTasks = [...tasks, newTask];
    await setTasks(updatedTasks);
    return newTask;
  }, [tasks, setTasks]);

  // 更新任务
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    );
    await setTasks(updatedTasks);
  }, [tasks, setTasks]);

  // 删除任务
  const deleteTask = useCallback(async (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    await setTasks(updatedTasks);
  }, [tasks, setTasks]);

  // 切换任务状态
  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      await updateTask(id, { completed: !task.completed });
    }
  }, [tasks, updateTask]);

  // 批量操作
  const toggleAllTasks = useCallback(async (completed: boolean) => {
    const updatedTasks = tasks.map(task => ({ ...task, completed }));
    await setTasks(updatedTasks);
  }, [tasks, setTasks]);

  const clearCompleted = useCallback(async () => {
    const updatedTasks = tasks.filter(task => !task.completed);
    await setTasks(updatedTasks);
  }, [tasks, setTasks]);

  return {
    tasks,
    loading,
    error,
    reload,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleAllTasks,
    clearCompleted,
  };
}

// 分类存储钩子
export function useCategories() {
  const { state: categories, setState: setCategories, loading, error, reload } = useStorageState(
    'categories',
    LocalStorageService.getDefaultCategories(),
    () => storageService.getCategories(),
    (categories) => storageService.saveCategories(categories)
  );

  // 添加分类
  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };
    
    const updatedCategories = [...categories, newCategory];
    await setCategories(updatedCategories);
    return newCategory;
  }, [categories, setCategories]);

  // 更新分类
  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const updatedCategories = categories.map((category: Category) =>
      category.id === id ? { ...category, ...updates } : category
    );
    await setCategories(updatedCategories);
  }, [categories, setCategories]);

  // 删除分类
  const deleteCategory = useCallback(async (id: string) => {
    const updatedCategories = categories.filter((category: Category) => category.id !== id);
    await setCategories(updatedCategories);
  }, [categories, setCategories]);

  // 重置为默认分类
  const resetToDefault = useCallback(async () => {
    const defaultCategories = LocalStorageService.getDefaultCategories();
    await setCategories(defaultCategories);
  }, [setCategories]);

  return {
    categories,
    loading,
    error,
    reload,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToDefault,
  };
}

// 存储信息钩子
export function useStorageInfo() {
  const [info, setInfo] = useState({ used: 0, available: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const storageInfo = await storageService.getStorageInfo();
      setInfo(storageInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get storage info');
      console.error('Error getting storage info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  return { info, loading, error, reload: loadInfo };
}

// 数据导入导出钩子
export function useDataImportExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 导出数据
  const exportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storageService.exportData();
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      console.error('Error exporting data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 导入数据
  const importData = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      await storageService.importData(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
      console.error('Error importing data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 清空所有数据
  const clearAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await storageService.clearAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
      console.error('Error clearing data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 优化存储
  const optimizeStorage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await storageService.optimizeStorage();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize storage');
      console.error('Error optimizing storage:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    exportData,
    importData,
    clearAll,
    optimizeStorage,
  };
}
