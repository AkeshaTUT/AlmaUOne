import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Неверный email или пароль';
      case 'auth/too-many-requests':
        return 'Слишком много попыток входа. Попробуйте позже';
      case 'auth/user-disabled':
        return 'Аккаунт заблокирован';
      case 'auth/invalid-email':
        return 'Неверный формат email';
      default:
        return 'Произошла ошибка при входе. Попробуйте еще раз';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Пожалуйста, заполните все поля');
      return;
    }

    try {
      setLoading(true);
      await login(formData.email, formData.password);
      toast.success('Вход выполнен успешно!');
      navigate('/');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
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
          Вход
        </motion.h1>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
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
            transition={{ duration: 0.5, delay: 0.5 }}
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
                placeholder="Введите ваш пароль"
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
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Вход...' : 'Войти'}
          </motion.button>
        </form>
        <motion.p 
          className="mt-3 sm:mt-4 text-center text-gray-600 text-xs sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          Нет аккаунта?{' '}
          <motion.button
            onClick={() => navigate('/registration')}
            className="text-[#A166FF] hover:underline flex items-center gap-1 mx-auto mt-2 text-xs sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserPlus className="w-4 h-4" />
            Зарегистрироваться
          </motion.button>
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default Login;
