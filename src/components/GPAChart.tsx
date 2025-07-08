import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Пример данных GPA (можно заменить на реальные)
const data = [
  { semester: '1', gpa: 2.5, subjects: [
    { name: 'Алгебра', grade: 'B', comment: 'Нужно подтянуть' },
    { name: 'История', grade: 'A', comment: 'Отлично' },
  ] },
  { semester: '2', gpa: 2.8, subjects: [
    { name: 'Геометрия', grade: 'B+', comment: 'Хорошо' },
    { name: 'Литература', grade: 'A-', comment: 'Молодец' },
  ] },
  { semester: '3', gpa: 3.1, subjects: [
    { name: 'Физика', grade: 'A', comment: 'Супер' },
    { name: 'История', grade: 'B+', comment: 'Стараться' },
  ] },
  { semester: '4', gpa: 3.3, subjects: [
    { name: 'Алгебра', grade: 'A', comment: 'Прогресс' },
    { name: 'Экономика', grade: 'A-', comment: 'Молодец' },
  ] },
  { semester: '5', gpa: 3.5, subjects: [
    { name: 'Программирование', grade: 'A', comment: 'Отлично' },
    { name: 'История', grade: 'A', comment: 'Супер' },
  ] },
  { semester: '6', gpa: 3.7, subjects: [
    { name: 'Математика', grade: 'A', comment: 'Молодец' },
    { name: 'Философия', grade: 'A-', comment: 'Хорошо' },
  ] },
  { semester: '7', gpa: 3.8, subjects: [
    { name: 'Экономика', grade: 'A', comment: 'Отлично' },
    { name: 'История', grade: 'A', comment: 'Супер' },
  ] },
  { semester: '8', gpa: 4.0, subjects: [
    { name: 'Программирование', grade: 'A+', comment: 'Лучший результат' },
    { name: 'Физика', grade: 'A', comment: 'Супер' },
  ] },
];

