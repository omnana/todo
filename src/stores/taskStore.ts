import { create } from 'zustand';
import type { Task, TaskStatus, TaskStats } from '../types';
import { storageService } from '../services/storage';
import { DataTransformer, StorageStats } from '../utils/storageUtils';

interface TaskStore {
  // 状态
  tasks: Task[];
  searchQuery: string;
  selectedCategory: string | null;
  filterStatus: TaskStatus | 'all';

  // 计算属性
  filteredTasks: () => Task[];
  stats: () => TaskStats;

  // 操作方法
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setFilterStatus: (status: TaskStatus | 'all') => void;
  clearCompleted: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      tasks: [],
      searchQuery: '',
      selectedCategory: null,
      filterStatus: 'all',

      // 计算属性
      filteredTasks: () => {
        const { tasks, searchQuery, selectedCategory, filterStatus } = get();
        
        return tasks.filter(task => {
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
      },

      stats: () => {
        const { tasks } = get();
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, pending, completed, completionRate };
      },

      // 操作方法
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        
        set(state => ({
          tasks: [...state.tasks, newTask]
        }));
      },

      updateTask: (id, updates) => {
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, ...updates } : task
          )
        }));
      },

      deleteTask: (id) => {
        set(state => ({
          tasks: state.tasks.filter(task => task.id !== id)
        }));
      },

      toggleTask: (id) => {
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
          )
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
      setFilterStatus: (status) => set({ filterStatus: status }),

      clearCompleted: () => {
        set(state => ({
          tasks: state.tasks.filter(task => !task.completed)
        }));
      },
    }),
    {
      name: 'task-store',
      storage: {
        getItem: () => {
          const tasks = LocalStorageService.getTasks();
          return { state: { tasks } };
        },
        setItem: (_, value) => {
          LocalStorageService.saveTasks(value.state.tasks);
        },
        removeItem: () => {
          LocalStorageService.saveTasks([]);
        },
      },
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);
