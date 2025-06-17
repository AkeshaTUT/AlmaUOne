import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface VacancyDetails {
  id: string;
  name: string;
  salary: {
    from: number;
    to: number;
    currency: string;
    gross: boolean;
  } | null;
  area: {
    name: string;
  };
  employer: {
    name: string;
    logo_urls?: {
      original: string;
    };
  };
  schedule: {
    name: string;
  };
  experience: {
    name: string;
  };
  employment: {
    name: string;
  };
  description: string;
  key_skills: Array<{
    name: string;
  }>;
  alternate_url: string;
}

export function useVacancyDetails(id: string) {
  const [vacancy, setVacancy] = useState<VacancyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchVacancy = async () => {
      if (!id || !token) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:3001/api/hh/vacancies/${id}`, {
          headers: {
            'Authorization': token
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch vacancy details');
        }

        const data = await response.json();
        setVacancy(data);

        // Save to viewed history
        const viewedVacancies = JSON.parse(localStorage.getItem('viewedVacancies') || '[]');
        const newHistory = [
          { id, name: data.name, viewedAt: new Date().toISOString() },
          ...viewedVacancies.filter((v: any) => v.id !== id).slice(0, 9)
        ];
        localStorage.setItem('viewedVacancies', JSON.stringify(newHistory));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVacancy();
  }, [id, token]);

  return { vacancy, loading, error };
} 