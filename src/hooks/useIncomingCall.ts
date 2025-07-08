import { useEffect, useState, useRef, useCallback } from 'react';
import { onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Call } from '@/types/call';

export const useIncomingCall = () => {
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) return;

    console.log('[useIncomingCall] Инициализация для пользователя:', currentUser.uid);

    // Создаем элемент audio для звонка
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
      ringtoneRef.current.loop = true;
    }

    // Добавляем обработчик взаимодействия пользователя
    const handleUserInteraction = () => {
      hasInteractedRef.current = true;
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    const unsubscribe = onSnapshot(
      doc(db, 'calls', currentUser.uid),
      (doc) => {
        console.log('[useIncomingCall] onSnapshot', doc.data());
        const callData = doc.data() as Call;
        
        if (callData) {
          console.log('[useIncomingCall] Статус звонка:', callData.status);
          
          if (callData.status === 'pending') {
            setIncomingCall(callData);
            playCallSound();
          } else {
            setIncomingCall(null);
            stopCallSound();
          }
        } else {
          setIncomingCall(null);
          stopCallSound();
        }
      },
      (error) => {
        console.error('[useIncomingCall] Firestore Listen error:', error);
      }
    );

    return () => {
      unsubscribe();
      stopCallSound();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const playCallSound = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.currentTime = 0;
      const playPromise = ringtoneRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('[useIncomingCall] Ошибка воспроизведения звонка:', error);
          if (error.name === 'NotAllowedError') {
            // Если пользователь еще не взаимодействовал с документом,
            // пробуем воспроизвести звук при следующем взаимодействии
            const handleInteraction = () => {
              if (incomingCall) {
                playCallSound();
              }
              document.removeEventListener('click', handleInteraction);
              document.removeEventListener('touchstart', handleInteraction);
            };
            document.addEventListener('click', handleInteraction);
            document.addEventListener('touchstart', handleInteraction);
          }
        });
      }
    }
  }, [incomingCall]);

  const stopCallSound = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, []);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      await updateDoc(doc(db, 'calls', incomingCall.calleeId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });
      stopCallSound();
    } catch (error) {
      console.error('[useIncomingCall] Ошибка при принятии звонка:', error);
    }
  }, [incomingCall, stopCallSound]);

  const declineCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      await updateDoc(doc(db, 'calls', incomingCall.calleeId), {
        status: 'declined',
        declinedAt: serverTimestamp()
      });
      stopCallSound();
    } catch (error) {
      console.error('[useIncomingCall] Ошибка при отклонении звонка:', error);
    }
  }, [incomingCall, stopCallSound]);

  return { incomingCall, acceptCall, declineCall };
}; 