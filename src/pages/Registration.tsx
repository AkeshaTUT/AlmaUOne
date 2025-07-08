import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserCheck, LogIn } from 'lucide-react';

const Registration = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    try {
      setLoading(true);
      await register(formData.email, formData.password, formData.name);
      toast.success('Регистрация успешна!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] flex items-center justify-center p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="bg-white rounded-lg sm:rounded-2xl p-3 sm:p-8 w-full max-w-xs sm:max-w-md shadow-md sm:shadow-xl"
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.h1 
          className="text-2xl sm:text-3xl font-bold text-center text-[#1E0E62] mb-4 sm:mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Регистрация
        </motion.h1>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Имя</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 sm:pr-4 py-2 rounded-md sm:rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                required
                placeholder="Введите ваше имя"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 sm:pr-4 py-2 rounded-md sm:rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                required
                placeholder="Введите ваш email"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 sm:pr-4 py-2 rounded-md sm:rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                required
                placeholder="Введите пароль"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-3 sm:pr-4 py-2 rounded-md sm:rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] transition-all duration-200 text-sm sm:text-base"
                required
                placeholder="Подтвердите пароль"
              />
            </div>
          </motion.div>
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full px-4 sm:px-6 py-3 rounded-md sm:rounded-lg bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <UserCheck className="w-5 h-5" />
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </motion.button>
        </form>
        <motion.p 
          className="mt-3 sm:mt-4 text-center text-gray-600 text-xs sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          Уже есть аккаунт?{' '}
          <motion.button
            onClick={() => navigate('/login')}
            className="text-[#A166FF] hover:underline flex items-center gap-1 mx-auto mt-2 text-xs sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogIn className="w-4 h-4" />
            Войти
          </motion.button>
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default Registration;
