import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Index } from "./pages/Index";
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
import { useEffect, useState, useRef } from "react";
import MaterialsPage from "./pages/Materials";
import SettingsPage from "./pages/Settings";
import FAQPage from "./pages/FAQ";
import TestCall from "./pages/TestCall";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import IncomingCallModal from "@/components/IncomingCallModal";
import { CallModal } from "@/pages/CallModal";
import VacancyDetails from "./pages/VacancyDetails";
import { useAuth } from '@/hooks/useAuth';
import React from 'react';
import FriendsPage from "./pages/Friends";
import GradesPage from "./pages/grades";

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const { user } = useAuth();
  const { incomingCall, acceptCall, declineCall } = useIncomingCall();
  const [showCallModal, setShowCallModal] = useState(false);
  const [callConfig, setCallConfig] = useState<any>(null);
  const [callerProfile, setCallerProfile] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Ждем инициализации auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Диагностические логи
  useEffect(() => {
    if (!isAuthReady) return;
    // Можно добавить логи
  }, [isAuthReady, auth.currentUser, incomingCall]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) {
          setProfile(snap.data() as any);
        } else {
          setProfile({ avatarUrl: auth.currentUser.photoURL || "" });
        }
      } catch (err) {
        setProfile({ avatarUrl: auth.currentUser?.photoURL || "" });
      }
    };
    fetchProfile();
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchCallerProfile = async () => {
      if (!incomingCall?.callerId) return;
      try {
        const snap = await getDoc(doc(db, "users", incomingCall.callerId));
        if (snap.exists()) {
          setCallerProfile(snap.data());
        } else {
          setCallerProfile(null);
        }
      } catch (err) {
        setCallerProfile(null);
      }
    };
    fetchCallerProfile();
  }, [incomingCall?.callerId]);

  // Эффект для обработки входящего звонка
  useEffect(() => {
    if (incomingCall && user) {
      setCallConfig({
        roomId: incomingCall.roomId,
        isCaller: false,
        contact: {
          id: incomingCall.callerId,
          name: incomingCall.callerName,
          avatarUrl: incomingCall.callerAvatar
        },
        currentUser: {
          id: user.uid,
          name: profile?.displayName || 'User',
          avatarUrl: profile?.photoURL || profile?.avatarUrl
        },
        onCallEnd: () => {
          setShowCallModal(false);
          setCallConfig(null);
        }
      });
      setShowCallModal(true);
    } else {
      setShowCallModal(false);
      setCallConfig(null);
    }
  }, [incomingCall, user, profile]);

  const handleCloseCallModal = () => {
    setShowCallModal(false);
    setCallConfig(null);
  };

  if (!isAuthReady) return null;

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
          {showCallModal && callConfig && (
            <CallModal
              callConfig={callConfig}
              onClose={handleCloseCallModal}
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
        <Route path="/jobs/:id" element={
          <ProtectedRoute>
            <VacancyDetails />
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
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/grades" element={
          <ProtectedRoute>
            <GradesPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
