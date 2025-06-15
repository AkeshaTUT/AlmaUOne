import { useEffect, useState, useRef } from 'react';
import { onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface IncomingCall {
  id: string;
  roomId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  status: 'ringing' | 'accepted' | 'declined';
  createdAt: any;
}

export function useIncomingCall() {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('[useIncomingCall] Пользователь не авторизован');
      return;
    }

    console.log('[useIncomingCall] Инициализация для пользователя:', auth.currentUser.uid);
    ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
    ringtoneRef.current.loop = true;

    const unsub = onSnapshot(doc(db, 'incomingCalls', auth.currentUser.uid), (snap) => {
      console.log('[useIncomingCall] onSnapshot', {
        exists: snap.exists(),
        data: snap.data(),
        userId: auth.currentUser?.uid
      });

      if (!snap.exists()) {
        console.log('[useIncomingCall] Нет входящего звонка');
        setIncomingCall(null);
        ringtoneRef.current?.pause();
        if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
        return;
      }

      const data = snap.data();
      console.log('[useIncomingCall] Статус звонка:', data.status);

      if (data.status === 'ringing' || data.status === 'accepted') {
        setIncomingCall({ id: snap.id, ...data } as IncomingCall);
        
        if (data.status === 'ringing') {
          console.log('[useIncomingCall] Воспроизводим звонок');
          ringtoneRef.current?.play().catch(err => {
            console.error('[useIncomingCall] Ошибка воспроизведения звонка:', err);
          });

          // Показываем уведомление, если окно не в фокусе
          if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
            new Notification('Входящий звонок', {
              body: `${data.callerName} звонит вам`,
              icon: data.callerAvatar || '/favicon.ico'
            });
          }
        }
      } else {
        console.log('[useIncomingCall] Звонок завершен или отклонен');
        setIncomingCall(null);
        ringtoneRef.current?.pause();
        if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
      }
    });

    return () => {
      console.log('[useIncomingCall] Отписка от входящих звонков');
      unsub();
      ringtoneRef.current?.pause();
      if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
    };
  }, [auth.currentUser]);

  const acceptCall = async () => {
    if (!incomingCall || !auth.currentUser) {
      console.log('[useIncomingCall] Невозможно принять звонок:', { incomingCall, userId: auth.currentUser?.uid });
      return;
    }

    console.log('[useIncomingCall] Принимаем звонок:', incomingCall);
    try {
      ringtoneRef.current?.pause();
      if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
    } catch (err) {}

    try {
      await updateDoc(doc(db, 'incomingCalls', auth.currentUser.uid), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      console.log('[useIncomingCall] Звонок принят');
    } catch (err) {
      console.error('[useIncomingCall] Ошибка при принятии звонка:', err);
    }
  };

  const declineCall = async () => {
    if (!incomingCall || !auth.currentUser) {
      console.log('[useIncomingCall] Невозможно отклонить звонок:', { incomingCall, userId: auth.currentUser?.uid });
      return;
    }

    console.log('[useIncomingCall] Отклоняем звонок:', incomingCall);
    ringtoneRef.current?.pause();
    if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;

    try {
      await updateDoc(doc(db, 'incomingCalls', auth.currentUser.uid), {
        status: 'declined',
        declinedAt: serverTimestamp()
      });
      console.log('[useIncomingCall] Звонок отклонён');

      setTimeout(() => {
        deleteDoc(doc(db, 'incomingCalls', auth.currentUser.uid)).catch(err => {
          console.error('[useIncomingCall] Ошибка при удалении документа звонка:', err);
        });
      }, 1000);
    } catch (err) {
      console.error('[useIncomingCall] Ошибка при отклонении звонка:', err);
    }
  };

  return { incomingCall, acceptCall, declineCall };
} 