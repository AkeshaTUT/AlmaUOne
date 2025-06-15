import React from "react";

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 50%)`;
}

export default function Avatar({
  src,
  name,
  email,
  size = 40,
  className = "",
}: {
  src?: string;
  name?: string;
  email?: string;
  size?: number;
  className?: string;
}) {
  const displayLetter = (name || email || "A")[0].toUpperCase();
  const bgColor = stringToColor(name || email || "A");

  if (src) {
    return (
      <img
        src={src}
        alt={name || email || "Аватар"}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold ${className}`}
      style={{
        width: size,
        height: size,
        background: bgColor,
        fontSize: size * 0.5,
        userSelect: "none",
      }}
    >
      {displayLetter}
    </div>
  );
} 