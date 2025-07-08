import React, { useState } from 'react';
import GPAChart from '../components/GPAChart';
import BackButton from '../components/BackButton';

const years = [2024, 2023, 2022];
const periods = [1, 2, 3, 4, 5, 6, 7, 8];

// Мок-данные для предметов
const mockSubjects = [
  {
    id: 1,
    name: 'Критическое мышление',
    code: 'KM 1362131-47-CH',
    teacher: 'Третьякова М.С.',
    percent: 59,
    color: 'yellow',
    grades: [57, 64, 59, 50, 50, 65],
    details: ['СРМ. 11', 'СРМ. 22', 'РК 1', 'РК 2', 'Экз.', 'Итог.'],
    status: 'Удовл.'
  },
  {
    id: 2,
    name: 'ИТ-Стартап 1 (Идея/валидация)',
    code: 'ISI 136215',
    teacher: 'Непомнященко Т.Ж.',
    percent: 70,
    color: 'blue',
    grades: [80, 60, 80, 70, 70, 70],
    details: ['СРМ. 11', 'СРМ. 22', 'РК 1', 'РК 2', 'Экз.', 'Итог.'],
    status: 'Хорошо'
  },
  {
    id: 3,
    name: 'Введение в программирование и алгоритмы',
    code: 'VPA 1241',
    teacher: 'Алижан А.М.',
    percent: 72,
    color: 'blue',
    grades: [52, 89, 52, 89, 71, 73],
    details: ['СРМ. 11', 'СРМ. 22', 'РК 1', 'РК 2', 'Рейтинг', 'Итог.'],
    status: 'Хорошо'
  },
  {
    id: 4,
    name: 'Прикладная линейная алгебра',
    code: 'PLA 1362131',
    teacher: 'Шупикова Л.И.',
    percent: 25,
    color: 'red',
    grades: [28, 72, 28, 72, 50, 25],
    details: ['СРМ. 11', 'СРМ. 22', 'РК 1', 'РК 2', 'Экз.', 'Итог.'],
    status: 'Неуд.'
  },
  {
    id: 5,
    name: 'Анализ данных в Excel',
    code: 'ADE 1361151-7-CH',
    teacher: 'Сибанбаева С.Ж.',
    percent: 0,
    color: 'gray',
    grades: [33, 34, 33, 34, 33, 0],
    details: ['СРМ. 11', 'СРМ. 22', 'РК 1', 'РК 2', 'Недоп.', 'Итог.'],
    status: 'Недоп.'
  },
  {
    id: 6,
    name: 'Казахский (русский) язык 1 (A2)',
    code: 'KRYa 13',
    teacher: 'Сагатова Ш.Ш.',
    percent: 70,
    color: 'gray',
    grades: [70, 61.67, 70, 61.67, 66, 76],
    details: ['СРМ. 11', 'СРМ. 22', 'РК 1', 'РК 2', 'Экз.', 'Итог.'],
    status: 'Хорошо'
  },
  {
    id: 7,
    name: 'Введение в Web-разработку с помощью HTML',
    code: 'VWRHCJ 1218',
    teacher: 'Мукаш С.Б.',
    percent: 80,
    color: 'blue',
    grades: [80, 79, 80, 80, 80, 80],
    details: ['СРМ. 11', 'СРМ. 22', 'РК 1', 'РК 2', 'Экз.', 'Итог.'],
    status: 'Отлично'
  },
  {
    id: 8,
    name: 'Модуль социально-политических знаний',
    code: 'MSPZKP 1106',
    teacher: 'Третьякова М.С.',
    percent: 60,
    color: 'yellow',
    grades: [65, 50, 50, 50, 50, 60],
    details: ['СРМ. 11', 'СРМ. 22', 'РК 1', 'РК 2', 'Экз.', 'Итог.'],
    status: 'Удовл.'
  },
  {
    id: 9,
    name: 'Дизайн жизни',
    code: 'Dzh 1362131-30-CH',
    teacher: 'Джумагалиева Г.Д.',
    percent: 0,
    color: 'purple',
    grades: [65, 78, 60, 78, 60, 0],
    details: ['СРМ. 11', 'СРМ. 22', 'РК 1', 'РК 2', 'Экз.', 'Итог.'],
    status: 'Недоп.'
  },
];

