import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Сохраняем токен в localStorage
        const token = await user.getIdToken();
        localStorage.setItem('userToken', token);
      } else {
        localStorage.removeItem('userToken');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Создаем документ пользователя в Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name,
        createdAt: new Date().toISOString(),
      });

      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userToken');
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const getUserData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return {
    user,
    loading,
    register,
    login,
    logout,
    getUserData
  };
}; 