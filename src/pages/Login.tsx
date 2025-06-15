import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
    <div className="min-h-screen bg-[#F8F6FB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
        <h1 className="text-3xl font-bold text-center text-[#1E0E62] mb-6">Вход</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF]"
              required
              placeholder="Введите ваш email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF]"
              required
              placeholder="Введите ваш пароль"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-2 rounded-full bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Нет аккаунта?{' '}
          <button
            onClick={() => navigate('/registration')}
            className="text-[#A166FF] hover:underline"
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
