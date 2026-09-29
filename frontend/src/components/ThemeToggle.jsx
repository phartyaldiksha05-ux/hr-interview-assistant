import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" className={`mw-theme-toggle ${className}`} onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
      <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
      <span className="mw-theme-toggle-label">{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}