// Пример ачивок/бейджей (можно расширить)
const badges = [
  { icon: '🏆', label: 'Лучший прогресс', color: 'bg-yellow-100 text-yellow-800' },
  { icon: '🎯', label: '100% посещаемость', color: 'bg-green-100 text-green-800' },
  { icon: '⭐', label: 'Отличник', color: 'bg-blue-100 text-blue-800' },
];

// Круговой прогресс-бар (SVG)
function CircularProgress({ percent, color }: { percent: number, color: string }) {
  const radius = 32;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.max(0, Math.min(percent, 100));
  const offset = circumference - (progress / 100) * circumference;
  const colorMap: Record<string, string> = {
    yellow: '#FFD600',
    blue: '#2196F3',
    red: '#F44336',
    gray: '#BDBDBD',
    purple: '#9C27B0',
  };
  return (
    <svg width={72} height={72} className="block mx-auto">
      <circle
        stroke="#F3F4F6"
        fill="none"
        strokeWidth={stroke}
        cx={radius}
        cy={radius}
        r={normalizedRadius}
      />
      <circle
        stroke={colorMap[color] || '#2196F3'}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,2,.3,1)' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="1.1em"
        fontWeight="bold"
        fill={colorMap[color] || '#2196F3'}
      >
        {percent > 0 ? `${percent}%` : ''}
      </text>
    </svg>
  );
}

