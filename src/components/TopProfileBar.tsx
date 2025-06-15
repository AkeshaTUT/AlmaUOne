import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Avatar from "@/components/Avatar";

interface UserProfile {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

const TopProfileBar = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (snap.exists()) setProfile(snap.data() as UserProfile);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  if (!profile) return null;

  return (
    <div className="fixed top-4 right-4 flex items-center gap-3 bg-white dark:bg-[#232336] rounded-full shadow px-4 py-2 z-50">
      <Avatar src={profile.avatarUrl} name={profile.name} email={profile.email} size={40} />
      <div className="flex flex-col text-right">
        <span className="font-semibold text-[#A166FF] text-sm">{profile.name || 'Пользователь'}</span>
        <span className="text-xs text-gray-500">{profile.email}</span>
      </div>
      <button
        onClick={handleLogout}
        className="ml-2 px-3 py-1 rounded-full bg-[#F3EDFF] text-[#A166FF] text-xs font-semibold hover:bg-[#EAD7FF]"
      >
        Выйти
      </button>
    </div>
  );
};

export default TopProfileBar; 