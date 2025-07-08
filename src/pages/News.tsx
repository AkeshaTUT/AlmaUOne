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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  Upload, 
  Image, 
  Loader2, 
  Plus,
  Camera
} from 'lucide-react';

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
    }, error => {
      console.error("Firestore Listen error (stories):", error);
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
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] p-2 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <TopProfileBar />
      <motion.h1 
        className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-6 text-[#1E0E62] dark:text-white flex items-center gap-2 sm:gap-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Newspaper className="w-6 h-6 sm:w-8 sm:h-8 text-[#A166FF]" />
        Новости и истории
      </motion.h1>
      
      <motion.div 
        className="mb-2 sm:mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-white dark:bg-[#232336] rounded-lg sm:rounded-2xl p-2 sm:p-4 shadow-md sm:shadow-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.label 
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md sm:rounded-lg bg-[#F3EDFF] text-[#A166FF] font-semibold hover:bg-[#EAD7FF] transition-colors duration-200 cursor-pointer text-xs sm:text-base"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Camera className="w-4 h-4" />
          Выбрать фото
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden"
          />
        </motion.label>
        
        {file && (
          <motion.div 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-[#A166FF]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Image className="w-4 h-4" />
            {file.name}
          </motion.div>
        )}
        
        <motion.button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-3 sm:px-4 py-2 rounded-md sm:rounded-lg bg-[#A166FF] text-white font-semibold disabled:opacity-50 hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center gap-2 text-xs sm:text-base"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? 'Загрузка...' : 'Добавить историю'}
        </motion.button>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <StoryBar
          stories={stories}
          onStoryClick={setActiveStory}
          onAddClick={() => document.querySelector('input[type=file]')?.click()}
          currentUser={currentUser}
        />
      </motion.div>
      
      <AnimatePresence>
        {activeStory && (
          <StoryModal story={activeStory} onClose={() => setActiveStory(null)} />
        )}
      </AnimatePresence>
      
      {/* Здесь можно добавить ленту новостей, посты и т.д. */}
    </motion.div>
  );
} 