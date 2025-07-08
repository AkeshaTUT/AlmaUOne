import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword } from 'firebase/auth';
import BackButton from '@/components/BackButton';
import Avatar from '@/components/Avatar';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Mail, 
  Building, 
  GraduationCap, 
  Phone, 
  Edit, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Lock,
  Camera
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

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
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] p-2 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <motion.div 
        className="max-w-full sm:max-w-3xl mx-auto bg-white dark:bg-[#232336] rounded-2xl shadow-lg p-2 sm:p-8"
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.h1 
          className="text-2xl sm:text-3xl font-bold text-[#1E0E62] dark:text-white mb-4 sm:mb-8 flex items-center gap-2 sm:gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Settings className="w-7 h-7 sm:w-8 sm:h-8 text-[#A166FF]" />
          Настройки
        </motion.h1>
        
        <AnimatePresence>
          {message && (
            <motion.div 
              className="mb-4 text-green-600 p-3 bg-green-50 rounded-lg"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
            >
              {message}
            </motion.div>
          )}
          {error && (
            <motion.div 
              className="mb-4 text-red-600 p-3 bg-red-50 rounded-lg"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div 
          className="flex flex-col items-center mb-4 sm:mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Avatar src={avatarPreview || profile.avatarUrl} name={profile.name} email={profile.email} size={72} />
          <motion.label 
            className="mt-2 cursor-pointer text-[#A166FF] hover:underline flex items-center gap-2 text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Camera className="w-4 h-4" />
            Сменить аватар
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </motion.label>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-[#A166FF]" />
              Имя
            </label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200"
              disabled={!editMode}
            />
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#A166FF]" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] bg-gray-100 dark:bg-[#181826] dark:text-white"
            />
          </motion.div>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#A166FF]" />
              Университет
            </label>
            <input
              type="text"
              name="university"
              value={profile.university}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200"
              disabled={!editMode}
            />
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#A166FF]" />
              Факультет
            </label>
            <input
              type="text"
              name="faculty"
              value={profile.faculty}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200"
              disabled={!editMode}
            />
          </motion.div>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <label className="block text-sm font-medium mb-1">Курс</label>
            <input
              type="text"
              name="year"
              value={profile.year}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200"
              disabled={!editMode}
            />
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#A166FF]" />
              Телефон
            </label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200"
              disabled={!editMode}
            />
          </motion.div>
          <motion.div 
            className="md:col-span-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <label className="block text-sm font-medium mb-1">О себе</label>
            <textarea
              name="about"
              value={profile.about}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200"
              rows={3}
              disabled={!editMode}
            />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
        >
          {editMode ? (
            <>
              <motion.button
                onClick={handleSave}
                className="px-6 py-2 rounded-lg bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center gap-2"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Save className="w-4 h-4" />
                Сохранить
              </motion.button>
              <motion.button
                onClick={() => setEditMode(false)}
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors duration-200 flex items-center gap-2"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
                Отмена
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={() => setEditMode(true)}
              className="px-6 py-2 rounded-lg bg-[#F3EDFF] text-[#A166FF] font-semibold hover:bg-[#EAD7FF] transition-colors duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </motion.button>
          )}
        </motion.div>
        
        <motion.div 
          className="mb-4 sm:mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
        >
          <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-[#1E0E62] dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#A166FF]" />
            Смена пароля
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              name="new"
              placeholder="Новый пароль"
              value={passwords.new}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirm"
              placeholder="Повторите пароль"
              value={passwords.confirm}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 rounded-lg border border-[#EAD7FF] bg-white dark:bg-[#181826] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200"
            />
            <motion.button
              onClick={() => setShowPassword(v => !v)}
              className="px-4 py-2 rounded-lg bg-[#F3EDFF] text-[#A166FF] font-semibold hover:bg-[#EAD7FF] transition-colors duration-200 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPassword ? 'Скрыть' : 'Показать'}
            </motion.button>
          </div>
          <motion.button
            onClick={handlePasswordSave}
            className="px-6 py-2 rounded-lg bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Lock className="w-4 h-4" />
            Сменить пароль
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;
