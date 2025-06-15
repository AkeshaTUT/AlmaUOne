import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";

function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return { theme, toggleTheme };
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 50%)`;
  return color;
}

export default function TopBar({ profile }: { profile: { avatarUrl?: string; name?: string; email?: string } }) {
  const [showMenu, setShowMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const displayLetter = (profile?.name || profile?.email || "A")[0].toUpperCase();
  const bgColor = stringToColor(profile?.name || profile?.email || "A");

  return (
    <div className="fixed top-4 right-4 flex items-center gap-4 z-50">
      {/* Уведомления */}
      <button className="relative p-2 rounded-full hover:bg-[#F3EDFF] transition">
        <span className="sr-only">Уведомления</span>
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 24c1.7 0 3-1.3 3-3h-6c0 1.7 1.3 3 3 3z"/>
          <path d="M21 17v-5a7 7 0 10-14 0v5l-2 2v1h18v-1l-2-2z"/>
        </svg>
      </button>
      {/* Переключатель темы */}
      <button
        className="p-2 rounded-full hover:bg-[#F3EDFF] transition"
        onClick={toggleTheme}
        title="Сменить тему"
      >
        {theme === "dark" ? (
          <span role="img" aria-label="Светлая тема">☀️</span>
        ) : (
          <span role="img" aria-label="Тёмная тема">🌙</span>
        )}
      </button>
      {/* Профиль */}
      <div className="relative">
        <button
          className="p-1 rounded-full border-2 border-[#A166FF] hover:shadow"
          onClick={() => setShowMenu((v) => !v)}
        >
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="Профиль"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ background: bgColor }}
            >
              {displayLetter}
            </div>
          )}
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#232336] rounded-xl shadow-lg py-2 z-50">
            <button
              className="block w-full text-left px-4 py-2 hover:bg-[#F3EDFF] dark:hover:bg-[#181826]"
              onClick={() => navigate('/profile')}
            >
              Профиль
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-[#F3EDFF] dark:hover:bg-[#181826]"
              onClick={() => { auth.signOut(); window.location.reload(); }}
            >
              Выйти
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 