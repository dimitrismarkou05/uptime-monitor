import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const EXPIRES_KEY = "token_expires_at";

function saveSession(session: Session) {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(REFRESH_KEY, session.refresh_token);
  const expiresAt = Date.now() + session.expires_in * 1000;
  localStorage.setItem(EXPIRES_KEY, String(expiresAt));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getTokenExpiresAt(): number | null {
  const raw = localStorage.getItem(EXPIRES_KEY);
  return raw ? Number(raw) : null;
}

export function isTokenExpiringSoon(bufferMs: number = 5 * 60 * 1000): boolean {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return false;
  return Date.now() >= expiresAt - bufferMs;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  if (data.session) saveSession(data.session);
  return data.user;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signUp({ email, password });
  if (error) throw error;
  if (data.session) saveSession(data.session);
  return data.user;
}

export async function signOut() {
  await getSupabase().auth.signOut();
  clearSession();
}

export async function refreshSession(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const { data, error } = await getSupabase().auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    clearSession();
    throw new Error(error?.message || "Session refresh failed");
  }

  saveSession(data.session);
  return data.session.access_token;
}

export async function updateEmail(email: string) {
  const { data, error } = await getSupabase().auth.updateUser({ email });
  if (error) throw error;
  return data;
}

export async function updatePassword(password: string) {
  const { data, error } = await getSupabase().auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function requestPasswordReset(email: string) {
  const { data, error } = await getSupabase().auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${window.location.origin}/settings`,
    },
  );
  if (error) throw error;
  return data;
}
