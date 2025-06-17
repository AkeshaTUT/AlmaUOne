import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";

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
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <h1 className="text-3xl font-bold mb-6 text-[#1E0E62] dark:text-white">Мои друзья</h1>
      <input
        className="mb-6 w-full max-w-md px-4 py-2 rounded border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF]"
        placeholder="Поиск по имени или email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="flex items-center gap-4 mb-4">
        <label className="font-medium">Сортировать по:</label>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="border rounded px-2 py-1">
          <option value="name">Имя</option>
          <option value="email">Email</option>
        </select>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
        >{sortDir === 'asc' ? '↑' : '↓'}</button>
      </div>
      {loading ? (
        <div>Загрузка...</div>
      ) : pagedFriends.length === 0 ? (
        <div className="text-gray-400">Нет друзей</div>
      ) : (
        <>
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {pagedFriends.map(friend => (
            <div key={friend.id} className="flex items-center gap-4 bg-[#F3EDFF] rounded-xl px-4 py-3">
              <Avatar src={friend.avatarUrl} name={friend.name} email={friend.email} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#1E0E62] truncate">{friend.name || 'Пользователь'}</div>
                <div className="text-xs text-gray-500 truncate">{friend.email}</div>
              </div>
              <button
                className="px-3 py-1 rounded bg-[#A166FF] text-white text-xs font-semibold hover:bg-[#8A4FD8]"
                onClick={() => {
                  const chatId = [auth.currentUser.uid, friend.id].sort().join('_');
                  navigate(`/chat?chatId=${chatId}`);
                }}
              >Открыть чат</button>
              <button
                className="px-3 py-1 rounded bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200"
                onClick={() => handleRemove(friend.id)}
              >Удалить</button>
            </div>
          ))}
        </div>
        {/* Пагинация */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="px-3 py-1 rounded border bg-white text-[#A166FF] font-semibold disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >Назад</button>
          <span>Страница {page} из {totalPages}</span>
          <button
            className="px-3 py-1 rounded border bg-white text-[#A166FF] font-semibold disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >Вперёд</button>
        </div>
        </>
      )}
    </div>
  );
};

export default FriendsPage; 