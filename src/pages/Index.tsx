import React, { useState, useEffect } from "react";
import characterImg from "@/assets/3d-character.png";
// import themeIcon from "@/assets/theme.png";
// import notificationIcon from "@/assets/notification.png";
import searchIcon from "@/assets/search.png";
import Sidebar from "@/components/Sidebar";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import TopBar from "@/components/TopBar";
import Avatar from "@/components/Avatar";
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from '@/components/ui/command';
import { User, Briefcase, Book, Newspaper, Search, Menu } from 'lucide-react';
import { courseraService } from '@/services/courseraService';
import { motion } from 'framer-motion';
import GPAChart from "@/components/GPAChart";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; email?: string; avatarUrl?: string } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], jobs: [], courses: [], news: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) setProfile(snap.data() as any);
        else setProfile({
          name: auth.currentUser.displayName || "",
          email: auth.currentUser.email || "",
          avatarUrl: auth.currentUser.photoURL || "",
        });
      }
    };
    fetchProfile();
  }, []);

  // Глобальный поиск по всем категориям
  useEffect(() => {
    if (!searchOpen || !searchValue) return;
    let cancelled = false;
    (async () => {
      // Пользователи
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(u => (u.name || u.email || '').toLowerCase().includes(searchValue.toLowerCase()));
      // Вакансии
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      const jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(j => (j.name || '').toLowerCase().includes(searchValue.toLowerCase()));
      // Курсы
      let courses = [];
      try {
        courses = await courseraService.getCourses({ searchQuery: searchValue });
      } catch {}
      // Новости
      const newsSnap = await getDocs(query(collection(db, 'stories'), orderBy('createdAt', 'desc')));
      const news = newsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(n => (n.userName || '').toLowerCase().includes(searchValue.toLowerCase()));
      if (!cancelled) setSearchResults({ users, jobs, courses, news });
    })();
    return () => { cancelled = true; };
  }, [searchOpen, searchValue]);

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <motion.div 
        className="min-h-screen bg-[#FDF9FF] flex flex-col items-center py-4 px-2 sm:py-8 sm:px-0" 
        style={{ fontFamily: 'Inter, -apple-system, Roboto, Helvetica, sans-serif' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Top bar */}
        <motion.div 
          className="w-full max-w-6xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 px-1 sm:px-0"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Меню слева */}
          <motion.button 
            className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-[#F3EDFF] transition-colors duration-200 rounded-lg mb-2 sm:mb-0"
            onClick={() => setSidebarOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-6 h-6" />
          </motion.button>
          {/* Поиск по центру */}
          <div className="flex-1 flex justify-center w-full">
            <motion.div 
              className="relative w-full max-w-full sm:max-w-3xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <input
                className="w-full rounded-full px-4 py-2 sm:px-6 sm:py-3 pr-10 sm:pr-12 border-2 border-[#3B82F6] focus:outline-none text-base shadow-lg transition-all duration-200 focus:shadow-xl text-gray-800 placeholder:text-gray-400"
                placeholder="Search..."
                style={{ fontFamily: 'Inter, -apple-system, Roboto, Helvetica, sans-serif', fontWeight: 500 }}
                onFocus={() => setSearchOpen(true)}
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
              <motion.span 
                className="absolute right-3 top-1/2 -translate-y-1/2 sm:right-4"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Search className="w-6 h-6 text-gray-500" />
              </motion.span>
              <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
                <CommandInput placeholder="Поиск по всему сайту..." value={searchValue} onValueChange={setSearchValue} />
                <CommandList>
                  <CommandEmpty>Ничего не найдено</CommandEmpty>
                  <CommandGroup heading="Пользователи">
                    {searchResults.users.map((u: any) => (
                      <CommandItem key={u.id} onSelect={() => navigate(`/profile/${u.id}`)}>
                        <User className="mr-2 w-4 h-4" />{u.name || u.email}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="Вакансии">
                    {searchResults.jobs.map((j: any) => (
                      <CommandItem key={j.id} onSelect={() => navigate(`/jobs/${j.id}`)}>
                        <Briefcase className="mr-2 w-4 h-4" />{j.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="Курсы">
                    {searchResults.courses.map((c: any) => (
                      <CommandItem key={c.id} onSelect={() => window.open(c.url, '_blank')}>
                        <Book className="mr-2 w-4 h-4" />{c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="Новости">
                    {searchResults.news.map((n: any) => (
                      <CommandItem key={n.id} onSelect={() => navigate(`/news/${n.id}`)}>
                        <Newspaper className="mr-2 w-4 h-4" />{n.userName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </CommandDialog>
            </motion.div>
          </div>
        </motion.div>
        {/* GPA Chart - теперь под поиском */}
      </motion.div>
    </>
  );
};

export { Index };
export default Index;