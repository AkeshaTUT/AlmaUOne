import React, { useState, useEffect } from "react";
import characterImg from "@/assets/3d-character.png";
// import themeIcon from "@/assets/theme.png";
// import notificationIcon from "@/assets/notification.png";
import searchIcon from "@/assets/search.png";
import Sidebar from "@/components/Sidebar";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import TopBar from "@/components/TopBar";
import Avatar from "@/components/Avatar";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; email?: string; avatarUrl?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) setProfile(snap.data() as any);
        else setProfile({
          name: auth.currentUser.displayName || "",
          email: auth.currentUser.email || "",
          avatarUrl: auth.currentUser.photoURL || "",
        });
      }
    };
    fetchProfile();
  }, []);

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {profile && <TopBar profile={profile} />}
      <div className="min-h-screen bg-[#FDF9FF] flex flex-col items-center py-8" style={{ fontFamily: 'Inter, -apple-system, Roboto, Helvetica, sans-serif' }}>
        {/* Top bar */}
        <div className="w-full max-w-6xl flex items-center justify-between mb-8">
          {/* Меню слева */}
          <button className="w-10 h-10 flex items-center justify-center bg-transparent hover:bg-[#F3EDFF] transition" onClick={() => setSidebarOpen(true)}>
            {/* SVG бургер */}
            <svg width="24" height="24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
          {/* Поиск по центру */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-3xl">
              <input
                className="w-full rounded-full px-6 py-3 pr-12 border-2 border-[#3B82F6] focus:outline-none text-base shadow"
                placeholder="Search..."
                style={{ fontFamily: 'Inter, -apple-system, Roboto, Helvetica, sans-serif', fontWeight: 500 }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                <img src={searchIcon} alt="search" className="w-6 h-6" />
              </span>
            </div>
          </div>
          {/* Иконки справа */}
          {/* <div className="flex items-center gap-6 ml-8">
            <img src={themeIcon} alt="theme" className="w-8 h-8" />
            <img src={notificationIcon} alt="notifications" className="w-8 h-8" />
            <span className="w-8 h-8 rounded-full bg-[#EAD7FF] inline-block"></span>
          </div> */}
        </div>

        {/* Main content */}
        <div className="w-full max-w-6xl flex flex-row gap-8 items-start">
          {/* Left side */}
          <div className="flex-1 flex flex-col gap-8">
            <h1 className="text-5xl font-semibold text-[#1E0E62] mb-6" style={{ fontFamily: 'Inter, -apple-system, Roboto, Helvetica, sans-serif', fontWeight: 600 }}>
              {profile ? `Welcome, ${profile.name || profile.email || "User"}` : "Welcome, User"}
            </h1>
            {profile && (
              <div className="flex items-center gap-4 mb-4">
                <Avatar src={profile.avatarUrl} name={profile.name} email={profile.email} size={64} />
                <div>
                  <div className="font-semibold">{profile.name}</div>
                  <div className="text-[#8E8E93] text-sm">{profile.email}</div>
                </div>
              </div>
            )}
            {/* Оставлено место для будущих виджетов */}
          </div>
          {/* Right side: 3D character */}
          <div className="flex-1 flex flex-col items-center justify-start mt-16">
            <div className="w-80 h-80 rounded-full bg-[#EAD7FF] flex items-center justify-center overflow-hidden">
              <img src={characterImg} alt="3D Character" className="object-cover w-300 h-384" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
