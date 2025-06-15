import { Course } from '@/types/course';
import { Star, Users, Clock, BookOpen } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => (
  <a
    href={course.url}
    target="_blank"
    rel="noopener noreferrer"
    className="block bg-white dark:bg-[#232336] rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
    style={{ userSelect: 'none', textDecoration: 'none', color: 'inherit' }}
    tabIndex={0}
    aria-label={`Открыть курс ${course.name} на Coursera`}
  >
    <div className="relative h-48">
      <img 
        src={course.imageUrl} 
        alt={course.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-2 right-2 bg-[#A166FF] text-white px-2 py-1 rounded-full text-sm">
        {course.price === 0 ? 'Бесплатно' : `${course.price} ₽`}
      </div>
    </div>
    
    <div className="p-4">
      <h3 className="text-lg font-semibold text-[#1E0E62] dark:text-white mb-2 line-clamp-2">
        {course.name}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
        {course.description}
      </p>
      
      <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400" />
          <span>{course.rating.toFixed(1)}</span>
          {course.numReviews ? <span className="ml-1">({course.numReviews} рецензий)</span> : null}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{course.duration}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {course.skills.slice(0, 3).map((skill, index) => (
          <span 
            key={index}
            className="px-2 py-1 bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] rounded-full text-xs"
          >
            {skill}
          </span>
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {course.instructor}
        </span>
        <span className="text-sm text-[#A166FF] font-medium">
          {course.level === 'beginner' ? 'Начальный' : 
           course.level === 'intermediate' ? 'Средний' : 'Продвинутый'}
        </span>
      </div>
    </div>
  </a>
);

export default CourseCard;