import { useCallback } from "react";

export function useNotify() {
  return useCallback((msg: string) => {
    const toast = document.createElement("div");
    toast.className = "fixed top-4 right-4 bg-[#A166FF] text-white px-4 py-2 rounded shadow z-50 animate-fade-in";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }, []);
} 