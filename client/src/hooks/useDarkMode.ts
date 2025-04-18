import { useState, useEffect } from "react";

/**
 * Hook to manage dark mode state
 * 
 * @returns Object containing isDarkMode state and toggleDarkMode function
 */
export const useDarkMode = () => {
  // Check for saved theme preference or system preference
  const getInitialTheme = (): boolean => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("darkMode");
      
      if (savedTheme !== null) {
        return savedTheme === "true";
      }
      
      // Check for system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    
    return false;
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Apply theme changes to DOM and save preference
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode };
};
