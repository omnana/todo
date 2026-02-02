import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus, TaskStats, Priority } from '../types';
import { storageService } from '../services/storage';
import { DataTransformer, StorageStats } from '../utils/storageUtils';

interface TaskStore {
  // 状态
  tasks: Task[];
  searchQuery: string;
  selectedCategory: string | null;
  filterStatus: TaskStatus | 'all';
  sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;

  // 计算属性
  filteredTasks: () => Task[];
  stats: () => TaskStats;
  tasksByCategory: () => Record<string, Task[]>;
  tasksByPriority: () => Record<Priority, Task[]>;
  overdueTasks: () => Task[];
  todayTasks: () => Task[];

  // 操作方法
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  toggleAllTasks: (completed: boolean) => Promise<void>;
  clearCompleted: () => Promise<void>;
  deleteCompleted: () => Promise<void>;
  
  // 筛选和排序
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setFilterStatus: (status: TaskStatus | 'all') => void;
  setSortBy: (sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  clearFilters: () => void;
  
  // 批量操作
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => Promise<void>;
  bulkDeleteTasks: (ids: string[]) => Promise<void>;
  
  // 数据管理
  loadTasks: () => Promise<void>;
  exportTasks: () => Promise<void>;
  importTasks: (tasks: Task[]) => Promise<void>;
  resetTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      tasks: [],
      searchQuery: '',
      selectedCategory: null,
      filterStatus: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isLoading: false,

      // 计算属性
      filteredTasks: () => {
        const { tasks, searchQuery, selectedCategory, filterStatus, sortBy, sortOrder } = get();
        
        let filtered = tasks.filter(task => {
          // 搜索过滤
          const matchesSearch = !searchQuery || 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
          
          // 分类过滤
          const matchesCategory = !selectedCategory || task.category === selectedCategory;
          
          // 状态过滤
          const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'completed' && task.completed) ||
            (filterStatus === 'todo' && !task.completed);
          
          return matchesSearch && matchesCategory && matchesStatus;
        });

        // 排序
        const sortFn = {
          createdAt: DataTransformer.sortByDate,
          dueDate: DataTransformer.sortByDueDate,
          priority: DataTransformer.sortByPriority,
          title: (tasks: Task[], order: 'asc' | 'desc') => 
            [...tasks].sort((a, b) => {
              const diff = a.title.localeCompare(b.title);
              return order === 'desc' ? -diff : diff;
            })
        };
        
        return sortFn[sortBy](filtered, sortOrder);
      },

      stats: () => {
        const { tasks } = get();
        return StorageStats.calculateTaskStats(tasks);
      },

      tasksByCategory: () => {
        const { tasks } = get();
        return tasks.reduce((acc, task) => {
          const category = task.category || '未分类';
          acc[category] = acc[category] || [];
          acc[category].push(task);
          return acc;
        }, {} as Record<string, Task[]>);
      },

      tasksByPriority: () => {
        const { tasks } = get();
        return {
          high: tasks.filter(task => task.priority === 'high'),
          medium: tasks.filter(task => task.priority === 'medium'),
          low: tasks.filter(task => task.priority === 'low'),
        };
      },

      overdueTasks: () => {
        const { tasks } = get();
        return DataTransformer.filterOverdueTasks(tasks);
      },

      todayTasks: () => {
        const { tasks } = get();
        return DataTransformer.filterTodayTasks(tasks);
      },

      // 操作方法
      addTask: async (taskData) => {
        set({ isLoading: true });
        try {
          const newTask: Task = {
            ...taskData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          };
          
          set(state => ({
            tasks: [...state.tasks, newTask]
          }));
          
          await storageService.saveTasks(get().tasks);
        } catch (error) {
          console.error('Error adding task:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateTask: async (id, updates) => {
        set({ isLoading: true });
        try {
          set(state => ({
            tasks: state.tasks.map(task =>
              task.id === id ? { ...task, ...updates } : task
            )
          }));
          
          await storageService.saveTasks(get().tasks);
        } catch (error) {
          console.error('Error updating task:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteTask: async (id) => {
        set({ isLoading: true });
        try {
          set(state => ({
            tasks: state.tasks.filter(task => task.id !== id)
          }));
          
          await storageService.saveTasks(get().tasks);
        } catch (error) {
          console.error('Error deleting task:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      toggleTask: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (task) {
          await get().updateTask(id, { completed: !task.completed });
        }
      },

      toggleAllTasks: async (completed) => {
        set({ isLoading: true });
        try {
          set(state => ({
            tasks: state.tasks.map(task => ({ ...task, completed }))
          }));
          
          await storageService.saveTasks(get().tasks);
        } catch (error) {
          console.error('Error toggling all tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearCompleted: async () => {
        set({ isLoading: true });
        try {
          set(state => ({
            tasks: state.tasks.filter(task => !task.completed)
          }));
          
          await storageService.saveTasks(get().tasks);
        } catch (error) {
          console.error('Error clearing completed tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteCompleted: async () => {
        set({ isLoading: true });
        try {
          set(state => ({
            tasks: state.tasks.filter(task => !task.completed)
          }));
          
          await storageService.saveTasks(get().tasks);
        } catch (error) {
          console.error('Error deleting completed tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // 筛选和排序
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      clearFilters: () => set({ 
        searchQuery: '', 
        selectedCategory: null, 
        filterStatus: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }),

      // 批量操作
      bulkUpdateTasks: async (ids, updates) => {
        set({ isLoading: true });
        try {
          set(state => ({
            tasks: state.tasks.map(task =>
              ids.includes(task.id) ? { ...task, ...updates } : task
            )
          }));
          
          await storageService.saveTasks(get().tasks);
        } catch (error) {
          console.error('Error bulk updating tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      bulkDeleteTasks: async (ids) => {
        set({ isLoading: true });
        try {
          set(state => ({
            tasks: state.tasks.filter(task => !ids.includes(task.id))
          }));
          
          await storageService.saveTasks(get().tasks);
        } catch (error) {
          console.error('Error bulk deleting tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // 数据管理
      loadTasks: async () => {
        set({ isLoading: true });
        try {
          const tasks = await storageService.getTasks();
          set({ tasks });
        } catch (error) {
          console.error('Error loading tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      exportTasks: async () => {
        try {
          const data = await storageService.exportData();
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
        } catch (error) {
          console.error('Error exporting tasks:', error);
          throw error;
        }
      },

      importTasks: async (tasks) => {
        set({ isLoading: true });
        try {
          await storageService.saveTasks(tasks);
          set({ tasks });
        } catch (error) {
          console.error('Error importing tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetTasks: async () => {
        set({ isLoading: true });
        try {
          await storageService.saveTasks([]);
          set({ tasks: [] });
        } catch (error) {
          console.error('Error resetting tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'task-store',
      partialize: (state) => ({ 
        tasks: state.tasks,
        searchQuery: state.searchQuery,
        selectedCategory: state.selectedCategory,
        filterStatus: state.filterStatus,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      }),
    }
  )
);
