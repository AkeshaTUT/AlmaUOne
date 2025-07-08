import React, { useState } from 'react';
import BackButton from '@/components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Brain, 
  Send, 
  Loader2, 
  AlertCircle,
  Bot,
  Sparkles
} from 'lucide-react';

const TABS = [
  { label: 'FAQ-бот', value: 'faq', icon: <HelpCircle className="w-4 h-4" /> },
  { label: 'Резюме лекций', value: 'summary', icon: <FileText className="w-4 h-4" /> },
  { label: 'Генератор вопросов', value: 'questions', icon: <Brain className="w-4 h-4" /> },
  { label: 'Учебный помощник', value: 'assistant', icon: <MessageSquare className="w-4 h-4" /> },
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
          "model": "deepseek/deepseek-chat-v3-0324:free", // Используем более экономичную модель
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
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <motion.div 
        className="w-full max-w-3xl mx-auto bg-white dark:bg-[#232336] rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-8"
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.h1 
          className="text-2xl sm:text-3xl font-bold text-[#1E0E62] dark:text-white mb-4 sm:mb-8 flex items-center gap-2 sm:gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-[#A166FF]" />
          FAQ и AI-помощник
        </motion.h1>
        
        <motion.div 
          className="flex gap-2 sm:gap-2.5 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#EAD7FF]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {TABS.map((t, index) => (
            <motion.button
              key={t.value}
              className={`px-3 sm:px-4 py-2 rounded-full font-semibold transition text-xs sm:text-sm whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
                tab === t.value 
                  ? 'bg-[#A166FF] text-white' 
                  : 'bg-[#F3EDFF] text-[#A166FF] hover:bg-[#EAD7FF]'
              }`}
              onClick={() => { setTab(t.value); setResult(''); setInput(''); setError(null); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              style={{ minWidth: 110 }}
            >
              {t.icon}
              {t.label}
            </motion.button>
          ))}
        </motion.div>
        
        <motion.form 
          onSubmit={handleSubmit} 
          className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {tab === 'faq' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="text"
                  placeholder="Задай вопрос (например, когда экзамен по математике?)"
                  className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  required
                />
              </motion.div>
            )}
            {tab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <textarea
                  placeholder="Вставь текст лекции для резюме..."
                  className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white min-h-[100px] sm:min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  required
                />
              </motion.div>
            )}
            {tab === 'questions' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <textarea
                  placeholder="Вставь текст лекции для генерации вопросов..."
                  className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white min-h-[100px] sm:min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  required
                />
              </motion.div>
            )}
            {tab === 'assistant' && (
              <motion.div
                key="assistant"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="text"
                  placeholder="Спроси совет по учёбе (например, как готовиться к экзамену?)"
                  className="w-full px-3 sm:px-4 py-3 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            type="submit"
            className="px-4 sm:px-6 py-3 rounded-lg bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-base sm:text-lg"
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {loading ? 'Обработка...' : 'Отправить'}
          </motion.button>
        </motion.form>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
          {result && (
            <motion.div 
              className="bg-[#F3EDFF] dark:bg-[#181826] rounded-lg sm:rounded-xl p-3 sm:p-4 text-[#1E0E62] dark:text-white whitespace-pre-line border-l-4 border-[#A166FF] text-sm sm:text-base"
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[#A166FF]" />
                <span className="font-semibold">Ответ AI:</span>
              </div>
              {result}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
} 