// Мини-график прогресса (SVG line chart)
function MiniProgressChart({ grades, color }: { grades: number[], color: string }) {
  const w = 72, h = 24, pad = 4;
  const min = Math.min(...grades);
  const max = Math.max(...grades);
  const range = max - min || 1;
  const points = grades.map((g, i) => {
    const x = pad + i * ((w - 2 * pad) / (grades.length - 1));
    const y = h - pad - ((g - min) / range) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(' ');
  const colorMap: Record<string, string> = {
    yellow: '#FFD600', blue: '#2196F3', red: '#F44336', gray: '#BDBDBD', purple: '#9C27B0',
  };
  return (
    <svg width={w} height={h} className="block mx-auto mt-1">
      <polyline
        fill="none"
        stroke={colorMap[color] || '#2196F3'}
        strokeWidth={2}
        points={points}
        style={{ transition: 'all 0.5s' }}
      />
      {grades.map((g, i) => {
        const x = pad + i * ((w - 2 * pad) / (grades.length - 1));
        const y = h - pad - ((g - min) / range) * (h - 2 * pad);
        return <circle key={i} cx={x} cy={y} r={2.5} fill={colorMap[color] || '#2196F3'} />;
      })}
    </svg>
  );
}

function SubjectCard({ subject }: { subject: typeof mockSubjects[0] }) {
  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [sent, setSent] = useState(false);
  const handleSend = () => {
    setSent(true);
    setTimeout(() => { setShowModal(false); setSent(false); setQuestion(''); }, 1200);
  };
  return (
    <div className={`rounded-xl shadow-md border-2 border-gray-100 p-3 sm:p-4 flex flex-col w-full max-w-sm mx-auto bg-white relative overflow-hidden`}
      style={{ borderTop: `6px solid ${subject.color === 'yellow' ? '#FFD600' : subject.color === 'blue' ? '#2196F3' : subject.color === 'red' ? '#F44336' : subject.color === 'gray' ? '#BDBDBD' : subject.color === 'purple' ? '#9C27B0' : '#2196F3'}` }}>
      <div className="font-semibold text-xs sm:text-sm truncate mb-1" title={subject.name}>
        {subject.name} <span className="text-[10px] sm:text-xs text-gray-400">({subject.code})</span>
      </div>
      <div className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">{subject.teacher}</div>
      <CircularProgress percent={subject.percent} color={subject.color} />
      <MiniProgressChart grades={subject.grades} color={subject.color} />
      <div className="flex justify-center mt-2 mb-1">
        <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold"
          style={{ background: subject.color === 'yellow' ? '#FFF9C4' : subject.color === 'blue' ? '#E3F2FD' : subject.color === 'red' ? '#FFEBEE' : subject.color === 'gray' ? '#F5F5F5' : subject.color === 'purple' ? '#F3E5F5' : '#E3F2FD', color: subject.color === 'red' ? '#F44336' : '#333' }}>
          {subject.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-center text-xs mt-2">
        {subject.grades.map((grade, i) => (
          <div key={i} className="font-bold text-gray-700 text-xs sm:text-sm">{grade}</div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 text-center text-[9px] sm:text-[10px] text-gray-400 mt-1">
        {subject.details.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <button
        className="mt-3 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200"
        onClick={() => setShowModal(true)}
      >
        Задать вопрос преподавателю
      </button>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs mx-2 relative">
            <button className="absolute top-2 right-2 text-xl text-gray-400 hover:text-gray-600" onClick={() => setShowModal(false)}>&times;</button>
            <div className="font-bold text-gray-800 mb-2 text-center">Вопрос преподавателю</div>
            <div className="text-xs text-gray-500 mb-2 text-center">{subject.teacher}</div>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-2"
              rows={3}
              placeholder="Ваш вопрос..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              disabled={sent}
            />
            <button
              className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition disabled:opacity-60"
              onClick={handleSend}
              disabled={!question.trim() || sent}
            >
              {sent ? 'Отправлено!' : 'Отправить'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Аналитика: bar chart по средним баллам по предметам
function AnalyticsBarChart({ subjects }: { subjects: typeof mockSubjects }) {
  const max = Math.max(...subjects.map(s => s.percent));
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow p-4 mb-4 border border-gray-100">
      <div className="font-semibold text-gray-700 mb-2 text-center">Аналитика по предметам</div>
      <div className="flex flex-col gap-2">
        {subjects.map(s => (
          <div key={s.id} className="flex items-center gap-2">
            <span className="w-32 truncate text-xs sm:text-sm font-medium text-gray-600">{s.name}</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div style={{width: `${(s.percent / max) * 100}%`, background: s.color === 'yellow' ? '#FFD600' : s.color === 'blue' ? '#2196F3' : s.color === 'red' ? '#F44336' : s.color === 'gray' ? '#BDBDBD' : s.color === 'purple' ? '#9C27B0' : '#2196F3', transition: 'width 0.5s'}} className="h-4 rounded-full"></div>
            </div>
            <span className="w-10 text-right text-xs font-bold text-gray-700">{s.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const GradesPage: React.FC = () => {
  const [year, setYear] = useState<number>(2024);
  const [period, setPeriod] = useState<number | 'all'>('all');

  return (
    <div className="max-w-6xl mx-auto px-1 sm:px-2 py-4 w-full">
      <BackButton className="mb-3 sm:mb-4" />
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">Журнал обучающегося</h1>
      {/* Бейджи */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {badges.map(badge => (
          <span key={badge.label} className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-xs sm:text-sm shadow ${badge.color}`}>
            <span className="mr-1 text-lg">{badge.icon}</span> {badge.label}
          </span>
        ))}
      </div>
      {/* Аналитика */}
      <AnalyticsBarChart subjects={mockSubjects} />
      {/* Краткий вывод */}
      <div className="text-center text-sm text-gray-600 mb-4">
        <span className="font-semibold">Сильные стороны:</span> {mockSubjects.filter(s => s.percent >= 70).map(s => s.name).join(', ') || 'нет'}<br/>
        <span className="font-semibold">Зоны для роста:</span> {mockSubjects.filter(s => s.percent < 50).map(s => s.name).join(', ') || 'нет'}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pb-2 sm:pb-0">
        <div className="flex gap-2 items-center flex-nowrap">
          <label className="font-medium text-gray-700 whitespace-nowrap text-xs sm:text-sm">Год:</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="rounded-lg border border-gray-300 px-2 py-1 text-xs sm:text-sm min-w-[70px]">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-2 items-center flex-nowrap">
          <label className="font-medium text-gray-700 whitespace-nowrap text-xs sm:text-sm">Академический период:</label>
          <select value={period} onChange={e => setPeriod(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="rounded-lg border border-gray-300 px-2 py-1 text-xs sm:text-sm min-w-[70px]">
            <option value="all">Все</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex gap-2 items-center flex-nowrap">
          <button className="px-2 sm:px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-50 transition whitespace-nowrap">Инструкция пользователя</button>
        </div>
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 justify-center">
        {mockSubjects.map(subject => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </div>
  );
};

export default GradesPage; 