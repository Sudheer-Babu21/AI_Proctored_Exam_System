"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types";

interface AuthUser {
  public_id: string;
  role: UserRole;
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, name?: string, email?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): { sub: string; role: UserRole } | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT token:", e);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user_info");

      if (storedToken) {
        const decoded = parseJwt(storedToken);
        if (decoded) {
          let extraInfo: { name?: string; email?: string } = {};
          if (storedUser) {
            try {
              extraInfo = JSON.parse(storedUser);
            } catch {}
          }
          setToken(storedToken);
          setUser({
            public_id: decoded.sub,
            role: decoded.role,
            ...extraInfo,
          });
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user_info");
        }
      }
    } catch (e) {
      console.error("Error reading auth state:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    (accessToken: string, name?: string, email?: string) => {
      const decoded = parseJwt(accessToken);
      if (decoded) {
        localStorage.setItem("token", accessToken);
        const userInfo = { name, email };
        localStorage.setItem("user_info", JSON.stringify(userInfo));

        setToken(accessToken);
        setUser({
          public_id: decoded.sub,
          role: decoded.role,
          name,
          email,
        });

        if (decoded.role === "EXAMINER") {
          router.push("/examiner/dashboard");
        } else if (decoded.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/student/dashboard");
        }
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_info");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
