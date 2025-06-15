import React, { useState } from "react";
import BackButton from "@/components/BackButton";

interface Vacancy {
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
  snippet: {
    requirement: string;
    responsibility: string;
  };
  alternate_url: string;
}

interface Cluster {
  id: string;
  name: string;
  items: { name: string; url: string; count: number; value: string }[];
}

const HH_USER_AGENT = "User-Agent: MyApp/1.0 (my-app-feedback@example.com)";

const Jobs: React.FC = () => {
  const [query, setQuery] = useState("");
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<{ [key: string]: string }>({});

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (query) params.append("text", query);
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== "per_page") params.append(key, value);
    });
    params.append("clusters", "true");
    params.append("per_page", "20");
    params.append("area", "1");
    params.append("enable_snippets", "true");
    params.append("host", "hh.ru");
    params.append("vacancy_type", "open");
    params.append("responses_count_enabled", "true");
    params.append("date_from", new Date().toISOString().split('T')[0]);
    params.append("order_by", "publication_time");
    params.append("search_field", "name");
    params.append("search_period", "30");
    return params.toString();
  };

  const searchJobs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setVacancies([]);
    setClusters([]);
    try {
      const res = await fetch(
        `http://localhost:3001/api/hh?${buildQueryString()}`,
        { headers: { /* 'HH-User-Agent' не нужен, прокси добавит */ } }
      );
      if (!res.ok) throw new Error("Ошибка при запросе к hh.ru");
      const data = await res.json();
      setVacancies(data.items);
      setClusters(data.clusters || []);
    } catch (err: any) {
      setError(err.message || "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  };

  const handleClusterClick = (clusterId: string, value: string) => {
    setFilters((prev) => ({ ...prev, [clusterId]: value }));
    setTimeout(() => searchJobs(), 0); // запуск поиска после обновления фильтра
  };

  const VacancyCard = ({ vacancy }: { vacancy: Vacancy }) => {
    const formatSalary = (salary: Vacancy['salary']) => {
      if (!salary) return 'Зарплата не указана';
      const from = salary.from ? `${salary.from.toLocaleString()} ` : '';
      const to = salary.to ? `${salary.to.toLocaleString()} ` : '';
      const currency = salary.currency === 'RUR' ? '₽' : salary.currency;
      return `${from}${to}${currency}`;
    };

    return (
      <div className="bg-white dark:bg-[#232336] rounded-2xl p-6 border border-[#F3EDFF] dark:border-[#232336] shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-[#1E0E62] dark:text-white mb-2">
              {vacancy.name}
            </h3>
            <p className="text-[#A166FF] font-medium mb-4">
              {formatSalary(vacancy.salary)}
            </p>
          </div>
          {vacancy.employer.logo_urls && (
            <img
              src={vacancy.employer.logo_urls.original}
              alt={vacancy.employer.name}
              className="w-16 h-16 object-contain"
            />
          )}
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-sm bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF]">
              {vacancy.area.name}
            </span>
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

          {vacancy.snippet.requirement && (
            <div>
              <h4 className="font-medium text-[#1E0E62] dark:text-white mb-1">Требования:</h4>
              <p className="text-[#8E8E93] dark:text-[#B0B0B0]" dangerouslySetInnerHTML={{ __html: vacancy.snippet.requirement }} />
            </div>
          )}

          {vacancy.snippet.responsibility && (
            <div>
              <h4 className="font-medium text-[#1E0E62] dark:text-white mb-1">Обязанности:</h4>
              <p className="text-[#8E8E93] dark:text-[#B0B0B0]" dangerouslySetInnerHTML={{ __html: vacancy.snippet.responsibility }} />
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <p className="text-[#8E8E93] dark:text-[#B0B0B0]">{vacancy.employer.name}</p>
            <a
              href={vacancy.alternate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition"
            >
              Откликнуться
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <h1 className="text-3xl font-bold mb-6">Поиск вакансий</h1>
      <form onSubmit={searchJobs} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите название вакансии..."
            className="flex-1 px-4 py-2 rounded border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF]"
          />
          <button
            type="submit"
            className="px-6 py-2 rounded bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition"
          >
            Найти
          </button>
        </div>
      </form>

      {clusters.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Фильтры</h2>
          <div className="flex flex-wrap gap-2">
            {clusters.map((cluster) => (
              <button
                key={cluster.id}
                onClick={() => handleClusterClick(cluster.id, cluster.items[0].value)}
                className="px-4 py-2 rounded-full bg-[#F3EDFF] text-[#A166FF] font-medium hover:bg-[#EAD7FF] transition"
              >
                {cluster.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : vacancies.length === 0 ? (
        <div className="text-center py-8 text-[#8E8E93]">Вакансии не найдены</div>
      ) : (
        <div className="space-y-6">
          {vacancies.map((vacancy) => (
            <VacancyCard key={vacancy.id} vacancy={vacancy} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs; 