// Кастомный Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const { gpa, subjects } = payload[0].payload;
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 min-w-[220px]">
        <div className="font-semibold text-indigo-600 mb-1">Семестр {label}</div>
        <div className="mb-2">GPA: <span className="font-bold">{gpa}</span></div>
        <div className="mb-1 text-sm text-gray-700 font-medium">Предметы:</div>
        <ul className="mb-1">
          {subjects.map((s: any, idx: number) => (
            <li key={idx} className="flex justify-between text-sm text-gray-800">
              <span>{s.name}</span>
              <span className="font-semibold ml-2">{s.grade}</span>
            </li>
          ))}
        </ul>
        <div className="text-xs text-gray-500 mt-1">
          {subjects.map((s: any, idx: number) => (
            <div key={idx}>{s.comment}</div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const allSubjects = Array.from(new Set(data.flatMap(d => d.subjects.map(s => s.name))));

const GPAChart: React.FC = () => {
  const [semesterRange, setSemesterRange] = useState<'all' | '1-3' | '4-6' | '7-8'>('all');
  const [subject, setSubject] = useState<string>('all');
  const [showTable, setShowTable] = useState(false);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);

  // Фильтрация данных по выбранному диапазону семестров
  let filteredData = data;
  if (semesterRange === '1-3') filteredData = data.slice(0, 3);
  if (semesterRange === '4-6') filteredData = data.slice(3, 6);
  if (semesterRange === '7-8') filteredData = data.slice(6, 8);

  // Фильтрация предметов в tooltip
  const filterSubjects = (subjects: any[]) =>
    subject === 'all' ? subjects : subjects.filter(s => s.name === subject);

  const gpaDiff = (filteredData.length > 1)
    ? (filteredData[filteredData.length - 1].gpa - filteredData[0].gpa).toFixed(1)
    : null;

  // Мотивационные бейджи
  const topGpa = Math.max(...filteredData.map(d => d.gpa));
  const topSemester = filteredData.find(d => d.gpa === topGpa)?.semester;
  let bestProgress = 0;
  let bestProgressSemester = null;
  for (let i = 1; i < filteredData.length; i++) {
    const diff = filteredData[i].gpa - filteredData[i - 1].gpa;
    if (diff > bestProgress) {
      bestProgress = diff;
      bestProgressSemester = filteredData[i].semester;
    }
  }
  const raisedSemesters = filteredData.filter((d, i) => i > 0 && (d.gpa - filteredData[i - 1].gpa) >= 0.5).map(d => d.semester);

  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('gpa-table.pdf');
  };

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-lg p-4 w-full max-w-[900px] mx-auto mb-8 border border-gray-100" ref={chartRef}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <button
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold shadow transition text-sm mb-2 md:mb-0 order-2 md:order-1"
          onClick={handleDownloadPDF}
        >
          📤 Скачать как PDF
        </button>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-medium text-gray-700">Семестры:</span>
          <button onClick={() => setSemesterRange('all')} className={`px-3 py-1 rounded-full text-sm font-semibold border ${semesterRange==='all' ? 'bg-indigo-100 text-indigo-700 border-indigo-400' : 'bg-white text-gray-700 border-gray-300'} transition`}>Все</button>
          <button onClick={() => setSemesterRange('1-3')} className={`px-3 py-1 rounded-full text-sm font-semibold border ${semesterRange==='1-3' ? 'bg-indigo-100 text-indigo-700 border-indigo-400' : 'bg-white text-gray-700 border-gray-300'} transition`}>1-3</button>
          <button onClick={() => setSemesterRange('4-6')} className={`px-3 py-1 rounded-full text-sm font-semibold border ${semesterRange==='4-6' ? 'bg-indigo-100 text-indigo-700 border-indigo-400' : 'bg-white text-gray-700 border-gray-300'} transition`}>4-6</button>
          <button onClick={() => setSemesterRange('7-8')} className={`px-3 py-1 rounded-full text-sm font-semibold border ${semesterRange==='7-8' ? 'bg-indigo-100 text-indigo-700 border-indigo-400' : 'bg-white text-gray-700 border-gray-300'} transition`}>7-8</button>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-medium text-gray-700">Предмет:</span>
          <select value={subject} onChange={e => setSubject(e.target.value)} className="rounded-full border border-gray-300 px-3 py-1 text-sm">
            <option value="all">Все</option>
            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <h2 className="text-2xl font-bold text-gray-800">Прогресс GPA</h2>
        </div>
        <button className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-full font-semibold shadow transition text-sm">Сравнить с прошлым годом</button>
      </div>
      <p className="text-gray-500 mb-2">Ваш средний GPA за 8 семестров</p>
      <div className="rounded-xl overflow-hidden" style={{background: 'linear-gradient(90deg, #f3f4f6 0%, #e0e7ff 100%)'}}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="semester" tick={{ fill: '#6B7280', fontWeight: 500 }} label={{ value: 'Семестр', position: 'insideBottom', offset: -5, fill: '#6B7280' }} />
            <YAxis domain={[2, 4]} tick={{ fill: '#6B7280', fontWeight: 500 }} label={{ value: 'GPA', angle: -90, position: 'insideLeft', fill: '#6B7280' }} />
            <Tooltip content={({ active, payload, label }: any) => {
              if (active && payload && payload.length) {
                const { gpa, subjects } = payload[0].payload;
                const filteredSubjects = filterSubjects(subjects);
                return (
                  <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 min-w-[220px]">
                    <div className="font-semibold text-indigo-600 mb-1">Семестр {label}</div>
                    <div className="mb-2">GPA: <span className="font-bold">{gpa}</span></div>
                    <div className="mb-1 text-sm text-gray-700 font-medium">Предметы:</div>
                    <ul className="mb-1">
                      {filteredSubjects.length === 0 ? <li className='text-gray-400 text-sm'>Нет данных</li> : filteredSubjects.map((s: any, idx: number) => (
                        <li key={idx} className="flex justify-between text-sm text-gray-800">
                          <span>{s.name}</span>
                          <span className="font-semibold ml-2">{s.grade}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-gray-500 mt-1">
                      {filteredSubjects.map((s: any, idx: number) => (
                        <div key={idx}>{s.comment}</div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }} />
            <Line type="monotone" dataKey="gpa" stroke="#6366F1" strokeWidth={3} dot={{ r: 5, fill: '#fff', stroke: '#6366F1', strokeWidth: 3 }} activeDot={{ r: 7 }}>
              <LabelList dataKey="gpa" position="top" formatter={(value: number) => `GPA: ${value.toFixed(1)}`} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-end mt-2">
        <button
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-semibold shadow transition"
          onClick={() => setShowTable(v => !v)}
        >
          {showTable ? 'Скрыть таблицу' : 'Показать в таблице'}
        </button>
      </div>
      {showTable && (
        <div ref={tableRef} className="overflow-x-auto mt-4">
          <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Семестр</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">GPA</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Предмет</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Оценка</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => {
                const filteredSubjects = subject === 'all' ? row.subjects : row.subjects.filter((s: any) => s.name === subject);
                return filteredSubjects.length === 0 ? (
                  <tr key={i} className="bg-white">
                    <td className="px-3 py-2 border-t text-sm text-gray-700">{row.semester}</td>
                    <td className="px-3 py-2 border-t text-sm text-gray-700">{row.gpa}</td>
                    <td className="px-3 py-2 border-t text-sm text-gray-400 italic" colSpan={3}>Нет данных</td>
                  </tr>
                ) : filteredSubjects.map((s: any, j: number) => (
                  <tr key={i + '-' + j} className="bg-white">
                    <td className="px-3 py-2 border-t text-sm text-gray-700">{row.semester}</td>
                    <td className="px-3 py-2 border-t text-sm text-gray-700">{row.gpa}</td>
                    <td className="px-3 py-2 border-t text-sm text-gray-700">{s.name}</td>
                    <td className="px-3 py-2 border-t text-sm text-gray-700">{s.grade}</td>
                    <td className="px-3 py-2 border-t text-sm text-gray-500">{s.comment}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Мотивационная подпись */}
      {gpaDiff && (
        <div className="mt-4 text-center text-green-600 font-semibold text-base">
          Поздравляем! GPA вырос на {gpaDiff} балла с первого семестра
        </div>
      )}
      {/* Мотивационные бейджи */}
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {topSemester && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-sm shadow">
            🥇 Top GPA семестра: {topSemester}
          </span>
        )}
        {bestProgress > 0.01 && bestProgressSemester && (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm shadow">
            ⏫ Лучший прогресс: +{bestProgress.toFixed(1)} (семестр {bestProgressSemester})
          </span>
        )}
        {raisedSemesters.length > 0 && raisedSemesters.map(s => (
          <span key={s} className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-sm shadow">
            💪 Поднял GPA на 0.5+ (семестр {s})
          </span>
        ))}
      </div>
    </div>
  );
};

export default GPAChart; 