import { useContext } from "react";
import { AuthContext } from "@/providers/AuthProvider";

/**
 * Hook to access the authentication context
 * 
 * @returns Authentication context with user information, loading state, login, and logout functions
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};
