import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  MessageCircle, 
  UserMinus, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Loader2,
  UserX
} from 'lucide-react';

const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<any[]>([]);
  const [allFriends, setAllFriends] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [sortBy, setSortBy] = useState<'name' | 'email'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      const userSnap = await getDocs(collection(db, "users"));
      const user = auth.currentUser;
      if (!user) return setLoading(false);
      const me = userSnap.docs.find(d => d.id === user.uid)?.data();
      if (!me?.friends) {
        setFriends([]);
        setAllFriends([]);
        setLoading(false);
        return;
      }
      const friendIds = Object.keys(me.friends);
      const all = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const friendsList = all.filter(u => friendIds.includes(u.id));
      setFriends(friendsList);
      setAllFriends(friendsList);
      setLoading(false);
    };
    fetchFriends();
  }, []);

  useEffect(() => {
    let filtered = allFriends;
    if (search) {
      filtered = filtered.filter(f => (f.name || f.email || "").toLowerCase().includes(search.toLowerCase()));
    }
    filtered = [...filtered].sort((a, b) => {
      const aVal = (a[sortBy] || '').toLowerCase();
      const bVal = (b[sortBy] || '').toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    setFriends(filtered);
    setPage(1);
  }, [search, allFriends, sortBy, sortDir]);

  const totalPages = Math.ceil(friends.length / pageSize);
  const pagedFriends = friends.slice((page - 1) * pageSize, page * pageSize);

  const handleRemove = async (friendId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const userSnap = await getDocs(collection(db, "users"));
    const me = userSnap.docs.find(d => d.id === user.uid)?.data();
    if (!me?.friends) return;
    const newFriends = { ...me.friends };
    delete newFriends[friendId];
    await updateDoc(doc(db, "users", user.uid), { friends: newFriends });
    setFriends(friends => friends.filter(f => f.id !== friendId));
    setAllFriends(friends => friends.filter(f => f.id !== friendId));
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] p-2 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <motion.h1 
        className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-[#1E0E62] dark:text-white flex items-center gap-2 sm:gap-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Users className="w-7 h-7 sm:w-8 sm:h-8 text-[#A166FF]" />
        Мои друзья
      </motion.h1>
      
      <motion.div 
        className="mb-4 sm:mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="relative max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white dark:bg-[#181826] dark:text-white transition-all duration-200 text-sm sm:text-base"
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </motion.div>
      
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6 bg-white dark:bg-[#232336] rounded-xl p-2 sm:p-4 shadow-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <label className="font-medium text-[#1E0E62] dark:text-white text-sm sm:text-base">Сортировать по:</label>
        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value as any)} 
          className="border border-[#EAD7FF] rounded-lg px-2 py-1 sm:px-3 sm:py-2 bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
        >
          <option value="name">Имя</option>
          <option value="email">Email</option>
        </select>
        <motion.button
          className="p-2 rounded-lg bg-[#F3EDFF] text-[#A166FF] hover:bg-[#EAD7FF] transition-colors duration-200"
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUpDown className="w-5 h-5" />
        </motion.button>
      </motion.div>
      
      {loading ? (
        <motion.div 
          className="flex items-center justify-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-[#A166FF]" />
        </motion.div>
      ) : pagedFriends.length === 0 ? (
        <motion.div 
          className="text-center py-12 text-[#8E8E93] dark:text-[#B0B0B0]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <UserX className="w-16 h-16 mx-auto mb-4 text-[#A166FF] opacity-50" />
          <p className="text-lg">Нет друзей</p>
          <p className="text-sm">Добавьте друзей, чтобы начать общение</p>
        </motion.div>
      ) : (
        <>
          <motion.div 
            className="flex flex-col gap-2 sm:gap-4 max-h-[60vh] overflow-y-auto pr-1 sm:pr-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <AnimatePresence>
              {pagedFriends.map((friend, index) => (
                <motion.div 
                  key={friend.id} 
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white dark:bg-[#232336] rounded-xl px-2 py-2 sm:px-4 sm:py-3 shadow-sm border border-[#F3EDFF] dark:border-[#232336]"
                  initial={{ y: 20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  exit={{ y: -20, opacity: 0, scale: 0.9 }}
                >
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Avatar src={friend.avatarUrl} name={friend.name} email={friend.email} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#1E0E62] dark:text-white truncate text-sm sm:text-base">{friend.name || 'Пользователь'}</div>
                      <div className="text-xs text-gray-500 truncate">{friend.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-0">
                    <motion.button
                      className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-[#A166FF] text-white text-xs font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center gap-1"
                      onClick={() => {
                        const chatId = [auth.currentUser.uid, friend.id].sort().join('_');
                        navigate(`/chat?chatId=${chatId}`);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MessageCircle className="w-3 h-3" />
                    </motion.button>
                    <motion.button
                      className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors duration-200 flex items-center gap-1"
                      onClick={() => handleRemove(friend.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <UserMinus className="w-3 h-3" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {/* Пагинация */}
          {totalPages > 1 && (
            <motion.div 
              className="flex justify-center items-center gap-4 mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.button
                className="px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#232336] text-[#A166FF] font-semibold disabled:opacity-50 hover:bg-[#F3EDFF] transition-colors duration-200 flex items-center gap-2"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </motion.button>
              <span className="text-[#1E0E62] dark:text-white font-medium">Страница {page} из {totalPages}</span>
              <motion.button
                className="px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#232336] text-[#A166FF] font-semibold disabled:opacity-50 hover:bg-[#F3EDFF] transition-colors duration-200 flex items-center gap-2"
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

export default FriendsPage; 