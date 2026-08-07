import { useSyncExternalStore } from "react";
import { AuthUser } from "@/types/auth";

const TOKEN_KEY = "creditsea_token";
const USER_KEY = "creditsea_user";

let cachedUserRaw: string | null | undefined;
let cachedUser: AuthUser | null = null;

function subscribeToStorage(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function saveSession(token: string, user: AuthUser): void {
  const serializedUser = JSON.stringify(user);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, serializedUser);
  cachedUserRaw = serializedUser;
  cachedUser = user;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (raw === cachedUserRaw) return cachedUser;

  cachedUserRaw = raw;
  if (!raw) {
    cachedUser = null;
    return cachedUser;
  }

  try {
    cachedUser = JSON.parse(raw) as AuthUser;
  } catch {
    cachedUser = null;
  }

  return cachedUser;
}

export function useSessionUser(): AuthUser | null | undefined {
  return useSyncExternalStore(subscribeToStorage, getUser, () => undefined);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  cachedUserRaw = null;
  cachedUser = null;
}
