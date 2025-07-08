import React, { useEffect, useRef, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import callIcon from "@/assets/call.png";
import addFriendIcon from "@/assets/add_friend.png";
import threeDotIcon from "@/assets/3dot.png";
import emojiIcon from "@/assets/emoji.png";
import microphoneIcon from "@/assets/microphone.png";
import sendMessageIcon from "@/assets/send_message.png";
import Sidebar from "@/components/Sidebar";
import { CallModal } from "./CallModal";
import BackButton from "@/components/BackButton";
import EmojiPicker from "emoji-picker-react";
import { Theme } from "emoji-picker-react";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import searchIcon from "@/assets/search.png";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  UserPlus, 
  MoreVertical, 
  Search, 
  Smile, 
  Mic, 
  Send, 
  MessageCircle,
  Blocks,
  Flag,
  Trash2,
  X
} from 'lucide-react';

function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
    "audio/wav",
    "audio/mpeg"
  ];
  for (const type of types) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export default function Chat() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [callOpen, setCallOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const storage = getStorage();
  const { incomingCall } = useIncomingCall();
  const { showNotification } = useNotifications();

  // Filter chats and contacts based on search query
  const filteredChats = chats.filter(chat => {
    const otherId = chat.members.find((id: string) => id !== user?.uid);
    const contact = contacts.find(c => c.id === otherId);
    return contact?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Найти пользователя по поиску, если чата с ним нет
  const foundUser = searchQuery
    ? contacts.find(
        c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !chats.some(chat => chat.members.includes(c.id))
      )
    : null;

  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Получаем список всех пользователей (контактов)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, snap => {
      setContacts(snap.docs.filter(d => d.id !== user.uid).map(d => ({ id: d.id, ...d.data() })));
    }, error => {
      console.error("Firestore Listen error (users):", error);
    });
    return () => unsub();
  }, [user]);

  // Получаем список чатов пользователя
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, snap => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => {
      console.error("Firestore Listen error (chats):", error);
    });
    return () => unsub();
  }, [user]);

  // Получаем сообщения выбранного чата
  useEffect(() => {
    if (!selectedChat || !selectedChat.id) return setMessages([]);
    const q = query(collection(db, "chats", selectedChat.id, "messages"), orderBy("createdAt"));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => {
      console.error("Firestore Listen error (messages):", error);
    });
    return () => unsub();
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Начать чат с контактом
  const startChat = async (contact: any) => {
    if (!user) return;
    const chatId = getChatId(user.uid, contact.id);
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        members: [user.uid, contact.id],
        lastMessage: "",
        updatedAt: serverTimestamp(),
      });
    }
    setSelectedChat({ id: chatId, ...chatSnap.data(), contact });
  };

  // Отправить сообщение
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat || !user) return;
    const msg = {
      text: input,
      senderId: user.uid,
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, "chats", selectedChat.id, "messages"), msg);
    await updateDoc(doc(db, "chats", selectedChat.id), {
      lastMessage: input,
      updatedAt: serverTimestamp(),
    });
    setInput("");
  };

  // Добавить в друзья
  const handleAddFriend = async () => {
    if (!user || !selectedChat?.contact) return;
    try {
      // Получить имя текущего пользователя
      let userName = user.displayName;
      if (!userName) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        userName = userSnap.exists() ? userSnap.data().name : user.email;
      }
      // Добавить в друзья текущему пользователю
      await setDoc(doc(db, "users", user.uid), {
        friends: { [selectedChat.contact.id]: true }
      }, { merge: true });
      // Добавить в друзья выбранному пользователю
      await setDoc(doc(db, "users", selectedChat.contact.id), {
        friends: { [user.uid]: true }
      }, { merge: true });
      // Создать уведомление для выбранного пользователя
      await addDoc(collection(db, "notifications"), {
        userId: selectedChat.contact.id,
        title: `Вас добавил в друзья: ${userName}`,
        fromUserId: user.uid,
        fromUserName: userName,
        type: 'friend_request',
        timestamp: serverTimestamp(),
        isRead: false
      });
      showNotification("Пользователь добавлен в друзья!");
    } catch (e) {
      alert("Ошибка при добавлении в друзья");
    }
  };

  // Заблокировать пользователя
  const handleBlock = async () => {
    if (!user || !selectedChat?.contact) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        blocked: { [selectedChat.contact.id]: true }
      }, { merge: true });
      alert("Пользователь заблокирован!");
    } catch (e) {
      alert("Ошибка при блокировке пользователя");
    }
  };

  // Пожаловаться
  const handleReport = async () => {
    if (!user || !selectedChat?.contact) return;
    try {
      await addDoc(collection(db, "reports"), {
        from: user.uid,
        to: selectedChat.contact.id,
        createdAt: new Date().toISOString(),
        reason: "Пользователь пожаловался из чата"
      });
      alert("Жалоба отправлена!");
    } catch (e) {
      alert("Ошибка при отправке жалобы");
    }
  };

  // Удалить чат
  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    try {
      // 1. Удаляем все сообщения в чате
      const messagesRef = collection(db, "chats", selectedChat.id, "messages");
      const messagesSnap = await getDocs(messagesRef);
      const deletePromises = messagesSnap.docs.map((msg) => deleteDoc(msg.ref));
      await Promise.all(deletePromises);
      // 2. Удаляем сам чат
      await deleteDoc(doc(db, "chats", selectedChat.id));
      setSelectedChat(null);
      alert("Чат и все сообщения удалены!");
    } catch (e) {
      alert("Ошибка при удалении чата");
    }
  };

  // Меню действий
  const handleMenu = (action: string) => {
    setMenuOpen(false);
    if (action === "block") handleBlock();
    if (action === "report") handleReport();
    if (action === "delete") handleDeleteChat();
  };

  // Emoji picker
  const handleEmojiSelect = (emoji: any) => {
    setInput((msg) => msg + emoji.emoji);
    setShowEmoji(false);
  };

  // Голосовые сообщения
  const handleMicClick = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = getSupportedMimeType();
        if (!mimeType) {
          alert("Ваш браузер не поддерживает запись аудио");
          return;
        }
        const recorder = new MediaRecorder(stream, { mimeType });
        let localChunks: Blob[] = [];
        recorder.ondataavailable = (e) => localChunks.push(e.data);
        recorder.onstop = async () => {
          const ext = mimeType.split('/')[1]?.split(';')[0] || 'webm';
          const audioBlob = new Blob(localChunks, { type: mimeType });
          if (audioBlob.size < 1000) {
            alert("Ошибка записи: аудиофайл пустой или слишком короткий");
            setIsRecording(false);
            return;
          }
          // Загрузка в Firebase Storage
          const fileRef = storageRef(storage, `voice_messages/${Date.now()}_${user?.uid}.${ext}`);
          await uploadBytes(fileRef, audioBlob);
          const audioUrl = await getDownloadURL(fileRef);
          // Отправка сообщения с audioUrl
          if (selectedChat && user) {
            await addDoc(collection(db, "chats", selectedChat.id, "messages"), {
              audioUrl,
              senderId: user.uid,
              createdAt: new Date().toISOString(),
            });
            await updateDoc(doc(db, "chats", selectedChat.id), {
              lastMessage: "[Голосовое сообщение]",
              updatedAt: serverTimestamp(),
            });
          }
          setIsRecording(false);
        };
        setAudioChunks([]); // для совместимости, но используем localChunks
        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);
      } catch (e) {
        alert("Не удалось получить доступ к микрофону");
      }
    } else {
      mediaRecorder?.stop();
    }
  };

  // Обновляем функцию handleCall
  const handleCall = async () => {
    if (!selectedChat?.contact || !user) return;
    const calleeUid = selectedChat.contact.id;
    console.log('[handleCall] Звоню пользователю (calleeUid):', calleeUid);
    try {
      await deleteDoc(doc(db, "incomingCalls", calleeUid));
      await setDoc(doc(db, "incomingCalls", calleeUid), {
        roomId: selectedChat.id,
        callerId: user.uid,
        callerName: user.displayName || "Пользователь",
        callerAvatar: user.photoURL || "",
        status: "ringing",
        createdAt: serverTimestamp()
      });
      console.log('[handleCall] Документ звонка успешно создан для:', calleeUid);
      setCallOpen(true);
      console.log('[handleCall] CallModal открыт для caller');
    } catch (error) {
      console.error('[handleCall] Error initiating call:', error);
      alert("Не удалось инициировать звонок");
    }
  };

  useEffect(() => {
    if (!user || !selectedChat) return;
    console.log('[useEffect] Подписка на входящий звонок для:', user.uid);
    
    if (incomingCall) {
      console.log('[useEffect] Входящий звонок:', incomingCall);
      if (incomingCall.status === "accepted") {
        setCallOpen(true);
        console.log('[useEffect] CallModal открыт для callee');
      } else if (incomingCall.status === "declined") {
        setCallOpen(false);
        console.log('[useEffect] Звонок отклонён');
      }
    } else {
      console.log('[useEffect] Нет входящего звонка');
    }
  }, [user, selectedChat, incomingCall]);

  return (
    <motion.div 
      className="min-h-screen bg-[#F8F6FB] flex flex-col md:flex-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Левая колонка: список чатов */}
      <motion.div 
        className="hidden md:flex flex-col w-[320px] border-r border-[#EAD7FF] bg-white/80 h-screen overflow-y-auto shadow-lg z-10"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <motion.div 
          className="p-6 font-bold text-2xl text-[#A166FF] border-b border-[#EAD7FF]"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Чаты
        </motion.div>
        {/* Search input */}
        <motion.div 
          className="p-4 border-b border-[#EAD7FF]"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-lg border border-[#EAD7FF] focus:outline-none focus:ring-2 focus:ring-[#A166FF] bg-white transition-all duration-200"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </motion.div>
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {filteredChats.map((chat, index) => {
              const otherId = chat.members.find((id: string) => id !== user?.uid);
              const contact = contacts.find(c => c.id === otherId);
              return (
                <motion.div
                  key={chat.id}
                  className={`flex items-center gap-3 px-5 py-4 cursor-pointer rounded-xl transition-all duration-150 mb-1 ${selectedChat?.id === chat.id ? "bg-[#EAD7FF] shadow-md" : "hover:bg-[#F3EDFF]"}`}
                  onClick={() => setSelectedChat({ ...chat, contact })}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="w-12 h-12 rounded-full bg-[#EAD7FF] flex items-center justify-center text-xl font-bold text-[#A166FF] overflow-hidden">
                    {contact?.avatarUrl ? <img src={contact.avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover" /> : (contact?.name?.[0] || "?")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#1E0E62] truncate">{contact?.name || "Пользователь"}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[140px]">{chat.lastMessage}</div>
                  </div>
                  <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">{chat.updatedAt && formatTime(chat.updatedAt.toDate ? chat.updatedAt.toDate() : chat.updatedAt)}</div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {/* Если нет чатов, но найден пользователь по поиску — показать кнопку создания чата */}
          {filteredChats.length === 0 && foundUser && (
            <motion.div 
              className="flex flex-col items-center justify-center py-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <span className="w-16 h-16 rounded-full bg-[#EAD7FF] flex items-center justify-center text-2xl font-bold text-[#A166FF] mb-4 overflow-hidden">
                {foundUser.avatarUrl ? <img src={foundUser.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover" /> : (foundUser.name?.[0] || "?")}
              </span>
              <div className="font-semibold text-lg text-[#1E0E62] mb-2">{foundUser.name}</div>
              <motion.button
                className="px-6 py-2 rounded-lg bg-[#A166FF] text-white font-semibold hover:bg-[#8A4FD8] transition-colors duration-200 flex items-center gap-2"
                onClick={() => startChat(foundUser)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-4 h-4" />
                Начать чат
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
      {/* Правая часть: полноэкранный чат */}
      <motion.div 
        className="flex-1 flex flex-col h-[100dvh] md:h-screen relative bg-[#F8F6FB]"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* TopBar чата */}
        <AnimatePresence>
          {selectedChat && (
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-8 py-3 sm:py-6 border-b border-[#EAD7FF] bg-white/80 sticky top-0 z-10 gap-2 sm:gap-0"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#EAD7FF] flex items-center justify-center text-lg sm:text-xl font-bold text-[#A166FF] overflow-hidden">
                  {selectedChat.contact?.avatarUrl ? <img src={selectedChat.contact.avatarUrl} alt="avatar" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" /> : (selectedChat.contact?.name?.[0] || "?")}
                </span>
                <span className="font-semibold text-base sm:text-lg md:text-xl">{selectedChat.contact?.name || "Пользователь"}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-6 relative">
                <motion.button 
                  onClick={handleCall} 
                  title="Позвонить"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-[#F3EDFF] transition-colors duration-200"
                >
                  <Phone className="w-6 h-6 text-[#A166FF]" />
                </motion.button>
                <motion.button 
                  onClick={handleAddFriend} 
                  title="Добавить в друзья"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-[#F3EDFF] transition-colors duration-200"
                >
                  <UserPlus className="w-6 h-6 text-[#A166FF]" />
                </motion.button>
                <motion.button 
                  onClick={() => setMenuOpen(v => !v)} 
                  title="Меню"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-[#F3EDFF] transition-colors duration-200"
                >
                  <MoreVertical className="w-6 h-6 text-[#A166FF]" />
                </motion.button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div 
                      className="absolute right-0 top-10 bg-white border border-[#EAD7FF] rounded-xl shadow-lg z-10 min-w-[160px]"
                      initial={{ y: -10, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -10, opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.button 
                        className="block w-full text-left px-4 py-2 hover:bg-[#F3EDFF] flex items-center gap-2 transition-colors duration-200" 
                        onClick={() => handleMenu("block")}
                        whileHover={{ x: 5 }}
                      >
                        <Blocks className="w-4 h-4" />
                        Заблокировать
                      </motion.button>
                      <motion.button 
                        className="block w-full text-left px-4 py-2 hover:bg-[#F3EDFF] flex items-center gap-2 transition-colors duration-200" 
                        onClick={() => handleMenu("report")}
                        whileHover={{ x: 5 }}
                      >
                        <Flag className="w-4 h-4" />
                        Пожаловаться
                      </motion.button>
                      <motion.button 
                        className="block w-full text-left px-4 py-2 hover:bg-[#F3EDFF] flex items-center gap-2 transition-colors duration-200" 
                        onClick={() => handleMenu("delete")}
                        whileHover={{ x: 5 }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить чат
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Сообщения */}
        <div className="flex-1 px-1 sm:px-4 md:px-16 py-2 sm:py-6 overflow-y-auto bg-transparent flex flex-col gap-2" style={{ minHeight: 0 }}>
          <AnimatePresence>
            {selectedChat ? messages.map((msg, index) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <motion.div
                  key={msg.id}
                  className={`flex items-end ${isMe ? "justify-end" : "justify-start"}`}
                  initial={{ y: 20, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {!isMe && (
                    <span className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#EAD7FF] flex items-center justify-center text-base sm:text-lg font-bold text-[#A166FF] mr-1 sm:mr-2">
                      {selectedChat.contact?.avatarUrl ? <img src={selectedChat.contact.avatarUrl} alt="avatar" className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover" /> : (selectedChat.contact?.name?.[0] || "?")}
                    </span>
                  )}
                  <motion.div 
                    className={`max-w-[90vw] sm:max-w-[70vw] md:max-w-[40vw] px-3 sm:px-5 py-2 sm:py-3 rounded-2xl shadow text-sm sm:text-base whitespace-pre-line transition-all duration-200 ${isMe ? "bg-[#A166FF] text-white rounded-br-md" : "bg-[#F3EDFF] text-[#1E0E62] rounded-bl-md"}`}
                    whileHover={{ scale: 1.02 }}
                  >
                    {msg.audioUrl ? (
                      <div className="flex flex-col items-start w-full">
                        <span className="text-xs text-[#A166FF] mb-1">Голосовое сообщение</span>
                        <audio controls src={msg.audioUrl} style={{ width: '220px', minWidth: 120, margin: '0.25rem 0' }} preload="auto" />
                      </div>
                    ) : (
                      msg.text
                    )}
                    <div className="text-xs text-gray-400 mt-1 text-right">{formatTime(msg.createdAt)}</div>
                  </motion.div>
                  {isMe && (
                    <span className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#A166FF] flex items-center justify-center text-base sm:text-lg font-bold text-white ml-1 sm:ml-2">
                      {user.photoURL ? <img src={user.photoURL} alt="avatar" className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover" /> : (user.displayName?.[0] || "Я")}
                    </span>
                  )}
                </motion.div>
              );
            }) : (
              <motion.div 
                className="text-gray-400 text-center mt-12 sm:mt-24 text-base sm:text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Выберите чат или контакт для начала общения
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <AnimatePresence>
          {selectedChat && (
            <motion.form
              onSubmit={handleSend}
              className="px-1 sm:px-4 md:px-16 py-2 sm:py-6 border-t border-[#EAD7FF] bg-white/80 sticky bottom-0"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-1 sm:gap-3 bg-white rounded-xl border border-[#EAD7FF] px-2 sm:px-4 py-1 sm:py-2 shadow relative">
                <motion.button 
                  type="button" 
                  className="focus:outline-none p-1 rounded-lg hover:bg-[#F3EDFF] transition-colors duration-200" 
                  onClick={() => setShowEmoji((v) => !v)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Smile className="w-6 h-6 text-[#A166FF]" />
                </motion.button>
                <AnimatePresence>
                  {showEmoji && (
                    <motion.div 
                      className="absolute bottom-14 left-0 z-50"
                      initial={{ y: 10, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 10, opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <EmojiPicker onEmojiClick={handleEmojiSelect} theme={Theme.LIGHT} height={350} width={300} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <input
                  className="flex-1 outline-none bg-transparent text-base"
                  placeholder="Type message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{ fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif" }}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                />
                <motion.button 
                  type="button" 
                  className="focus:outline-none p-1 rounded-lg hover:bg-[#F3EDFF] transition-colors duration-200" 
                  onClick={handleMicClick}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Mic className="w-6 h-6 text-[#A166FF]" />
                  {isRecording && <span className="ml-1 text-xs text-[#A166FF] animate-pulse">●</span>}
                </motion.button>
                <motion.button 
                  type="submit" 
                  className="focus:outline-none p-1 rounded-lg hover:bg-[#F3EDFF] transition-colors duration-200" 
                  disabled={!input.trim()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Send className="w-6 h-6 text-[#A166FF]" />
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {callOpen && selectedChat && (
          <CallModal
            callConfig={{
              roomId: incomingCall?.roomId || getChatId(user.uid, selectedChat.contact.id),
              isCaller: !incomingCall || (incomingCall.callerId !== user.uid),
              contact: selectedChat.contact,
              currentUser: auth.currentUser,
              onCallEnd: () => { setCallOpen(false); console.log('[CallModal] Закрыт'); }
            }}
            onClose={() => { setCallOpen(false); console.log('[CallModal] Закрыт'); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
} 