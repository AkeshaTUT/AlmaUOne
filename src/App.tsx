import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import CampusMap from "./pages/CampusMap";
import Tasks from "./pages/Tasks";
import Jobs from "./pages/Jobs";
import Schedule from "./pages/Schedule";
import Profile from "./pages/Profile";
import Courses from "./pages/Courses";
import ProtectedRoute from "./components/ProtectedRoute";
import NewsPage from "./pages/News";
import TopBar from "@/components/TopBar";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import MaterialsPage from "./pages/Materials";
import SettingsPage from "./pages/Settings";
import FAQPage from "./pages/FAQ";
import TestCall from "./pages/TestCall";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import IncomingCallModal from "@/components/IncomingCallModal";
import CallModal from "@/pages/CallModal";

const queryClient = new QueryClient();

type ActiveCall = { roomId: string; contact: any; isCaller: boolean };

function App() {
  const [profile, setProfile] = useState<{ avatarUrl?: string } | null>(null);
  const { incomingCall, acceptCall, declineCall } = useIncomingCall();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callerProfile, setCallerProfile] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Ждем инициализации auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('[App] Auth state changed:', user?.uid);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Диагностические логи
  useEffect(() => {
    if (!isAuthReady) {
      console.log('[App] Auth не инициализирован');
      return;
    }

    console.log('[App] currentUser:', auth.currentUser?.uid);
    console.log('[App] incomingCall:', incomingCall);
  }, [isAuthReady, auth.currentUser, incomingCall]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) {
        console.log('[App] Нет авторизованного пользователя для получения профиля');
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) {
          console.log('[App] Профиль получен:', snap.data());
          setProfile(snap.data() as any);
        } else {
          console.log('[App] Профиль не найден, используем данные из auth');
          setProfile({ avatarUrl: auth.currentUser.photoURL || "" });
        }
      } catch (err) {
        console.error('[App] Ошибка при получении профиля:', err);
      }
    };
    fetchProfile();
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchCallerProfile = async () => {
      if (!incomingCall?.callerId) {
        console.log('[App] Нет callerId для получения профиля звонящего');
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", incomingCall.callerId));
        if (snap.exists()) {
          console.log('[App] Профиль звонящего получен:', snap.data());
          setCallerProfile(snap.data());
        } else {
          console.log('[App] Профиль звонящего не найден');
          setCallerProfile(null);
        }
      } catch (err) {
        console.error('[App] Ошибка при получении профиля звонящего:', err);
      }
    };
    fetchCallerProfile();
  }, [incomingCall?.callerId]);

  // Открываем CallModal для callee при входящем звонке
  useEffect(() => {
    if (!incomingCall) {
      console.log('[App] Нет входящего звонка, закрываю CallModal');
      setActiveCall(null);
      return;
    }

    if (incomingCall.status === 'ringing' || incomingCall.status === 'accepted') {
      console.log('[App] Входящий звонок, открываю CallModal для callee:', incomingCall);
      setActiveCall({
        roomId: incomingCall.roomId,
        contact: {
          id: incomingCall.callerId,
          name: incomingCall.callerName,
          avatarUrl: incomingCall.callerAvatar
        },
        isCaller: false
      });
    }
  }, [incomingCall]);

  if (!isAuthReady) {
    console.log('[App] Ожидание инициализации auth');
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes profile={profile} />
          {/* Показываем IncomingCallModal только если звонок "ringing" */}
          {incomingCall && incomingCall.status === 'ringing' && (() => {
            console.log('[App] Показываю IncomingCallModal:', incomingCall);
            return (
              <IncomingCallModal
                callerName={incomingCall.callerName}
                callerAvatar={incomingCall.callerAvatar}
                onAccept={acceptCall}
                onDecline={declineCall}
              />
            );
          })()}
          {/* CallModal для callee (isCaller: false) */}
          {activeCall && auth.currentUser && (
            <CallModal
              onClose={() => { 
                setActiveCall(null); 
                console.log('[App] CallModal закрыт');
              }}
              roomId={activeCall.roomId}
              contact={{
                id: activeCall.contact.id,
                name: callerProfile?.name || activeCall.contact.name,
                avatarUrl: callerProfile?.avatarUrl || activeCall.contact.avatarUrl
              }}
              currentUser={auth.currentUser}
              isCaller={activeCall.isCaller}
            />
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppRoutes({ profile }: { profile: any }) {
  const location = useLocation();
  return (
    <>
      {profile && location.pathname !== "/chat" && <TopBar profile={profile} />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/campus-map" element={
          <ProtectedRoute>
            <CampusMap />
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        } />
        <Route path="/jobs" element={
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        } />
        <Route path="/schedule" element={
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/courses" element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        } />
        <Route path="/news" element={
          <ProtectedRoute>
            <NewsPage />
          </ProtectedRoute>
        } />
        <Route path="/materials" element={
          <ProtectedRoute>
            <MaterialsPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/faq" element={
          <ProtectedRoute>
            <FAQPage />
          </ProtectedRoute>
        } />
        <Route path="/test-call" element={
          <ProtectedRoute>
            <TestCall />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
