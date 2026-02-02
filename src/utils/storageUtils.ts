import type { Task, Category } from '../types';

// 数据验证工具
export class DataValidator {
  // 验证任务数据
  static validateTask(task: any): Task | null {
    if (!task || typeof task !== 'object') return null;
    
    const validatedTask: Task = {
      id: typeof task.id === 'string' && task.id.length > 0 ? task.id : Date.now().toString(),
      title: typeof task.title === 'string' && task.title.trim().length > 0 ? task.title.trim() : '未命名任务',
      description: typeof task.description === 'string' ? task.description.trim() : '',
      category: typeof task.category === 'string' && task.category.trim().length > 0 ? task.category.trim() : '其他',
      priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
      dueDate: task.dueDate && typeof task.dueDate === 'string' ? task.dueDate : undefined,
      completed: Boolean(task.completed),
      createdAt: task.createdAt && typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString(),
    };
    
    return validatedTask;
  }

  // 验证分类数据
  static validateCategory(category: any): Category | null {
    if (!category || typeof category !== 'object') return null;
    
    const validatedCategory: Category = {
      id: typeof category.id === 'string' && category.id.length > 0 ? category.id : Date.now().toString(),
      name: typeof category.name === 'string' && category.name.trim().length > 0 ? category.name.trim() : '未命名分类',
      color: typeof category.color === 'string' && /^#[0-9A-F]{6}$/i.test(category.color) ? category.color : '#6B7280',
    };
    
    return validatedCategory;
  }

  // 验证颜色格式
  static isValidColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  // 生成随机颜色
  static generateRandomColor(): string {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

// 数据转换工具
export class DataTransformer {
  // 将任务转换为搜索索引
  static createSearchIndex(task: Task): string {
    const searchableText = [
      task.title,
      task.description || '',
      task.category,
      task.priority,
      task.dueDate || '',
    ].join(' ').toLowerCase();
    
    return searchableText;
  }

  // 按优先级排序任务
  static sortByPriority(tasks: Task[], order: 'asc' | 'desc' = 'desc'): Task[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return [...tasks].sort((a, b) => {
      const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
      return order === 'desc' ? -diff : diff;
    });
  }

  // 按创建时间排序任务
  static sortByDate(tasks: Task[], order: 'asc' | 'desc' = 'desc'): Task[] {
    return [...tasks].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return order === 'desc' ? -diff : diff;
    });
  }

  // 按截止日期排序任务
  static sortByDueDate(tasks: Task[], order: 'asc' | 'desc' = 'asc'): Task[] {
    return [...tasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return order === 'desc' ? -diff : diff;
    });
  }

  // 过滤过期任务
  static filterOverdueTasks(tasks: Task[]): Task[] {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      return new Date(task.dueDate) < now;
    });
  }

  // 过滤今日任务
  static filterTodayTasks(tasks: Task[]): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }

  // 过滤本周任务
  static filterWeekTasks(tasks: Task[]): Task[] {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= startOfWeek && dueDate < endOfWeek;
    });
  }
}

// 存储统计工具
export class StorageStats {
  // 计算任务统计
  static calculateTaskStats(tasks: Task[]) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // 按优先级统计
    const byPriority = {
      high: tasks.filter(task => task.priority === 'high').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      low: tasks.filter(task => task.priority === 'low').length,
    };
    
    // 按分类统计
    const byCategory = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 过期任务统计
    const overdue = DataTransformer.filterOverdueTasks(tasks).length;
    
    // 今日任务统计
    const today = DataTransformer.filterTodayTasks(tasks).length;
    
    return {
      total,
      completed,
      pending,
      completionRate,
      byPriority,
      byCategory,
      overdue,
      today,
    };
  }

  // 计算分类统计
  static calculateCategoryStats(categories: Category[], tasks: Task[]) {
    return categories.map(category => {
      const categoryTasks = tasks.filter(task => task.category === category.name);
      const completed = categoryTasks.filter(task => task.completed).length;
      const total = categoryTasks.length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        ...category,
        taskCount: total,
        completedCount: completed,
        completionRate,
      };
    });
  }

  // 生成统计报告
  static generateReport(tasks: Task[], categories: Category[]) {
    const taskStats = this.calculateTaskStats(tasks);
    const categoryStats = this.calculateCategoryStats(categories, tasks);
    
    return {
      generatedAt: new Date().toISOString(),
      taskStats,
      categoryStats,
      summary: {
        totalTasks: taskStats.total,
        completionRate: taskStats.completionRate,
        overdueTasks: taskStats.overdue,
        todayTasks: taskStats.today,
        mostUsedCategory: this.getMostUsedCategory(taskStats.byCategory),
        priorityDistribution: taskStats.byPriority,
      },
    };
  }

  // 获取最常用的分类
  private static getMostUsedCategory(byCategory: Record<string, number>) {
    const entries = Object.entries(byCategory);
    if (entries.length === 0) return null;
    
    const [category, count] = entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    return { category, count };
  }
}

// 数据备份工具
export class BackupManager {
  // 创建完整备份
  static createFullBackup(tasks: Task[], categories: Category[]) {
    const backup = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      data: {
        tasks,
        categories,
      },
      metadata: {
        totalTasks: tasks.length,
        totalCategories: categories.length,
        completedTasks: tasks.filter(task => task.completed).length,
      },
    };
    
    return backup;
  }

  // 验证备份数据
  static validateBackup(backup: any): boolean {
    if (!backup || typeof backup !== 'object') return false;
    
    const required = ['version', 'createdAt', 'data'];
    return required.every(field => backup[field] !== undefined);
  }

  // 合并备份数据
  static mergeBackup(
    currentTasks: Task[],
    currentCategories: Category[],
    backupTasks: Task[],
    backupCategories: Category[],
    strategy: 'replace' | 'merge' = 'merge'
  ) {
    if (strategy === 'replace') {
      return { tasks: backupTasks, categories: backupCategories };
    }
    
    // 合并策略：保留现有数据，添加不重复的备份数据
    const existingTaskIds = new Set(currentTasks.map(task => task.id));
    const existingCategoryIds = new Set(currentCategories.map(cat => cat.id));
    
    const newTasks = backupTasks.filter(task => !existingTaskIds.has(task.id));
    const newCategories = backupCategories.filter(cat => !existingCategoryIds.has(cat.id));
    
    return {
      tasks: [...currentTasks, ...newTasks],
      categories: [...currentCategories, ...newCategories],
    };
  }
}
