// 任务优先级
export type Priority = 'low' | 'medium' | 'high';

// 任务状态
export type TaskStatus = 'todo' | 'completed';

// 任务接口
export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: Priority;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

// 分类接口
export interface Category {
  id: string;
  name: string;
  color: string;
}

// 统计数据接口
export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  completionRate: number;
}

// 应用状态接口
export interface AppState {
  tasks: Task[];
  categories: Category[];
  searchQuery: string;
  selectedCategory: string | null;
  filterStatus: TaskStatus | 'all';
}
