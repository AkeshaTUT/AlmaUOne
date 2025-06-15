import { useState, useEffect } from 'react';
import StoryBar from '@/components/StoryBar';
import StoryModal from '@/components/StoryModal';
import TopProfileBar from '@/components/TopProfileBar';
import BackButton from "@/components/BackButton";
import { Story } from '@/types/story';
import { db, storage, auth } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

// Пример данных (замени на загрузку из Firestore)
const stories: Story[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Иван',
    userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    createdAt: new Date().toISOString(),
    viewedBy: [],
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Мария',
    userAvatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
    createdAt: new Date().toISOString(),
    viewedBy: [],
  },
];

export default function NewsPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Загрузка историй из Firestore
  useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setStories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story)));
    });
    return () => unsub();
  }, []);

  // Форма добавления истории
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !auth.currentUser) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `stories/${auth.currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'stories'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email || 'Пользователь',
        userAvatar: auth.currentUser.photoURL || '',
        imageUrl: url,
        createdAt: serverTimestamp(),
        viewedBy: [],
      });
      toast.success('История добавлена!');
      setFile(null);
    } catch (e) {
      toast.error('Ошибка загрузки истории');
    }
    setUploading(false);
  };

  // Для StoryBar: данные текущего пользователя
  const currentUser = auth.currentUser
    ? { userName: auth.currentUser.displayName || auth.currentUser.email || 'Вы', userAvatar: auth.currentUser.photoURL || '' }
    : undefined;

  return (
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <TopProfileBar />
      <h1 className="text-3xl font-bold mb-6">Новости и истории</h1>
      <div className="mb-4 flex items-center gap-4">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 rounded bg-[#A166FF] text-white font-semibold disabled:opacity-50"
        >
          {uploading ? 'Загрузка...' : 'Добавить историю'}
        </button>
      </div>
      <StoryBar
        stories={stories}
        onStoryClick={setActiveStory}
        onAddClick={() => document.querySelector('input[type=file]')?.click()}
        currentUser={currentUser}
      />
      <StoryModal story={activeStory} onClose={() => setActiveStory(null)} />
      {/* Здесь можно добавить ленту новостей, посты и т.д. */}
    </div>
  );
} 