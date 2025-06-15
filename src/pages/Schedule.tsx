import React, { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import BackButton from "@/components/BackButton";

interface Lesson {
  id: string;
  title: string;
  type: 'lecture' | 'rk1' | 'exam' ;
  startTime: string;
  endTime: string;
  location: string;
  teacher: string;
  notes?: string;
}

const Schedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Monday, 6 = Sunday

  // Генерация дней недели
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Начинаем с понедельника
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Пример расписания (в реальном приложении это будет приходить с бэкенда)
  const schedule: Record<number, Lesson[]> = {};

  const getDaySchedule = (dayIndex: number) => {
    return schedule[dayIndex] || [];
  };

  const getTypeColor = (type: Lesson['type']) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300';
      case 'rk1':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300';
      case 'exam':
        return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300';

    }
  };

  const getTypeLabel = (type: Lesson['type']) => {
    switch (type) {
      case 'lecture':
        return 'Лекция';
      case 'rk1':
        return 'Рубежный контроль 1';
      case 'exam':
        return 'Экзамен';
      default:
        return type;
    }
  };

    return (
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <h1 className="text-3xl font-bold mb-6 text-[#1E0E62] dark:text-white">Расписание</h1>

      {/* Дни недели */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {weekDays.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDay(index)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedDay === index
                ? 'bg-[#A166FF] text-white'
                : 'bg-[#F3EDFF] dark:bg-[#232336] text-[#1E0E62] dark:text-white hover:bg-[#EAD7FF] dark:hover:bg-[#2A2A42]'
            }`}
          >
            {format(day, 'EEEE', { locale: ru })}
            <br />
            {format(day, 'd MMMM', { locale: ru })}
          </button>
        ))}
      </div>

      {/* Расписание на выбранный день */}
      <div className="bg-white dark:bg-[#232336] rounded-2xl shadow-lg p-6 border border-[#F3EDFF] dark:border-[#232336] transition-colors">
        {getDaySchedule(selectedDay + 1).length === 0 ? (
          <div className="text-center py-8 text-[#8E8E93] dark:text-[#B0B0B0]">
            На этот день занятий нет
          </div>
        ) : (
          <div className="space-y-4">
            {getDaySchedule(selectedDay + 1).map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 rounded-2xl border border-[#F3EDFF] dark:border-[#232336] bg-white dark:bg-[#232336] shadow-sm transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1E0E62] dark:text-white">
                      {lesson.title}
                    </h3>
                    <p className="text-[#8E8E93] dark:text-[#B0B0B0] mt-1">
                      {lesson.teacher}
                    </p>
                    {lesson.notes && (
                      <p className="text-sm text-[#8E8E93] dark:text-[#B0B0B0] mt-1">
                        📝 {lesson.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[#1E0E62] dark:text-white font-medium">
                      {lesson.startTime} - {lesson.endTime}
                    </span>
                    <span className="text-[#8E8E93] dark:text-[#B0B0B0]">
                      Ауд. {lesson.location}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${getTypeColor(lesson.type)}`}>
                    {getTypeLabel(lesson.type)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule; 