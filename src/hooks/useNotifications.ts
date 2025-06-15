import { useEffect, useState } from 'react';

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

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico', // Путь к иконке
        badge: '/favicon.ico',
        vibrate: [200, 100, 200], // Вибрация для мобильных устройств
        requireInteraction: true, // Уведомление не исчезнет само
        ...options
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            ...options
          });
        }
      });
    }
  };

  return { permission, showNotification };
} 