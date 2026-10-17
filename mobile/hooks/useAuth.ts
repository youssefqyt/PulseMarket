import { useAuthStore } from "../store/authStore";

/** Convenience hook around the auth store. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);

  return {
    user,
    status,
    error,
    isAuthenticated: status === "authenticated",
    isGuest: status === "guest",
    isLoading: status === "loading",
    signIn,
    signUp,
    signOut,
  };
}
