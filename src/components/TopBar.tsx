import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import React from "react";
import { requestFirebaseNotificationPermission, messaging } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const user = auth.currentUser;
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => {
      console.error("Firestore Listen error (notifications):", error);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    requestFirebaseNotificationPermission().then(token => {
      if (token) {
        // Здесь можно отправить токен на сервер или в Firestore
        console.log('FCM Token:', token);
      }
    });
    const unsubscribe = onMessage(messaging, (payload) => {
      if (payload?.notification?.title) {
        alert(`Push: ${payload.notification.title}\n${payload.notification.body || ''}`);
      }
    });
    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenNotifications = async () => {
    setShowNotifications(v => !v);
    // Отметить все как прочитанные
    notifications.filter(n => !n.isRead).forEach(async n => {
      await updateDoc(doc(db, "notifications", n.id), { isRead: true });
    });
  };

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  // Фильтрация: только последнее уведомление 'Вас добавил в друзья' от каждого пользователя
  const filteredNotifications = React.useMemo(() => {
    const seen = new Map();
    return notifications.filter(n => {
      if (n.title?.startsWith('Вас добавил в друзья:')) {
        const from = n.title.split(':')[1]?.trim();
        if (seen.has(from)) return false;
        seen.set(from, true);
        return true;
      }
      return true;
    });
  }, [notifications]);

  return (
    <div className="sticky top-0 left-0 w-full flex items-center gap-4 z-40 bg-white/90 dark:bg-[#181826]/90 backdrop-blur border-b border-gray-100 shadow-sm px-2 py-2 justify-end" style={{minHeight: 56}}>
      {/* Уведомления */}
      <button className="relative p-2 rounded-full hover:bg-[#F3EDFF] transition" onClick={handleOpenNotifications}>
        <span className="sr-only">Уведомления</span>
        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 24c1.7 0 3-1.3 3-3h-6c0 1.7 1.3 3 3 3z"/>
          <path d="M21 17v-5a7 7 0 10-14 0v5l-2 2v1h18v-1l-2-2z"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
        )}
      </button>
      {showNotifications && (
        <div ref={notifRef} className="absolute right-0 mt-12 w-80 bg-white dark:bg-[#232336] rounded-xl shadow-lg py-2 z-50 max-h-96 overflow-y-auto border border-[#EAD7FF]">
          <div className="px-4 py-2 font-semibold text-[#A166FF]">Уведомления</div>
          {filteredNotifications.length === 0 ? (
            <div className="px-4 py-6 text-gray-400 text-center">Нет уведомлений</div>
          ) : (
            <>
              <button
                className="ml-4 mb-2 px-3 py-1 rounded bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200"
                onClick={async () => {
                  for (const n of notifications) {
                    await deleteDoc(doc(db, 'notifications', n.id));
                  }
                }}
              >Очистить уведомления</button>
              {filteredNotifications.map(n => (
                <div key={n.id} className={`px-3 py-2 border-b last:border-b-0 ${!n.isRead ? 'bg-[#F3EDFF]' : ''}`} style={{ fontSize: 14, lineHeight: '18px' }}>
                  <div className="font-medium text-[#1E0E62] dark:text-white truncate" style={{ fontSize: 14 }}>{n.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{n.timestamp?.toDate ? n.timestamp.toDate().toLocaleString() : ''}</div>
                  {n.type === 'friend_request' && n.fromUserId && (
                    <div className="flex gap-2 mt-2">
                      <button
                        className="px-3 py-1 rounded bg-[#A166FF] text-white text-xs font-semibold hover:bg-[#8A4FD8]"
                        onClick={async () => {
                          await setDoc(doc(db, 'users', user.uid), { friends: { [n.fromUserId]: true } }, { merge: true });
                          await setDoc(doc(db, 'users', n.fromUserId), { friends: { [user.uid]: true } }, { merge: true });
                          await deleteDoc(doc(db, 'notifications', n.id));
                        }}
                      >Принять</button>
                      <button
                        className="px-3 py-1 rounded bg-gray-200 text-[#A166FF] text-xs font-semibold hover:bg-gray-300"
                        onClick={async () => {
                          await deleteDoc(doc(db, 'notifications', n.id));
                        }}
                      >Отклонить</button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
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