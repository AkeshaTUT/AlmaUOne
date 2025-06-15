import React, { useState } from 'react';
import BackButton from '@/components/BackButton';

const TABS = [
  { label: 'FAQ-бот', value: 'faq' },
  { label: 'Резюме лекций', value: 'summary' },
  { label: 'Генератор вопросов', value: 'questions' },
  { label: 'Учебный помощник', value: 'assistant' },
];

const OPENROUTER_API_KEY = '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';

// Оптимизированные промпты для экономии токенов
const getPromptForTab = (tab: string, input: string) => {
  const basePrompt = "Ты - помощник студента. ";
  switch (tab) {
    case 'faq':
      return `${basePrompt}Ответь кратко и по существу: ${input}`;
    case 'summary':
      return `${basePrompt}Сделай краткое резюме лекции, выдели главные темы и ключевые моменты: ${input}`;
    case 'questions':
      return `${basePrompt}Сгенерируй 5 вопросов по лекции для проверки понимания: ${input}`;
    case 'assistant':
      return `${basePrompt}Дай краткий и полезный совет по учебе: ${input}`;
    default:
      return input;
  }
};

export default function FAQPage() {
  const [tab, setTab] = useState('faq');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Student Site",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-3.5-turbo", // Используем более экономичную модель
          "messages": [
            {
              "role": "system",
              "content": "Ты - помощник студента. Отвечай кратко и по существу."
            },
            {
              "role": "user",
              "content": getPromptForTab(tab, input)
            }
          ],
          "max_tokens": 500, // Ограничиваем длину ответа
          "temperature": 0.7 // Баланс между креативностью и точностью
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка при запросе к API');
      }

      const data = await response.json();
      setResult(data.choices[0].message.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setResult('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#232336] rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-[#1E0E62] dark:text-white mb-8">FAQ и AI-помощник</h1>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button
              key={t.value}
              className={`px-4 py-2 rounded-full font-semibold transition text-sm whitespace-nowrap ${tab === t.value ? 'bg-[#A166FF] text-white' : 'bg-[#F3EDFF] text-[#A166FF] hover:bg-[#EAD7FF]'}`}
              onClick={() => { setTab(t.value); setResult(''); setInput(''); setError(null); }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4">
          {tab === 'faq' && (
            <input
              type="text"
              placeholder="Задай вопрос (например, когда экзамен по математике?)"
              className="px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
          )}
          {tab === 'summary' && (
            <textarea
              placeholder="Вставь текст лекции для резюме..."
              className="px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white min-h-[120px]"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
          )}
          {tab === 'questions' && (
            <textarea
              placeholder="Вставь текст лекции для генерации вопросов..."
              className="px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white min-h-[120px]"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
          )}
          {tab === 'assistant' && (
            <input
              type="text"
              placeholder="Спроси совет по учёбе (например, как готовиться к экзамену?)"
              className="px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
              value={input}
              onChange={e => setInput(e.target.value)}
              required
            />
          )}
          <button
            type="submit"
            className="px-6 py-2 rounded bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition disabled:opacity-50"
            disabled={loading || !input.trim()}
          >
            {loading ? 'Обработка...' : 'Отправить'}
          </button>
        </form>
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-4 mb-4">
            {error}
          </div>
        )}
        {result && (
          <div className="bg-[#F3EDFF] dark:bg-[#181826] rounded-xl p-4 text-[#1E0E62] dark:text-white whitespace-pre-line">
            {result}
          </div>
        )}
      </div>
    </div>
  );
} 