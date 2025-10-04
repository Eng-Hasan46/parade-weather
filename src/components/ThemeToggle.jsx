// src/components/ThemeToggle.jsx
export default function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === "light";
  return (
    <button
      onClick={onToggle}
      className={
        "rounded-full px-3 py-1 text-sm font-semibold transition " +
        (isLight
          ? "bg-black/5 hover:bg-black/10 text-gray-800"
          : "bg-white/10 hover:bg-white/20 text-white")
      }
      aria-label="Toggle light/dark mode"
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {isLight ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
