import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { courseraService } from '@/services/courseraService';
import CourseCard from '@/components/CourseCard';
import { Course, CourseFilters } from '@/types/course';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from "@/components/BackButton";

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
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1E0E62] dark:text-white mb-8">
          Курсы
        </h1>

        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск курсов..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white"
                onChange={handleSearch}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#EAD7FF] bg-white dark:bg-[#232336] text-[#1E0E62] dark:text-white"
            >
              <Filter className="w-5 h-5" />
              <span>Фильтры</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-[#232336] rounded-2xl shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  className="px-4 py-2 rounded border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white"
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <option value="">Уровень сложности</option>
                  <option value="beginner">Начальный</option>
                  <option value="intermediate">Средний</option>
                  <option value="advanced">Продвинутый</option>
                </select>

                <select
                  className="px-4 py-2 rounded border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white"
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                >
                  <option value="">Язык</option>
                  <option value="ru">Русский</option>
                  <option value="en">Английский</option>
                </select>

                <select
                  className="px-4 py-2 rounded border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#232336] dark:text-white"
                  onChange={(e) => handleFilterChange('priceRange', e.target.value as 'free' | 'paid')}
                >
                  <option value="">Цена</option>
                  <option value="free">Бесплатные</option>
                  <option value="paid">Платные</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#A166FF]"></div>
          </div>
        ) : courses?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Курсы не найдены
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses; 