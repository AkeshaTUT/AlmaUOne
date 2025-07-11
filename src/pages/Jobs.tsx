import React, { useState } from "react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Briefcase, 
  MapPin, 
  Clock, 
  User, 
  Building, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  ExternalLink
} from 'lucide-react';

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

// Модальное окно фильтров
const JobsFilterModal = ({
  open,
  onClose,
  onApply,
  filters,
  setFilters
}: any) => {
  if (!open) return null;
  const {
    exclude, specialization, industry, region, salaryFrom, salaryCurrency, onlyWithSalary,
    education, experience, employment, schedule, workFormat, searchIn, sort, period, perPage,
    setExclude, setSpecialization, setIndustry, setRegion, setSalaryFrom, setSalaryCurrency, setOnlyWithSalary,
    setEducation, setExperience, setEmployment, setSchedule, setWorkFormat, setSearchIn, setSort, setPeriod, setPerPage
  } = filters;
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white dark:bg-[#232336] rounded-2xl p-8 w-full max-w-2xl shadow-lg relative overflow-y-auto max-h-[90vh]"
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button 
          className="absolute top-4 right-4 text-2xl hover:text-[#A166FF] transition-colors duration-200" 
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-6 h-6" />
        </motion.button>
        <motion.h2 
          className="text-2xl font-bold mb-4 flex items-center gap-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Filter className="w-6 h-6 text-[#A166FF]" />
          Фильтры
        </motion.h2>
        <motion.div 
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <input type="text" value={exclude} onChange={e => setExclude(e.target.value)} placeholder="Исключить слова" className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200" />
          <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="Специализация" className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200" />
          <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Отрасль" className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200" />
          <input type="text" value={region} onChange={e => setRegion(e.target.value)} placeholder="Регион" className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200" />
          <div className="flex flex-wrap gap-4 items-center">
            <input type="number" value={salaryFrom} onChange={e => setSalaryFrom(e.target.value)} placeholder="Зарплата от" className="w-32 px-4 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200" />
            <select value={salaryCurrency} onChange={e => setSalaryCurrency(e.target.value)} className="w-28 px-2 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200">
              <option value="tenge">Тенге</option>
              <option value="usd">Доллары</option>
              <option value="eur">Евро</option>
            </select>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={onlyWithSalary} onChange={e => setOnlyWithSalary(e.target.checked)} /> Только с зарплатой
            </label>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={searchIn.name} onChange={e => setSearchIn((v: any) => ({...v, name: e.target.checked}))} /> в названии
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={searchIn.company} onChange={e => setSearchIn((v: any) => ({...v, company: e.target.checked}))} /> в названии компании
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={searchIn.description} onChange={e => setSearchIn((v: any) => ({...v, description: e.target.checked}))} /> в описании
            </label>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={education.includes('none')} onChange={e => setEducation((v: string[]) => e.target.checked ? [...v, 'none'] : v.filter(x => x !== 'none'))} /> Не требуется
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={education.includes('secondary')} onChange={e => setEducation((v: string[]) => e.target.checked ? [...v, 'secondary'] : v.filter(x => x !== 'secondary'))} /> Среднее проф.
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={education.includes('higher')} onChange={e => setEducation((v: string[]) => e.target.checked ? [...v, 'higher'] : v.filter(x => x !== 'higher'))} /> Высшее
            </label>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="font-semibold">Опыт:</label>
            <label><input type="radio" name="exp" value="" checked={experience === ''} onChange={() => setExperience('')} /> Не важно</label>
            <label><input type="radio" name="exp" value="noExperience" checked={experience === 'noExperience'} onChange={() => setExperience('noExperience')} /> Нет опыта</label>
            <label><input type="radio" name="exp" value="between1And3" checked={experience === 'between1And3'} onChange={() => setExperience('between1And3')} /> 1-3 года</label>
            <label><input type="radio" name="exp" value="between3And6" checked={experience === 'between3And6'} onChange={() => setExperience('between3And6')} /> 3-6 лет</label>
            <label><input type="radio" name="exp" value="moreThan6" checked={experience === 'moreThan6'} onChange={() => setExperience('moreThan6')} /> Более 6 лет</label>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="font-semibold">Тип занятости:</label>
            {['full', 'part', 'project', 'volunteer', 'probation'].map(type => (
              <label key={type}><input type="checkbox" checked={employment.includes(type)} onChange={e => setEmployment((v: string[]) => e.target.checked ? [...v, type] : v.filter(x => x !== type))} /> {type === 'full' ? 'Полная' : type === 'part' ? 'Частичная' : type === 'project' ? 'Проектная' : type === 'volunteer' ? 'Волонтерство' : 'Стажировка'}</label>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="font-semibold">График:</label>
            <select value={schedule} onChange={e => setSchedule(e.target.value)} className="w-48 px-2 py-2 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200">
              <option value="">Любой</option>
              <option value="fullDay">Полный день</option>
              <option value="shift">Сменный</option>
              <option value="flexible">Гибкий</option>
              <option value="remote">Удалёнка</option>
              <option value="flyInFlyOut">Вахта</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="font-semibold">Формат работы:</label>
            {['office', 'remote', 'hybrid'].map(fmt => (
              <label key={fmt}><input type="checkbox" checked={workFormat.includes(fmt)} onChange={e => setWorkFormat((v: string[]) => e.target.checked ? [...v, fmt] : v.filter(x => x !== fmt))} /> {fmt === 'office' ? 'Офис' : fmt === 'remote' ? 'Удалённо' : 'Гибрид'}</label>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="font-semibold">Сортировка:</label>
            <label><input type="radio" name="sort" value="relevance" checked={sort === 'relevance'} onChange={() => setSort('relevance')} /> По соответствию</label>
            <label><input type="radio" name="sort" value="date" checked={sort === 'date'} onChange={() => setSort('date')} /> По дате</label>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="font-semibold">Период:</label>
            <label><input type="radio" name="period" value="all" checked={period === 'all'} onChange={() => setPeriod('all')} /> За всё время</label>
            <label><input type="radio" name="period" value="month" checked={period === 'month'} onChange={() => setPeriod('month')} /> За месяц</label>
            <label><input type="radio" name="period" value="week" checked={period === 'week'} onChange={() => setPeriod('week')} /> За неделю</label>
            <label><input type="radio" name="period" value="3days" checked={period === '3days'} onChange={() => setPeriod('3days')} /> За 3 дня</label>
            <label><input type="radio" name="period" value="day" checked={period === 'day'} onChange={() => setPeriod('day')} /> За сутки</label>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="font-semibold">Показывать на странице:</label>
            <label><input type="radio" name="perPage" value="20" checked={perPage === '20'} onChange={() => setPerPage('20')} /> 20</label>
            <label><input type="radio" name="perPage" value="50" checked={perPage === '50'} onChange={() => setPerPage('50')} /> 50</label>
            <label><input type="radio" name="perPage" value="100" checked={perPage === '100'} onChange={() => setPerPage('100')} /> 100</label>
          </div>
        </motion.div>
        <motion.button
          className="mt-6 w-full px-6 py-3 rounded-xl bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center justify-center gap-2"
          onClick={onApply}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="w-5 h-5" />
          Найти
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const Jobs: React.FC = () => {
  const [query, setQuery] = useState("");
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [searchIn, setSearchIn] = useState<{name: boolean; company: boolean; description: boolean}>({name: false, company: false, description: false});
  const [exclude, setExclude] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [salaryFrom, setSalaryFrom] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('tenge');
  const [onlyWithSalary, setOnlyWithSalary] = useState(false);
  const [education, setEducation] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [employment, setEmployment] = useState<string[]>([]);
  const [schedule, setSchedule] = useState('');
  const [workHours, setWorkHours] = useState('');
  const [workFormat, setWorkFormat] = useState<string[]>([]);
  const [otherParams, setOtherParams] = useState<string[]>([]);
  const [sort, setSort] = useState('relevance');
  const [period, setPeriod] = useState('all');
  const [perPage, setPerPage] = useState('20');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (query) params.append("text", query);
    if (exclude) params.append("exclude_words", exclude);
    if (specialization) params.append("specialization", specialization);
    if (industry) params.append("industry", industry);
    if (region) params.append("area", region); else params.append("area", "40");
    if (salaryFrom) params.append("salary", salaryFrom);
    if (salaryCurrency) params.append("currency", salaryCurrency === 'tenge' ? 'KZT' : salaryCurrency === 'usd' ? 'USD' : 'EUR');
    if (onlyWithSalary) params.append("only_with_salary", "true");
    if (education.length) params.append("education", education.join(","));
    if (experience) params.append("experience", experience);
    if (employment.length) employment.forEach(e => params.append("employment", e));
    if (schedule) params.append("schedule", schedule);
    if (workFormat.length) workFormat.forEach(f => params.append("schedule", f));
    // Искать только в...
    if (searchIn.name) params.append("search_field", "name");
    if (searchIn.company) params.append("search_field", "company_name");
    if (searchIn.description) params.append("search_field", "description");
    // Сортировка
    if (sort === 'date') params.append("order_by", "publication_time");
    else params.append("order_by", "relevance");
    // Период
    if (period === 'month') params.append("search_period", "30");
    else if (period === 'week') params.append("search_period", "7");
    else if (period === '3days') params.append("search_period", "3");
    else if (period === 'day') params.append("search_period", "1");
    // Кол-во на странице
    if (perPage) params.append("per_page", perPage);
    params.append("clusters", "true");
    params.append("enable_snippets", "true");
    params.append("host", "hh.kz");
    params.append("vacancy_type", "open");
    params.append("responses_count_enabled", "true");
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

  // VacancyCard адаптация
  const VacancyCard = ({ vacancy }: { vacancy: Vacancy }) => {
    const formatSalary = (salary: Vacancy['salary']) => {
      if (!salary) return 'Зарплата не указана';
      const from = salary.from ? `${salary.from.toLocaleString()} ` : '';
      const to = salary.to ? `${salary.to.toLocaleString()} ` : '';
      const currency = salary.currency === 'RUR' ? '₽' : salary.currency;
      return `${from}${to}${currency}`;
    };

    return (
      <motion.div 
        className="bg-white dark:bg-[#232336] rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-[#F3EDFF] dark:border-[#232336] shadow-sm hover:shadow-md transition-all cursor-pointer"
        onClick={() => navigate(`/jobs/${vacancy.id}`)}
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#1E0E62] dark:text-white mb-1 sm:mb-2">
              {vacancy.name}
            </h3>
            <p className="text-[#A166FF] font-medium mb-2 sm:mb-4 text-base sm:text-lg">
              {formatSalary(vacancy.salary)}
            </p>
          </div>
          {vacancy.employer.logo_urls && (
            <img
              src={vacancy.employer.logo_urls.original}
              alt={vacancy.employer.name}
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
            />
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2 sm:mb-0">
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {vacancy.area.name}
          </span>
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {vacancy.schedule.name}
          </span>
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] flex items-center gap-1">
            <User className="w-3 h-3" />
            {vacancy.experience.name}
          </span>
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-[#F3EDFF] dark:bg-[#181826] text-[#A166FF] flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {vacancy.employment.name}
          </span>
        </div>

        {vacancy.snippet.requirement && (
          <div>
            <h4 className="font-medium text-[#1E0E62] dark:text-white mb-0.5 sm:mb-1 text-sm sm:text-base">Требования:</h4>
            <p className="text-[#8E8E93] dark:text-[#B0B0B0] text-xs sm:text-sm" dangerouslySetInnerHTML={{ __html: vacancy.snippet.requirement }} />
          </div>
        )}

        {vacancy.snippet.responsibility && (
          <div>
            <h4 className="font-medium text-[#1E0E62] dark:text-white mb-0.5 sm:mb-1 text-sm sm:text-base">Обязанности:</h4>
            <p className="text-[#8E8E93] dark:text-[#B0B0B0] text-xs sm:text-sm" dangerouslySetInnerHTML={{ __html: vacancy.snippet.responsibility }} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 sm:mt-4 gap-2 sm:gap-0">
          <p className="text-[#8E8E93] dark:text-[#B0B0B0] flex items-center gap-1 text-xs sm:text-base">
            <Building className="w-4 h-4" />
            {vacancy.employer.name}
          </p>
          <motion.a
            href={vacancy.alternate_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 sm:px-4 py-2 rounded-full bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center gap-2 text-xs sm:text-sm"
            onClick={(e) => e.stopPropagation()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ExternalLink className="w-4 h-4" />
            Откликнуться
          </motion.a>
        </div>
      </motion.div>
    );
  };

  // Пагинированные вакансии
  const pagedVacancies = vacancies.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(vacancies.length / pageSize);

  return (
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <motion.h1 
        className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-[#A166FF]" />
        Поиск вакансий
      </motion.h1>
      {/* Поисковая строка с фильтром и кнопкой поиска */}
      <motion.form 
        onSubmit={searchJobs} 
        className="mb-6 sm:mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-stretch sm:items-center w-full max-w-2xl mx-auto">
          <motion.div 
            className="relative flex-1"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Профессия, должность или компания"
              className="w-full pl-10 pr-12 sm:pr-16 py-3 rounded-lg sm:rounded-xl border-2 border-blue-400 focus:outline-none text-sm sm:text-base bg-white placeholder-gray-400 transition-all duration-200"
            />
            <motion.button
              type="button"
              onClick={() => setShowFilters(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 rounded-lg sm:rounded-xl p-2 transition-colors duration-200"
              aria-label="Фильтр"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Filter className="w-5 h-5" />
            </motion.button>
          </motion.div>
          <motion.button
            type="submit"
            className="mt-2 sm:mt-0 sm:ml-4 px-4 sm:px-6 py-3 rounded-lg sm:rounded-xl bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center gap-2 text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-5 h-5" />
            Найти
          </motion.button>
        </div>
      </motion.form>
      {/* Модалка фильтров */}
      <AnimatePresence>
        <JobsFilterModal
          open={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={() => { setShowFilters(false); searchJobs(); }}
          filters={{
            exclude, specialization, industry, region, salaryFrom, salaryCurrency, onlyWithSalary,
            education, experience, employment, schedule, workFormat, searchIn, sort, period, perPage,
            setExclude, setSpecialization, setIndustry, setRegion, setSalaryFrom, setSalaryCurrency, setOnlyWithSalary,
            setEducation, setExperience, setEmployment, setSchedule, setWorkFormat, setSearchIn, setSort, setPeriod, setPerPage
          }}
          setFilters={() => {}}
        />
      </AnimatePresence>

      <AnimatePresence>
        {clusters.length > 0 && (
          <motion.div 
            className="mb-6 sm:mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4">Фильтры</h2>
            <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#EAD7FF]">
              {clusters.map((cluster, index) => (
                <motion.button
                  key={cluster.id}
                  onClick={() => handleClusterClick(cluster.id, cluster.items[0].value)}
                  className="px-3 sm:px-4 py-2 rounded-full bg-[#F3EDFF] text-[#A166FF] font-medium hover:bg-[#EAD7FF] transition-colors duration-200 text-xs sm:text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                >
                  {cluster.name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <motion.div 
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="animate-spin h-8 w-8 text-[#A166FF] mx-auto" />
        </motion.div>
      ) : error ? (
        <motion.div 
          className="text-center py-8 text-red-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {error}
        </motion.div>
      ) : vacancies.length === 0 ? (
        <motion.div 
          className="text-center py-8 text-[#8E8E93]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Вакансии не найдены
        </motion.div>
      ) : (
        <>
          <motion.div 
            className="space-y-4 sm:space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <AnimatePresence>
              {pagedVacancies.map((vacancy, index) => (
                <motion.div
                  key={vacancy.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <VacancyCard vacancy={vacancy} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {totalPages > 1 && (
            <motion.div 
              className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-6 sm:mt-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.button
                className="px-3 sm:px-4 py-2 rounded-md sm:rounded-lg bg-gray-100 text-gray-700 font-semibold disabled:opacity-50 hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </motion.button>
              <span className="text-base sm:text-lg font-medium">{page} / {totalPages}</span>
              <motion.button
                className="px-3 sm:px-4 py-2 rounded-md sm:rounded-lg bg-gray-100 text-gray-700 font-semibold disabled:opacity-50 hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Вперёд
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Jobs; 