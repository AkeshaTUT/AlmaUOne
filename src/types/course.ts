export interface Course {
  id: string;
  name: string;
  description: string;
  instructor: string;
  rating: number;
  numReviews?: number;
  enrolledCount: number;
  duration?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  imageUrl: string;
  url: string;
  price: number;
  language: string;
  skills: string[];
}

export interface CourseFilters {
  category?: string;
  level?: string;
  language?: string;
  priceRange?: 'free' | 'paid';
  searchQuery?: string;
} 