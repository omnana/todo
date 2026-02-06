import { useState } from 'react';
import { useGlobalStore } from './hooks/useGlobalStore';
import type { Task, Priority, SubTask } from './types';

function App() {
  const {
    tasks,
    filteredTasks,
    taskStats,
    categories,
    categoriesWithTaskCount,
    searchQuery,
    selectedCategory,
    filterStatus,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    setSearchQuery,
    setSelectedCategory,
    setFilterStatus,
    updateSubtask,
  } = useGlobalStore();

  const getFilteredTasks = () => filteredTasks;
  const getCategoriesWithTaskCount = () => categoriesWithTaskCount(tasks);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as Priority,
    dueDate: '',
    subtasks: [] as SubTask[],
  });

  const [modalSubtaskInput, setModalSubtaskInput] = useState('');
  const [editingModalSubtaskId, setEditingModalSubtaskId] = useState<string | null>(null);
  const [editingModalSubtaskTitle, setEditingModalSubtaskTitle] = useState('');

  const handleAddSubtaskToModal = () => {
    if (!modalSubtaskInput.trim()) return;
    const newSubtask: SubTask = {
      id: Date.now().toString(),
      title: modalSubtaskInput.trim(),
      completed: false
    };
    setNewTask(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), newSubtask] }));
    setModalSubtaskInput('');
  };

  const removeSubtaskFromModal = (id: string) => {
    setNewTask(prev => ({ ...prev, subtasks: (prev.subtasks || []).filter(t => t.id !== id) }));
  };

  const toggleSubtaskInModal = (id: string) => {
    setNewTask(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});

  // Subtask editing state
  const [editingSubtask, setEditingSubtask] = useState<{ taskId: string, subtaskId: string } | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  const startEditingSubtask = (taskId: string, subtask: SubTask) => {
    setEditingSubtask({ taskId, subtaskId: subtask.id });
    setEditingSubtaskTitle(subtask.title);
  };

  const cancelEditingSubtask = () => {
    setEditingSubtask(null);
    setEditingSubtaskTitle('');
  };

  const saveEditingSubtask = async () => {
    if (!editingSubtask || !editingSubtaskTitle.trim()) {
      cancelEditingSubtask();
      return;
    }

    try {
      await updateSubtask(editingSubtask.taskId, editingSubtask.subtaskId, { title: editingSubtaskTitle.trim() });
    } catch (error) {
      console.error('Error updating subtask:', error);
    } finally {
      cancelEditingSubtask();
    }
  };

  const handleSubtaskInputChange = (taskId: string, value: string) => {
    setSubtaskInputs(prev => ({ ...prev, [taskId]: value }));
  };

  const handleAddSubtask = async (taskId: string) => {
    const title = subtaskInputs[taskId]?.trim();
    if (!title) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask: SubTask = {
      id: Date.now().toString(),
      title,
      completed: false
    };

    try {
      const updatedSubtasks = [...(task.subtasks || []), newSubtask];
      await updateTask(taskId, { subtasks: updatedSubtasks });
      setSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
      await updateTask(taskId, { subtasks: updatedSubtasks });
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const updatedSubtasks = (task.subtasks || []).map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      await updateTask(taskId, { subtasks: updatedSubtasks });
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await addTask({
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        category: newTask.category || '未分类',
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        completed: false,
        subtasks: newTask.subtasks || [],
      });
      setNewTask({ title: '', description: '', category: '', priority: 'medium', dueDate: '', subtasks: [] });
      setShowAddModal(false);
      setModalSubtaskInput('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !newTask.title.trim()) return;
    try {
      await updateTask(editingTask.id, {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        category: newTask.category || '未分类',
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        subtasks: newTask.subtasks || [],
      });
      setShowEditModal(false);
      setEditingTask(null);
      setNewTask({ title: '', description: '', category: '', priority: 'medium', dueDate: '', subtasks: [] });
      setModalSubtaskInput('');
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      category: task.category || '',
      priority: task.priority,
      dueDate: task.dueDate || '',
      subtasks: task.subtasks || [],
    });
    setModalSubtaskInput('');
    setShowEditModal(true);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'medium': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      case 'low': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      default: return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  const getPriorityText = (priority: Priority) => {
    return { high: '高', medium: '中', low: '低' }[priority] || '中';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === tomorrow.toDateString()) return '明天';
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getDueDateStatus = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    if (due < today) return { text: '已逾期', color: 'text-red-500 bg-red-50' };
    if (due.getTime() === today.getTime()) return { text: '今天', color: 'text-orange-500 bg-orange-50' };

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (due.getTime() === tomorrow.getTime()) return { text: '明天', color: 'text-yellow-600 bg-yellow-50' };

    return { text: formatDate(dueDate), color: 'text-gray-500 bg-gray-50' };
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                待办事项
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center shadow-lg shadow-indigo-200 hover:shadow-indigo-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建任务
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Sidebar - Dashboard & Controls */}
          <div className="w-full lg:w-1/3 space-y-8 sticky top-28">

            {/* Stats Cards - Compact Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5 group hover:border-indigo-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">总任务</p>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
              </div>

              <div className="card p-5 group hover:border-orange-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">待办</p>
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{taskStats.pending}</p>
              </div>

              <div className="card p-5 group hover:border-emerald-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">已完成</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{taskStats.completed}</p>
              </div>

              <div className="card p-5 group hover:border-purple-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">完成率</p>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{taskStats.completionRate}%</p>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">筛选与搜索</h3>
                <div className="relative mb-4">
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="搜索任务..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-11"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>全部任务</span>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs text-gray-500 shadow-sm">{tasks.length}</span>
                  </button>
                  <button
                    onClick={() => setFilterStatus('todo')}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${filterStatus === 'todo' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>进行中</span>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs text-gray-500 shadow-sm">{taskStats.pending}</span>
                  </button>
                  <button
                    onClick={() => setFilterStatus('completed')}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${filterStatus === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>已完成</span>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs text-gray-500 shadow-sm">{taskStats.completed}</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">分类标签</h3>
                  {(selectedCategory || searchQuery) && (
                    <button onClick={() => { setSelectedCategory(null); setSearchQuery(''); }} className="text-xs text-indigo-600 hover:text-indigo-800">
                      清除筛选
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === null
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    全部
                  </button>
                  {getCategoriesWithTaskCount().map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === category.name
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {category.name} <span className={`ml-1 text-xs ${selectedCategory === category.name ? 'text-indigo-200' : 'text-gray-400'}`}>{category.taskCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Task List */}
          <div className="w-full lg:w-2/3">
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">我的任务</h2>
                  <p className="text-sm text-gray-500 mt-1">这里显示您的所有待办事项</p>
                </div>
                <div className="flex items-center text-sm text-gray-500 space-x-2">
                  <span>按时间排序</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {isLoading ? (
                  <div className="p-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p>正在加载任务...</p>
                  </div>
                ) : getFilteredTasks().length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">没有找到任务</p>
                    <p className="text-gray-500 mb-6">不论是工作还是生活，记录下来才能更好地完成。</p>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary">
                      添加第一个任务
                    </button>
                  </div>
                ) : (
                  getFilteredTasks().map((task: Task) => (
                    <div key={task.id} className="p-5 hover:bg-gray-50 transition-all duration-200 border-l-4 border-transparent hover:border-indigo-500 group">
                      <div className="flex items-start gap-4">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                            className="w-6 h-6 text-indigo-600 border-gray-300 rounded-lg focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-lg font-semibold transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              {task.title}
                            </h4>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className={`mb-3 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                              {task.description}
                            </p>
                          )}

                          {/* 子任务列表 */}
                          <div className="space-y-1 mt-3">
                            {task.subtasks?.map(subtask => (
                              <div key={subtask.id} className="flex items-center justify-between group/subtask pl-2 pr-2 py-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={() => handleToggleSubtask(task.id, subtask.id)}
                                    className="w-4 h-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-400 cursor-pointer flex-shrink-0"
                                  />
                                  {editingSubtask?.taskId === task.id && editingSubtask?.subtaskId === subtask.id ? (
                                    <input
                                      type="text"
                                      value={editingSubtaskTitle}
                                      onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                                      onBlur={saveEditingSubtask}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditingSubtask();
                                        if (e.key === 'Escape') cancelEditingSubtask();
                                      }}
                                      autoFocus
                                      className="flex-1 text-sm border-gray-300 rounded px-2 py-0.5 focus:ring-indigo-500 focus:border-indigo-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span
                                      className={`text-sm truncate cursor-pointer hover:text-indigo-600 ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                                      onClick={() => startEditingSubtask(task.id, subtask)}
                                      title="点击修改内容"
                                    >
                                      {subtask.title}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center opacity-0 group-hover/subtask:opacity-100 transition-opacity flex-shrink-0">
                                  {!(editingSubtask?.taskId === task.id && editingSubtask?.subtaskId === subtask.id) && (
                                    <button
                                      onClick={() => startEditingSubtask(task.id, subtask)}
                                      className="text-gray-400 hover:text-indigo-500 p-1 mr-1"
                                      title="编辑"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteSubtask(task.id, subtask.id)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                    title="删除"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* 添加子任务输入框 */}
                            <div className="flex items-center gap-2 pl-2 mt-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <input
                                type="text"
                                value={subtaskInputs[task.id] || ''}
                                onChange={(e) => handleSubtaskInputChange(task.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddSubtask(task.id);
                                  }
                                }}
                                placeholder="添加子任务..."
                                className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0 placeholder-gray-400 text-gray-700"
                              />
                              {subtaskInputs[task.id] && (
                                <button
                                  onClick={() => handleAddSubtask(task.id)}
                                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded bg-indigo-50"
                                >
                                  添加
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-sm mt-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                              # {task.category || '未分类'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {getPriorityText(task.priority)}优
                            </span>
                            {task.dueDate && (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getDueDateStatus(task.dueDate).color}`}>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {getDueDateStatus(task.dueDate).text}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Modals */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg transform transition-all animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{showEditModal ? '编辑任务' : '新建任务'}</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">任务标题</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="input-field"
                  placeholder="准备做什么此？"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">描述</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="input-field"
                  placeholder="添加一些详细说明..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">子任务</label>
                <div className="space-y-2 mb-3">
                  {newTask.subtasks?.map(subtask => (
                    <div key={subtask.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg group">
                      <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtaskInModal(subtask.id)}
                          className="w-4 h-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-400 cursor-pointer flex-shrink-0"
                        />
                        {editingModalSubtaskId === subtask.id ? (
                          <input
                            type="text"
                            value={editingModalSubtaskTitle}
                            onChange={(e) => setEditingModalSubtaskTitle(e.target.value)}
                            onBlur={() => {
                              if (editingModalSubtaskTitle.trim()) {
                                setNewTask(prev => ({
                                  ...prev,
                                  subtasks: (prev.subtasks || []).map(t => t.id === subtask.id ? { ...t, title: editingModalSubtaskTitle.trim() } : t)
                                }));
                              }
                              setEditingModalSubtaskId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingModalSubtaskTitle.trim()) {
                                  setNewTask(prev => ({
                                    ...prev,
                                    subtasks: (prev.subtasks || []).map(t => t.id === subtask.id ? { ...t, title: editingModalSubtaskTitle.trim() } : t)
                                  }));
                                }
                                setEditingModalSubtaskId(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingModalSubtaskId(null);
                              }
                            }}
                            autoFocus
                            className="flex-1 text-sm border-gray-300 rounded px-2 py-0.5 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        ) : (
                          <span
                            className={`text-sm truncate cursor-pointer hover:text-indigo-600 ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                            onClick={() => {
                              setEditingModalSubtaskId(subtask.id);
                              setEditingModalSubtaskTitle(subtask.title);
                            }}
                            title="点击修改内容"
                          >
                            {subtask.title}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeSubtaskFromModal(subtask.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modalSubtaskInput}
                    onChange={(e) => setModalSubtaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtaskToModal()}
                    className="input-field flex-1"
                    placeholder="添加子任务..."
                  />
                  <button
                    onClick={handleAddSubtaskToModal}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    添加
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">分类</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">选择分类</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">优先级</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                    className="input-field"
                  >
                    <option value="low">低优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="high">高优先级</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">截止日期</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={showEditModal ? handleEditTask : handleAddTask}
                disabled={!newTask.title.trim()}
                className="btn-primary"
              >
                {showEditModal ? '保存修改' : '立即创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
