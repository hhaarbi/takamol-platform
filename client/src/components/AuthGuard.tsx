import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard — wraps protected pages.
 * If the user is not authenticated, redirects to /login.
 * Shows a full-screen loader while auth state is being resolved.
 */
export default function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f7f5" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#C4855A", borderTopColor: "transparent" }}
          />
          <p className="text-sm text-gray-400">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const currentPath = window.location.pathname;
    navigate(`${redirectTo}?returnTo=${encodeURIComponent(currentPath)}`);
    return null;
  }

  return <>{children}</>;
}
