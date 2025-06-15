import { useNavigate } from "react-router-dom";

export default function BackButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3EDFF] text-[#A166FF] font-semibold shadow hover:bg-[#EAD7FF] transition ${className}`}
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
        <path d="M13 5l-5 5 5 5" />
      </svg>
      Назад
    </button>
  );
} 