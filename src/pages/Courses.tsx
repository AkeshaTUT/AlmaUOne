import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { courseraService } from '@/services/courseraService';
import CourseCard from '@/components/CourseCard';
import { Course, CourseFilters } from '@/types/course';
import { Search, Filter, ChevronDown, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from "@/components/BackButton";
import { motion, AnimatePresence } from 'framer-motion';

const Courses = () => {
  const [filters, setFilters] = useState<CourseFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses', filters],
    queryFn: () => courseraService.getCourses(filters),
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleFilterChange = (key: keyof CourseFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCourseClick = (course: Course) => {
    window.open(course.url, '_blank');
  };

  if (error) {
    toast.error('Ошибка при загрузке курсов');
  }

  return (
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] p-2 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <motion.div 
        className="max-w-full sm:max-w-7xl mx-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.h1 
          className="text-2xl sm:text-3xl font-bold text-[#1E0E62] dark:text-white mb-4 sm:mb-8 flex items-center gap-2 sm:gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-[#A166FF]" />
          Курсы
        </motion.h1>
        <motion.div 
          className="mb-4 sm:mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <motion.div 
              className="relative flex-1"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск курсов..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white transition-all duration-200 text-sm sm:text-base"
                onChange={handleSearch}
              />
            </motion.div>
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#EAD7FF] bg-white dark:bg-[#232336] text-[#1E0E62] dark:text-white hover:bg-[#F3EDFF] transition-colors duration-200 text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter className="w-5 h-5" />
              <span>Фильтры</span>
              <motion.div
                animate={{ rotate: showFilters ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </motion.button>
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                className="mt-2 sm:mt-4 p-2 sm:p-4 bg-white dark:bg-[#232336] rounded-2xl shadow-lg"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <select
                    className="px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white transition-all duration-200 text-sm sm:text-base"
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                  >
                    <option value="">Уровень сложности</option>
                    <option value="beginner">Начальный</option>
                    <option value="intermediate">Средний</option>
                    <option value="advanced">Продвинутый</option>
                  </select>

                  <select
                    className="px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white transition-all duration-200 text-sm sm:text-base"
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                  >
                    <option value="">Язык</option>
                    <option value="ru">Русский</option>
                    <option value="en">Английский</option>
                  </select>

                  <select
                    className="px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white transition-all duration-200 text-sm sm:text-base"
                    onChange={(e) => handleFilterChange('priceRange', e.target.value as 'free' | 'paid')}
                  >
                    <option value="">Цена</option>
                    <option value="free">Бесплатные</option>
                    <option value="paid">Платные</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {isLoading ? (
          <motion.div 
            className="flex justify-center items-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Loader2 className="animate-spin h-12 w-12 text-[#A166FF]" />
          </motion.div>
        ) : courses?.length === 0 ? (
          <motion.div 
            className="text-center py-8 text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Курсы не найдены
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <AnimatePresence>
              {courses?.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ y: 50, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CourseCard
                    course={course}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Courses; 