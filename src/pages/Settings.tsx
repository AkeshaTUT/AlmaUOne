import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import BackButton from '@/components/BackButton';
import Avatar from '@/components/Avatar';

const SettingsPage: React.FC = () => {
  const user = auth.currentUser;
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    university: '',
    faculty: '',
    year: '',
    phone: '',
    about: '',
    avatarUrl: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          setProfile({ ...profile, ...snap.data(), email: user.email || '' });
        } else {
          setProfile({
            name: user.displayName || '',
            email: user.email || '',
            university: '',
            faculty: '',
            year: '',
            phone: '',
            about: '',
            avatarUrl: user.photoURL || '',
          });
        }
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profile,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      });
      await updateProfile(user, {
        displayName: profile.name,
        photoURL: profile.avatarUrl,
      });
      setEditMode(false);
      setMessage('Профиль успешно обновлен');
    } catch (e) {
      setError('Ошибка при сохранении профиля');
    }
    setLoading(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSave = async () => {
    if (!user) return;
    if (passwords.new !== passwords.confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (passwords.new.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    try {
      await updatePassword(user, passwords.new);
      setMessage('Пароль успешно изменен');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (e) {
      setError('Ошибка при смене пароля');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // TODO: реализовать загрузку аватарки в Storage и обновление avatarUrl

  return (
    <div className="min-h-screen bg-[#F8F6FB] p-8">
      <BackButton className="mb-4" />
      <div className="max-w-3xl mx-auto bg-white dark:bg-[#232336] rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-[#1E0E62] dark:text-white mb-8">Настройки</h1>
        {message && <div className="mb-4 text-green-600">{message}</div>}
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <div className="flex flex-col items-center mb-8">
          <Avatar src={avatarPreview || profile.avatarUrl} name={profile.name} email={profile.email} size={80} />
          <label className="mt-2 cursor-pointer text-[#A166FF] hover:underline">
            Сменить аватар
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">Имя</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
              disabled={!editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] bg-gray-100 dark:bg-[#181826] dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Университет</label>
            <input
              type="text"
              name="university"
              value={profile.university}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
              disabled={!editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Факультет</label>
            <input
              type="text"
              name="faculty"
              value={profile.faculty}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
              disabled={!editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Курс</label>
            <input
              type="text"
              name="year"
              value={profile.year}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
              disabled={!editMode}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Телефон</label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
              disabled={!editMode}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">О себе</label>
            <textarea
              name="about"
              value={profile.about}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
              rows={3}
              disabled={!editMode}
            />
          </div>
        </div>
        <div className="flex gap-4 mb-8">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition"
                disabled={loading}
              >
                Сохранить
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                disabled={loading}
              >
                Отмена
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-6 py-2 rounded bg-[#F3EDFF] text-[#A166FF] font-semibold hover:bg-[#EAD7FF] transition"
            >
              Редактировать
            </button>
          )}
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-[#1E0E62] dark:text-white">Смена пароля</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              name="new"
              placeholder="Новый пароль"
              value={passwords.new}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirm"
              placeholder="Повторите пароль"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white"
            />
            <button
              onClick={() => setShowPassword(v => !v)}
              className="px-4 py-2 rounded bg-[#F3EDFF] text-[#A166FF] font-semibold hover:bg-[#EAD7FF] transition"
            >
              {showPassword ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          <button
            onClick={handlePasswordSave}
            className="px-6 py-2 rounded bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition"
          >
            Сменить пароль
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
