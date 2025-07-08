import React, { useState, useEffect } from 'react';
import { useTaskStore, Task } from '../store/taskStore';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import BackButton from "@/components/BackButton";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar, 
  BookOpen, 
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  Save
} from 'lucide-react';

// Вспомогательная функция для форматирования даты
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'dd MMMM yyyy', { locale: ru });
  } catch (error) {
    return dateString;
  }
};

const TasksPage: React.FC = () => {
  const { tasks: storedTasks, addTask, updateTask, deleteTask, toggleComplete } = useTaskStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('deadline');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    deadline: new Date().toISOString().split('T')[0],
    completed: false,
    subject: '',
    priority: 'medium',
    status: 'pending'
  });
  const { showNotification } = useNotifications();
  
  useEffect(() => {
    if (storedTasks.length === 0) {
      setTasks([]);
    } else {
      setTasks(storedTasks);
    }
  }, [storedTasks]);

  const subjects = Array.from(new Set(tasks.map(task => task.subject))).filter(Boolean);
  
  const filteredTasks = tasks.filter(task => {
    if (tabValue === 1 && !task.completed) return false;
    if (tabValue === 2 && task.completed) return false;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || task.title.toLowerCase().includes(searchLower) || task.description.toLowerCase().includes(searchLower);
    const matchesSubject = filterSubject === '' || task.subject === filterSubject;
    const matchesPriority = filterPriority === '' || task.priority === filterPriority;
    return matchesSearch && matchesSubject && matchesPriority;
  });
  
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortOption) {
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'priority':
        const priorityMap: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return priorityMap[a.priority] - priorityMap[b.priority];
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setNewTask({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        completed: task.completed,
        subject: task.subject,
        priority: task.priority,
        status: task.status
      });
    } else {
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        deadline: new Date().toISOString().split('T')[0],
        completed: false,
        subject: '',
        priority: 'medium',
        status: 'pending'
      });
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTask(prev => ({ ...prev, deadline: e.target.value }));
  };
  
  const handleTaskSubmit = () => {
    if (!newTask.title || !newTask.deadline) return;
    if (editingTask) {
      updateTask(editingTask.id, newTask);
    } else {
      addTask(newTask);
      showNotification(`Новая задача: ${newTask.title}`);
    }
    handleCloseDialog();
  };
  
  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };
  
  const handleTabChange = (index: number) => {
    setTabValue(index);
  };

  return (
    <motion.div 
      className="min-h-screen bg-background text-foreground p-2 sm:p-8 transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <motion.h1 
        className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-[#1E0E62] dark:text-white flex items-center gap-2 sm:gap-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <CheckSquare className="w-7 h-7 sm:w-8 sm:h-8 text-[#A166FF]" />
        Задачи
      </motion.h1>
      <motion.button
        className="px-4 sm:px-6 py-2 rounded-lg bg-[#A166FF] text-white font-semibold shadow hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base"
        onClick={() => handleOpenDialog()}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Plus className="w-5 h-5" />
        Добавить задачу
      </motion.button>
      <motion.div 
        className="mt-2 sm:mt-4 bg-white dark:bg-[#232336] rounded-2xl shadow-lg p-2 sm:p-6 border border-[#F3EDFF] dark:border-[#232336] transition-colors"
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-2 sm:mb-4">
          <motion.div 
            className="relative flex-1"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск задач..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-background text-foreground dark:bg-[#181826] dark:text-white transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </motion.div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-background text-foreground dark:bg-[#181826] dark:text-white transition-all duration-200"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="deadline">По сроку</option>
              <option value="priority">По приоритету</option>
              <option value="title">По названию</option>
            </select>
            <select
              className="px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-background text-foreground dark:bg-[#181826] dark:text-white transition-all duration-200"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="">Все предметы</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              className="px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-background text-foreground dark:bg-[#181826] dark:text-white transition-all duration-200"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">Любой приоритет</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>
        </div>

        <div className="flex border-b border-[#EAD7FF] dark:border-[#232336] mb-4">
          <motion.button
            className={`px-4 py-2 flex items-center gap-2 ${tabValue === 0 ? 'border-b-2 border-[#A166FF] text-[#A166FF] dark:text-[#A166FF]' : 'text-[#8E8E93] dark:text-[#B0B0B0]'}`}
            onClick={() => handleTabChange(0)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CheckSquare className="w-4 h-4" />
            Все задачи
          </motion.button>
          <motion.button
            className={`px-4 py-2 flex items-center gap-2 ${tabValue === 1 ? 'border-b-2 border-[#A166FF] text-[#A166FF] dark:text-[#A166FF]' : 'text-[#8E8E93] dark:text-[#B0B0B0]'}`}
            onClick={() => handleTabChange(1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CheckCircle className="w-4 h-4" />
            Выполненные
          </motion.button>
          <motion.button
            className={`px-4 py-2 flex items-center gap-2 ${tabValue === 2 ? 'border-b-2 border-[#A166FF] text-[#A166FF] dark:text-[#A166FF]' : 'text-[#8E8E93] dark:text-[#B0B0B0]'}`}
            onClick={() => handleTabChange(2)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Clock className="w-4 h-4" />
            Активные
          </motion.button>
        </div>

        {sortedTasks.length === 0 ? (
          <motion.div 
            className="text-center py-8 text-[#8E8E93] dark:text-[#B0B0B0]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Задачи не найдены
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <AnimatePresence>
              {sortedTasks.map((task, index) => {
                const today = new Date().toISOString().split('T')[0];
                const isToday = task.deadline === today;
                const isPastDue = task.deadline < today && !task.completed;
                return (
                  <motion.div
                    key={task.id}
                    className={`p-4 rounded-2xl border border-[#F3EDFF] dark:border-[#232336] shadow-sm transition-colors ${
                      task.completed
                        ? 'bg-[#F3EDFF] dark:bg-[#232336] opacity-80'
                        : isPastDue 
                        ? 'bg-red-50 dark:bg-red-900'
                        : isToday 
                        ? 'bg-yellow-50 dark:bg-yellow-900'
                        : 'bg-white dark:bg-[#232336]'
                    }`}
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    whileHover={{ y: -2, scale: 1.02 }}
                    exit={{ y: -20, opacity: 0, scale: 0.9 }}
                  >
                    <div className="flex items-start">
                      <motion.button
                        onClick={() => toggleComplete(task.id)}
                        className="mt-1 p-1 rounded hover:bg-[#F3EDFF] transition-colors duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {task.completed ? (
                          <CheckSquare className="h-4 w-4 text-[#A166FF]" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </motion.button>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-[#8E8E93] dark:text-[#B0B0B0]' : 'text-[#1E0E62] dark:text-white'}`}>
                            {task.title}
                          </h3>
                          <div className="flex gap-2">
                            <motion.button
                              className="text-[#8E8E93] dark:text-[#B0B0B0] hover:text-[#A166FF] dark:hover:text-[#A166FF] p-1 rounded hover:bg-[#F3EDFF] transition-colors duration-200"
                              onClick={() => handleOpenDialog(task)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              className="text-[#8E8E93] dark:text-[#B0B0B0] hover:text-red-500 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                              onClick={() => handleDeleteTask(task.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="mt-1 text-[#8E8E93] dark:text-[#B0B0B0]">{task.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 ${
                            isPastDue ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300' : 'bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] dark:text-[#A166FF]'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {isToday ? 'Сегодня' : formatDate(task.deadline)}
                          </span>
                          {task.subject && (
                            <span className="px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {task.subject}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 ${
                            task.priority === 'high'
                              ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300'
                              : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300'
                          }`}>
                            <AlertTriangle className="w-3 h-3" />
                            {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {openDialog && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white dark:bg-[#232336] rounded-2xl p-6 w-full max-w-md transition-colors"
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2 
                className="text-xl font-semibold mb-4 text-[#1E0E62] dark:text-white flex items-center gap-2"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <CheckSquare className="w-5 h-5 text-[#A166FF]" />
                {editingTask ? 'Редактировать задачу' : 'Добавить новую задачу'}
              </motion.h2>
              <motion.div 
                className="space-y-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <input
                  type="text"
                  name="title"
                  placeholder="Название задачи"
                  className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-background text-foreground dark:bg-[#181826] dark:text-white transition-all duration-200"
                  value={newTask.title}
                  onChange={handleChange}
                  required
                />
                <textarea
                  name="description"
                  placeholder="Описание"
                  className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-background text-foreground dark:bg-[#181826] dark:text-white transition-all duration-200"
                  value={newTask.description}
                  onChange={handleChange}
                  rows={3}
                />
                <input
                  type="date"
                  name="deadline"
                  className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-background text-foreground dark:bg-[#181826] dark:text-white transition-all duration-200"
                  value={newTask.deadline}
                  onChange={handleDateChange}
                  required
                />
                <select
                  name="priority"
                  className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-background text-foreground dark:bg-[#181826] dark:text-white transition-all duration-200"
                  value={newTask.priority}
                  onChange={handleSelectChange}
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
                <input
                  type="text"
                  name="subject"
                  placeholder="Предмет"
                  className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-background text-foreground dark:bg-[#181826] dark:text-white transition-all duration-200"
                  value={newTask.subject}
                  onChange={handleChange}
                />
                {editingTask && (
                  <label className="flex items-center text-[#1E0E62] dark:text-white">
                    <input
                      type="checkbox"
                      checked={newTask.completed}
                      onChange={(e) => setNewTask(prev => ({ ...prev, completed: e.target.checked }))}
                      className="mr-2 h-4 w-4 text-[#A166FF]"
                    />
                    <span>Задача выполнена</span>
                  </label>
                )}
              </motion.div>
              <motion.div 
                className="mt-6 flex justify-end gap-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <motion.button
                  className="px-4 py-2 rounded-lg bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] font-semibold hover:bg-[#EAD7FF] dark:hover:bg-[#232336] transition-colors duration-200 flex items-center gap-2"
                  onClick={handleCloseDialog}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                  Отмена
                </motion.button>
                <motion.button
                  className="px-4 py-2 rounded-lg bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                  onClick={handleTaskSubmit}
                  disabled={!newTask.title || !newTask.deadline}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save className="w-4 h-4" />
                  {editingTask ? 'Сохранить' : 'Добавить'}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TasksPage;
