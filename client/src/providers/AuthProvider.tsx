import { createContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  name: string;
  email: string;
  password: string;
  pin: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  pinLogin: (username: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  pinLogin: async () => {},
  logout: async () => {},
  refetchUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/auth/me");
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        // Not authenticated, clear user state
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", data);
      const responseData = await response.json();
      setUser(responseData.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${responseData.user.name}!`,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const pinLogin = async (username: string, pin: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/pin-login", { username, pin });
      const responseData = await response.json();
      setUser(responseData.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${responseData.user.name}!`,
      });
    } catch (error: any) {
      toast({
        title: "PIN login failed",
        description: error.message || "Invalid username or PIN",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/register", data);
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.name}!`,
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/auth/me");
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      // Not authenticated, clear user state
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        pinLogin,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
