"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const stored = localStorage.getItem("theme") as Theme | null;
    const initialTheme: Theme =
      stored ?? (root.classList.contains("dark") ? "dark" : "light");
    root.classList.remove("light", "dark");
    root.classList.add(initialTheme);
    if (!stored) localStorage.setItem("theme", initialTheme);
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  const setThemeValue = (newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeValue(newTheme);
  };

  return {
    theme: mounted ? theme : "dark",
    setTheme: setThemeValue,
    toggleTheme,
  };
}
