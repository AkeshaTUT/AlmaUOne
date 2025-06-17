import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVacancyDetails } from '@/hooks/useVacancyDetails';
import BackButton from '@/components/BackButton';

const VacancyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vacancy, loading, error } = useVacancyDetails(id || '');

  const formatSalary = (salary: typeof vacancy.salary) => {
    if (!salary) return 'Зарплата не указана';
    const from = salary.from ? `${salary.from.toLocaleString()} ` : '';
    const to = salary.to ? `${salary.to.toLocaleString()} ` : '';
    const currency = salary.currency === 'RUR' ? '₽' : salary.currency;
    return `${from}${to}${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6FB] p-8">
        <BackButton className="mb-4" />
        <div className="text-center py-8">Загрузка...</div>
      </div>
    );
  }

  if (error || !vacancy) {
    return (
      <div className="min-h-screen bg-[#F8F6FB] p-8">
        <BackButton className="mb-4" />
        <div className="text-center py-8 text-red-500">
          {error || 'Вакансия не найдена'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#232336] rounded-2xl p-8 shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#1E0E62] dark:text-white mb-2">
                {vacancy.name}
              </h1>
              <p className="text-2xl text-[#A166FF] font-medium">
                {formatSalary(vacancy.salary)}
              </p>
            </div>
            {vacancy.employer.logo_urls && (
              <img
                src={vacancy.employer.logo_urls.original}
                alt={vacancy.employer.name}
                className="w-24 h-24 object-contain"
              />
            )}
          </div>

          {/* Company Info */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#1E0E62] dark:text-white mb-2">
              {vacancy.employer.name}
            </h2>
            <p className="text-[#8E8E93] dark:text-[#B0B0B0]">
              {vacancy.area.name}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 rounded-full text-sm bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF]">
              {vacancy.schedule.name}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF]">
              {vacancy.experience.name}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF]">
              {vacancy.employment.name}
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-[#1E0E62] dark:text-white mb-4">
              Описание вакансии
            </h3>
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: vacancy.description }}
            />
          </div>

          {/* Skills */}
          {vacancy.key_skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#1E0E62] dark:text-white mb-4">
                Ключевые навыки
              </h3>
              <div className="flex flex-wrap gap-2">
                {vacancy.key_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF]"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button */}
          <div className="mt-8">
            <a
              href={vacancy.alternate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-6 py-3 rounded-full bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition"
            >
              Откликнуться на вакансию
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacancyDetails; 