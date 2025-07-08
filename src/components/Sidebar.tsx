import React from "react";
import { NavLink } from "react-router-dom";

const menu = [
  { icon: "🏠", label: "Home", path: "/" },
  { icon: "🎓", label: "Grades", path: "/grades" },
  { icon: "🗂️", label: "Tasks", path: "/tasks" },
  { icon: "👥", label: "Friends", path: "/friends" },
  { icon: "📅", label: "Schedule", path: "/schedule" },
  { icon: "📚", label: "Materials", path: "/materials" },
  { icon: "🗒️", label: "Courses", path: "/courses" },
  { icon: "🗺️", label: "Campus Map", path: "/campus-map" },
  { icon: "💼", label: "Jobs", path: "/jobs" },
  { icon: "💬", label: "Chat", path: "/chat" },
  { icon: "❓", label: "FAQ", path: "/faq" },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="text-3xl font-bold text-center mt-8 mb-4">AlmaUOne</div>
        <div className="h-1 bg-[#A166FF] mb-6" />
        <nav className="flex-1">
          <ul className="space-y-4 px-8">
            {menu.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 text-lg font-semibold px-2 py-1 rounded-md transition-colors ${
                      isActive ? "bg-[#EAD7FF] font-bold" : "hover:bg-[#F3EDFF]"
                    }`
                  }
                  end={item.path === "/"}
                  onClick={onClose}
                >
                  <span className="text-2xl">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button
          className="absolute top-4 right-4 text-2xl"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>
    </div>
  );
} 