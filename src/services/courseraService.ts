import { Course, CourseFilters } from '@/types/course';

const BASE_URL = 'http://localhost:3001/api/courses';

export const courseraService = {
  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.category) {
        queryParams.append('category', filters.category);
      }
      if (filters?.level) {
        queryParams.append('level', filters.level);
      }
      if (filters?.language) {
        queryParams.append('language', filters.language);
      }
      if (filters?.searchQuery) {
        queryParams.append('q', filters.searchQuery);
      }

      const response = await fetch(`${BASE_URL}?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      return this.transformCourses(data.elements);
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  async getCourseById(id: string): Promise<Course> {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const data = await response.json();
      return this.transformCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  },

  // Вспомогательная функция для преобразования данных из API в наш формат
  transformCourses(courses: any[]): Course[] {
    return courses.map(course => this.transformCourse(course));
  },

  transformCourse(course: any): Course {
    return {
      id: course.id,
      name: course.name,
      description: course.description,
      instructor: course.instructorName,
      rating: course.rating || 0,
      numReviews: course.numReviews || course['reviewsCount'] || course['num_ratings'] || 0,
      enrolledCount: course.enrolledCount || 0,
      duration: course.duration || course.estimatedEffort || course['hours'] || '',
      level: course.level || 'beginner',
      category: course.category,
      imageUrl: course.photoUrl,
      url: course.url,
      price: course.price || 0,
      language: course.language,
      skills: course.skills || [],
    };
  },
}; 