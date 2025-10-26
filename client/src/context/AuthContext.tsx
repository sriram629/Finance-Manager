import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: UserInfo | null;
  login: (userData: UserInfo, token: string) => void;
  logout: () => void;
  updateUser: (userData: UserInfo) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const token = localStorage.getItem("authToken");
    const userInfo = localStorage.getItem("userInfo");
    if (token && userInfo) {
      try {
        return JSON.parse(userInfo) as UserInfo;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const navigate = useNavigate();

  const login = (userData: UserInfo, token: string) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("userInfo", JSON.stringify(userData));
    setUser(userData);
    navigate("/home");
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    setUser(null);
    navigate("/login");
  };

  const updateUser = (userData: UserInfo) => {
    setUser(userData);
    localStorage.setItem("userInfo", JSON.stringify(userData));
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUser, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 5. Create a custom hook for easy access
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
