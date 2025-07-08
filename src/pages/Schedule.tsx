import React, { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import BackButton from "@/components/BackButton";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  FileText, 
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  type: 'lecture' | 'rk1' | 'exam' ;
  startTime: string;
  endTime: string;
  location: string;
  teacher: string;
  notes?: string;
}

const Schedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Monday, 6 = Sunday

  // Генерация дней недели
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Начинаем с понедельника
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Пример расписания (в реальном приложении это будет приходить с бэкенда)
  const schedule: Record<number, Lesson[]> = {};

  const getDaySchedule = (dayIndex: number) => {
    return schedule[dayIndex] || [];
  };

  const getTypeColor = (type: Lesson['type']) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300';
      case 'rk1':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300';
      case 'exam':
        return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300';

    }
  };

  const getTypeIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'lecture':
        return <BookOpen className="w-3 h-3" />;
      case 'rk1':
        return <FileText className="w-3 h-3" />;
      case 'exam':
        return <Award className="w-3 h-3" />;
      default:
        return <BookOpen className="w-3 h-3" />;
    }
  };

  const getTypeLabel = (type: Lesson['type']) => {
    switch (type) {
      case 'lecture':
        return 'Лекция';
      case 'rk1':
        return 'Рубежный контроль 1';
      case 'exam':
        return 'Экзамен';
      default:
        return type;
    }
  };

  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] p-2 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <motion.h1 
        className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-6 text-[#1E0E62] dark:text-white flex items-center gap-2 sm:gap-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-[#A166FF]" />
        Расписание
      </motion.h1>

      {/* Навигация по неделям */}
      <motion.div 
        className="flex items-center justify-between mb-3 sm:mb-6 gap-1 sm:gap-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.button
          onClick={goToPreviousWeek}
          className="p-2 rounded-md sm:rounded-lg bg-[#F3EDFF] text-[#A166FF] hover:bg-[#EAD7FF] transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        
        <motion.h2 
          className="text-base sm:text-lg font-semibold text-[#1E0E62] dark:text-white text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {format(weekStart, 'd MMMM yyyy', { locale: ru })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: ru })}
        </motion.h2>
        
        <motion.button
          onClick={goToNextWeek}
          className="p-2 rounded-md sm:rounded-lg bg-[#F3EDFF] text-[#A166FF] hover:bg-[#EAD7FF] transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Дни недели */}
      <motion.div 
        className="flex gap-1 sm:gap-2 mb-3 sm:mb-6 overflow-x-auto pb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {weekDays.map((day, index) => (
          <motion.button
            key={index}
            onClick={() => setSelectedDay(index)}
            className={`px-3 sm:px-4 py-2 rounded-full whitespace-nowrap transition-colors flex flex-col items-center gap-0.5 sm:gap-1 text-xs sm:text-sm ${
              selectedDay === index
                ? 'bg-[#A166FF] text-white'
                : 'bg-[#F3EDFF] dark:bg-[#232336] text-[#1E0E62] dark:text-white hover:bg-[#EAD7FF] dark:hover:bg-[#2A2A42]'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
          >
            <span className="text-xs sm:text-sm font-medium">{format(day, 'EEEE', { locale: ru })}</span>
            <span className="text-[10px] sm:text-xs">{format(day, 'd MMMM', { locale: ru })}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Расписание на выбранный день */}
      <motion.div 
        className="bg-white dark:bg-[#232336] rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg p-2 sm:p-6 border border-[#F3EDFF] dark:border-[#232336] transition-colors"
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {getDaySchedule(selectedDay + 1).length === 0 ? (
          <motion.div 
            className="text-center py-6 sm:py-8 text-[#8E8E93] dark:text-[#B0B0B0]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-[#A166FF] opacity-50" />
            На этот день занятий нет
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-3 sm:space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <AnimatePresence>
              {getDaySchedule(selectedDay + 1).map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  className="p-2 sm:p-4 rounded-lg sm:rounded-2xl border border-[#F3EDFF] dark:border-[#232336] bg-white dark:bg-[#232336] shadow-sm transition-colors"
                  initial={{ y: 20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  exit={{ y: -20, opacity: 0, scale: 0.9 }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-[#1E0E62] dark:text-white mb-1 sm:mb-2">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-1 sm:gap-2 text-[#8E8E93] dark:text-[#B0B0B0] mb-0.5 sm:mb-1 text-xs sm:text-sm">
                        <User className="w-4 h-4" />
                        <span>{lesson.teacher}</span>
                      </div>
                      {lesson.notes && (
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-[#8E8E93] dark:text-[#B0B0B0] mb-1 sm:mb-2">
                          <FileText className="w-4 h-4" />
                          <span>{lesson.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end ml-2 sm:ml-4 gap-0.5 sm:gap-1">
                      <div className="flex items-center gap-1 text-[#1E0E62] dark:text-white font-medium mb-0.5 sm:mb-1 text-xs sm:text-base">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.startTime} - {lesson.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#8E8E93] dark:text-[#B0B0B0] text-xs sm:text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>Ауд. {lesson.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 w-fit ${getTypeColor(lesson.type)}`}>
                      {getTypeIcon(lesson.type)}
                      {getTypeLabel(lesson.type)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Schedule; 