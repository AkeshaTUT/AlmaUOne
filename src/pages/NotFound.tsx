import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import BackButton from "@/components/BackButton";
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Home, 
  ArrowLeft 
} from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] p-2 sm:p-8 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton className="mb-2 sm:mb-4" />
      <motion.div 
        className="text-center bg-white dark:bg-[#232336] rounded-lg sm:rounded-2xl p-3 sm:p-8 shadow-md sm:shadow-lg w-full max-w-xs sm:max-w-md"
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
          className="mb-4 sm:mb-6"
        >
          <AlertTriangle className="w-16 h-16 sm:w-24 sm:h-24 text-[#A166FF] mx-auto" />
        </motion.div>
        
        <motion.h1 
          className="text-4xl sm:text-6xl font-bold mb-2 sm:mb-4 text-[#1E0E62] dark:text-white"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          404
        </motion.h1>
        
        <motion.p 
          className="text-base sm:text-xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Oops! Страница не найдена
        </motion.p>
        
        <motion.a 
          href="/" 
          className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 rounded-md sm:rounded-lg bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 text-base"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Home className="w-5 h-5" />
          Вернуться на главную
        </motion.a>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;
