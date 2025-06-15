import { useEffect, useRef, useState } from 'react';
import { Story } from '@/types/story';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const REACTIONS = ['👍', '🔥', '😂', '😍', '👏'];

interface StoryModalProps {
  story: Story | null;
  onClose: () => void;
}

const StoryModal: React.FC<StoryModalProps> = ({ story, onClose }) => {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (story && auth.currentUser) {
      updateDoc(doc(db, 'stories', story.id), {
        viewedBy: arrayUnion(auth.currentUser.uid)
      });
    }
    if (story) {
      timerRef.current = setTimeout(onClose, 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [story, onClose]);

  const handleReaction = async (reaction: string) => {
    setSelectedReaction(reaction);
    if (story && auth.currentUser) {
      await updateDoc(doc(db, 'stories', story.id), {
        [`reactions.${reaction}`]: arrayUnion(auth.currentUser.uid)
      });
    }
  };

  if (!story) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-xl p-4 max-w-md w-full">
        <button
          className="absolute top-2 right-2 text-[#A166FF] text-2xl"
          onClick={onClose}
        >×</button>
        <img src={story.imageUrl} alt="story" className="w-full rounded-lg mb-2" />
        <div className="flex items-center gap-2 mb-2">
          <img src={story.userAvatar} className="w-8 h-8 rounded-full" alt={story.userName} />
          <span className="font-semibold">{story.userName}</span>
          <span className="text-xs text-gray-400 ml-2">{new Date(story.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex gap-2 mt-4 mb-2">
          {REACTIONS.map(r => (
            <button
              key={r}
              className={`text-2xl px-2 py-1 rounded-full border ${selectedReaction === r ? 'border-[#A166FF] bg-[#F3EDFF]' : 'border-transparent'}`}
              onClick={() => handleReaction(r)}
              disabled={!!selectedReaction}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Просмотрели: {story.viewedBy?.length || 0}
        </div>
      </div>
    </div>
  );
};

export default StoryModal; 