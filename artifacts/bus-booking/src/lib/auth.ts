import { create } from "zustand";

interface User {
  id: number;
  username: string;
  role: "USER" | "ADMIN";
  token: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => {
  const storedUser = localStorage.getItem("voicebus_user");
  let initialUser = null;
  
  if (storedUser) {
    try {
      initialUser = JSON.parse(storedUser);
    } catch (e) {
      console.error("Failed to parse stored user", e);
    }
  }

  return {
    user: initialUser,
    setUser: (user) => {
      if (user) {
        localStorage.setItem("voicebus_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("voicebus_user");
      }
      set({ user });
    },
    logout: () => {
      localStorage.removeItem("voicebus_user");
      set({ user: null });
    },
  };
});
