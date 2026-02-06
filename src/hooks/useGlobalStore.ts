import { useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useCategoryStore } from '../stores/categoryStore';

/**
 * 全局状态管理 Hook
 * 整合任务和分类的状态管理，提供统一的数据访问接口
 */
export function useGlobalStore() {
  const taskStore = useTaskStore();
  const categoryStore = useCategoryStore();

  // 初始化数据加载
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          taskStore.loadTasks(),
          categoryStore.loadCategories()
        ]);
      } catch (error) {
        console.error('Error initializing global store:', error);
      }
    };

    initializeData();
  }, []);

  // 检查是否有任何正在进行的操作
  const isAnyLoading = taskStore.isLoading || categoryStore.isLoading;

  // 清理所有数据的便捷方法
  const clearAllData = async () => {
    try {
      await Promise.all([
        taskStore.resetTasks(),
        categoryStore.resetToDefault()
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  };

  // 导出所有数据的便捷方法
  const exportAllData = async () => {
    try {
      await Promise.all([
        taskStore.exportTasks(),
        categoryStore.exportCategories()
      ]);
    } catch (error) {
      console.error('Error exporting all data:', error);
      throw error;
    }
  };

  return {
    // 任务相关
    tasks: taskStore.tasks,
    filteredTasks: taskStore.filteredTasks(),
    taskStats: taskStore.stats(),
    tasksByCategory: taskStore.tasksByCategory(),
    tasksByPriority: taskStore.tasksByPriority(),
    overdueTasks: taskStore.overdueTasks(),
    todayTasks: taskStore.todayTasks(),

    // 分类相关
    categories: categoryStore.categories,
    categoriesWithTaskCount: (tasks: any[]) => categoryStore.getCategoriesWithTaskCount(tasks),

    // 筛选状态
    searchQuery: taskStore.searchQuery,
    selectedCategory: taskStore.selectedCategory,
    filterStatus: taskStore.filterStatus,
    sortBy: taskStore.sortBy,
    sortOrder: taskStore.sortOrder,

    // 加载状态
    isLoading: isAnyLoading,

    // 任务操作方法
    addTask: taskStore.addTask,
    updateTask: taskStore.updateTask,
    deleteTask: taskStore.deleteTask,
    toggleTask: taskStore.toggleTask,
    toggleAllTasks: taskStore.toggleAllTasks,
    clearCompleted: taskStore.clearCompleted,
    deleteCompleted: taskStore.deleteCompleted,
    bulkUpdateTasks: taskStore.bulkUpdateTasks,
    bulkDeleteTasks: taskStore.bulkDeleteTasks,
    updateSubtask: taskStore.updateSubtask,

    // 分类操作方法
    addCategory: categoryStore.addCategory,
    updateCategory: categoryStore.updateCategory,
    deleteCategory: categoryStore.deleteCategory,
    getCategoryById: categoryStore.getCategoryById,
    getCategoryByName: categoryStore.getCategoryByName,
    bulkAddCategories: categoryStore.bulkAddCategories,
    bulkUpdateCategories: categoryStore.bulkUpdateCategories,
    bulkDeleteCategories: categoryStore.bulkDeleteCategories,

    // 筛选方法
    setSearchQuery: taskStore.setSearchQuery,
    setSelectedCategory: taskStore.setSelectedCategory,
    setFilterStatus: taskStore.setFilterStatus,
    setSortBy: taskStore.setSortBy,
    setSortOrder: taskStore.setSortOrder,
    clearFilters: taskStore.clearFilters,

    // 工具方法
    clearAllData,
    exportAllData,

    // 分类工具方法
    getCategoryCount: categoryStore.getCategoryCount,
    resetCategories: categoryStore.resetToDefault,
  };
}

/**
 * 任务统计 Hook
 * 提供任务统计数据的便捷访问
 */
export function useTaskStats() {
  const taskStats = useTaskStore((state) => state.stats);
  return taskStats();
}

/**
 * 分类统计 Hook
 * 提供分类统计数据的便捷访问
 */
export function useCategoryStats() {
  const { categories, getCategoryCount } = useCategoryStore();
  return {
    categories,
    categoryCount: getCategoryCount(),
  };
}

/**
 * 搜索和筛选 Hook
 * 提供搜索和筛选功能的便捷访问
 */
export function useSearchAndFilter() {
  const {
    searchQuery,
    selectedCategory,
    filterStatus,
    sortBy,
    sortOrder,
    setSearchQuery,
    setSelectedCategory,
    setFilterStatus,
    setSortBy,
    setSortOrder,
    clearFilters
  } = useTaskStore();

  return {
    searchQuery,
    selectedCategory,
    filterStatus,
    sortBy,
    sortOrder,
    setSearchQuery,
    setSelectedCategory,
    setFilterStatus,
    setSortBy,
    setSortOrder,
    clearFilters
  };
}

/**
 * 批量操作 Hook
 * 提供批量操作功能的便捷访问
 */
export function useBulkOperations() {
  const {
    bulkUpdateTasks,
    bulkDeleteTasks,
    toggleAllTasks,
    bulkUpdateCategories,
    bulkDeleteCategories
  } = useGlobalStore();

  return {
    bulkUpdateTasks,
    bulkDeleteTasks,
    toggleAllTasks,
    bulkUpdateCategories,
    bulkDeleteCategories
  };
}

/**
 * 数据管理 Hook
 * 提供数据导入导出功能的便捷访问
 */
export function useDataManagement() {
  const { clearAllData, exportAllData } = useGlobalStore();

  return {
    clearAllData,
    exportAllData
  };
}
