import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Проверяем поддержку уведомлений
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Получаем текущий статус разрешений
    setPermission(Notification.permission);

    // Если разрешение не запрошено, запрашиваем его
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setPermission(permission);
      });
    }
  }, []);

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return;
    const userId = (window as any).auth?.currentUser?.uid || null;
    // Сохраняем уведомление в Firestore
    if (userId) {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        options,
        timestamp: serverTimestamp(),
        isRead: false
      });
    }
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: true,
            ...options
          });
        }
      });
    }
  };

  return { permission, showNotification };
} 