import api from "./api";
import { User } from "@/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post("/auth/login", payload);
  const result = data.data || data;
  // Token is now set as httpOnly cookie by the server
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_user", JSON.stringify(result.user));
  }
  return { user: result.user };
}

export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const { data } = await api.post("/auth/register", payload);
  const result = data.data || data;
  // Token is now set as httpOnly cookie by the server
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_user", JSON.stringify(result.user));
  }
  return { user: result.user };
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // Continue with local cleanup even if API call fails
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_user");
    window.location.href = "/";
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("auth_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getStoredUser();
}
