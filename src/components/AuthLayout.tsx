import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ backgroundColor: "#FDF9FF" }}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-3xl p-8 md:p-12 shadow-lg",
          className,
        )}
        style={{ backgroundColor: "#FCF9FF" }}
      >
        {children}
      </div>
    </div>
  );
}
