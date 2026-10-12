import { useState, useEffect } from "react";

function getInitialDark(): boolean {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  } catch {
    return false;
  }
}

export function useTheme() {
  const [dark, setDark] = useState(getInitialDark);

  useEffect(() => {
    try {
      document.documentElement.classList.toggle("dark", dark);
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // ignore in preview environments
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
