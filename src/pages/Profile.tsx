import React, { useEffect, useState } from "react";
import { db, auth, storage } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "../components/ui/use-toast";
import BackButton from "@/components/BackButton";
import ProfileEditForm from "@/components/ProfileEditForm";
import { useNavigate } from "react-router-dom";
import Avatar from "@/components/Avatar";

const defaultProfile = {
  name: "",
  status: "",
  about: "",
  email: "",
  skills: [],
  interests: [],
  education: [],
  experience: [],
  certificates: [],
  avatarUrl: "",
  bannerUrl: ""
};

export default function Profile() {
  const [userData, setUserData] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newEducation, setNewEducation] = useState({ place: "", degree: "", year: "" });
  const [newExperience, setNewExperience] = useState({ place: "", role: "", year: "" });
  const [newCertificate, setNewCertificate] = useState({ name: "", org: "", year: "" });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('onAuthStateChanged', user);
      if (user) {
        try {
          const ref = doc(db, "users", user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setUserData(snap.data());
            setForm(snap.data());
            setError(null);
            console.log('Profile loaded from Firestore:', snap.data());
          } else {
            // Автоматически создаём профиль с дефолтными значениями
            await setDoc(ref, { ...defaultProfile, email: user.email });
            setUserData({ ...defaultProfile, email: user.email });
            setForm({ ...defaultProfile, email: user.email });
            setError(null);
            console.log('Profile created in Firestore');
          }
        } catch (e) {
          setError('Ошибка при работе с Firestore: ' + (e as Error).message);
          console.error('Firestore error:', e);
        }
        setLoading(false);
      } else {
        setLoading(false);
        setError('Пользователь не залогинен');
      }
    });
    return () => unsubscribe();
  }, []);

  // Получить список друзей
  useEffect(() => {
    const fetchFriends = async () => {
      if (!userData?.friends) return setFriends([]);
      const friendIds = Object.keys(userData.friends || {});
      if (friendIds.length === 0) return setFriends([]);
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFriends(allUsers.filter(u => friendIds.includes(u.id)));
    };
    fetchFriends();
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Skills
  const addSkill = () => {
    if (newSkill.trim()) {
      setForm({ ...form, skills: [...(form.skills || []), newSkill.trim()] });
      setNewSkill("");
    }
  };
  const removeSkill = (idx: number) => {
    setForm({ ...form, skills: form.skills.filter((_: string, i: number) => i !== idx) });
  };

  // Interests
  const addInterest = () => {
    if (newInterest.trim()) {
      setForm({ ...form, interests: [...(form.interests || []), newInterest.trim()] });
      setNewInterest("");
    }
  };
  const removeInterest = (idx: number) => {
    setForm({ ...form, interests: form.interests.filter((_: string, i: number) => i !== idx) });
  };

  // Education
  const addEducation = () => {
    if (newEducation.place && newEducation.degree && newEducation.year) {
      setForm({ ...form, education: [...(form.education || []), newEducation] });
      setNewEducation({ place: "", degree: "", year: "" });
    }
  };
  const removeEducation = (idx: number) => {
    setForm({ ...form, education: form.education.filter((_: any, i: number) => i !== idx) });
  };

  // Experience
  const addExperience = () => {
    if (newExperience.place && newExperience.role && newExperience.year) {
      setForm({ ...form, experience: [...(form.experience || []), newExperience] });
      setNewExperience({ place: "", role: "", year: "" });
    }
  };
  const removeExperience = (idx: number) => {
    setForm({ ...form, experience: form.experience.filter((_: any, i: number) => i !== idx) });
  };

  // Certificates
  const addCertificate = () => {
    if (newCertificate.name && newCertificate.org && newCertificate.year) {
      setForm({ ...form, certificates: [...(form.certificates || []), newCertificate] });
      setNewCertificate({ name: "", org: "", year: "" });
    }
  };
  const removeCertificate = (idx: number) => {
    setForm({ ...form, certificates: form.certificates.filter((_: any, i: number) => i !== idx) });
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), form, { merge: true });
    setUserData(form);
    setEditMode(false);
  };

  const handleCreateProfile = async () => {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), { ...defaultProfile, email: auth.currentUser.email });
        setUserData({ ...defaultProfile, email: auth.currentUser.email });
        setForm({ ...defaultProfile, email: auth.currentUser.email });
        setError(null);
        alert("Профиль создан вручную!");
      } catch (e) {
        setError('Ошибка при создании профиля: ' + (e as Error).message);
      }
    } else {
      setError('Пользователь не залогинен');
    }
  };

  // Загрузка аватара/баннера
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `${type}s/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev: any) => ({ ...prev, [`${type}Url`]: url }));
      await setDoc(doc(db, "users", auth.currentUser.uid), { [`${type}Url`]: url }, { merge: true });
      setUserData((prev: any) => ({ ...prev, [`${type}Url`]: url }));
      toast({ title: `Фото ${type === "avatar" ? "аватара" : "баннера"} обновлено!` });
    } catch (e) {
      toast({ title: `Ошибка загрузки файла: ${(e as Error).message}` });
    }
    setUploading(false);
  };

  if (loading) return <div>Загрузка...</div>;
  if ((!userData && !editMode) || error) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white rounded-xl shadow p-8">
        <div className="text-red-600 font-bold mb-4">{error || 'Профиль не найден'}</div>
        <button
          onClick={handleCreateProfile}
          className="px-6 py-2 rounded-full bg-[#A166FF] text-white font-semibold"
        >
          Создать профиль вручную
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 mt-8">
        <div className="flex flex-col items-center mb-6">
          {/* Аватар */}
          <Avatar src={form.avatarUrl} name={form.name} email={form.email} size={96} className="mb-2" />
          {/* Кнопка Настройки */}
          <button
            className="mt-2 px-4 py-2 rounded bg-[#F3EDFF] text-[#A166FF] font-semibold hover:bg-[#EAD7FF] transition"
            onClick={() => navigate('/settings')}
          >
            Настройки
          </button>
        </div>
        {/* Список друзей */}
        <div className="mb-6">
          <div className="font-semibold text-lg mb-2 text-[#A166FF]">Друзья</div>
          {friends.length === 0 ? (
            <div className="text-gray-400">Нет друзей</div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {friends.map(friend => (
                <div key={friend.id} className="flex items-center gap-3 bg-[#F3EDFF] rounded-xl px-4 py-2">
                  <Avatar src={friend.avatarUrl} name={friend.name} email={friend.email} size={40} />
                  <div>
                    <div className="font-medium text-[#1E0E62]">{friend.name || 'Пользователь'}</div>
                    <div className="text-xs text-gray-500">{friend.email}</div>
                  </div>
                  <button
                    className="ml-2 px-3 py-1 rounded bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200"
                    onClick={async () => {
                      // Удалить друга у себя
                      const newFriends = { ...userData.friends };
                      delete newFriends[friend.id];
                      await updateDoc(doc(db, 'users', auth.currentUser.uid), { friends: newFriends });
                      setUserData((prev: any) => ({ ...prev, friends: newFriends }));
                    }}
                  >Удалить</button>
                  <button
                    className="ml-2 px-3 py-1 rounded bg-[#A166FF] text-white text-xs font-semibold hover:bg-[#8A4FD8]"
                    onClick={() => {
                      // Перейти в чат с этим пользователем
                      const chatId = [auth.currentUser.uid, friend.id].sort().join('_');
                      navigate(`/chat?chatId=${chatId}`);
                    }}
                  >Открыть чат</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {showEdit ? (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#232336] rounded-2xl p-8 w-full max-w-lg shadow-lg relative">
              <button
                className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-[#A166FF]"
                onClick={() => setShowEdit(false)}
              >×</button>
              <ProfileEditForm
                initial={form}
                onSave={(data) => { setForm(data); setUserData(data); setShowEdit(false); }}
                onCancel={() => setShowEdit(false)}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold mb-2">{form.name}</div>
            <div className="text-[#A166FF] font-medium mb-2">{form.status}</div>
            <div className="mb-4">{form.about || "О себе..."}</div>
            <button
              className="px-6 py-2 rounded bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition"
              onClick={() => setShowEdit(true)}
            >
              Редактировать
            </button>
          </>
        )}
        {/* ...остальной профиль... */}
      </div>
    </div>
  );
} 