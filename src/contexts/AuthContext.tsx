import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import type { AuthError, AuthResponse, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type AppRole = "admin" | "moderator" | "user";

type AuthMessageResult<T = AuthResponse["data"]> = Promise<{ data?: T; error: { message: string } | null }>;
type SignOutResult = Promise<{ error: AuthError | null }>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  signUp: (email: string, password: string, fullName?: string, phone?: string) => AuthMessageResult;
  signIn: (email: string, password: string) => AuthMessageResult;
  signOut: () => SignOutResult;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: () => boolean;
  isModerator: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const fetchUserRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching roles:", error);
        return [];
      }

      return (data?.map((r) => r.role as AppRole)) || [];
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // Defer role fetching with setTimeout to avoid deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserRoles(currentSession.user.id).then(setRoles);
          }, 0);
        } else {
          setRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (currentSession?.user) {
        fetchUserRoles(currentSession.user.id).then(setRoles);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRoles]);

  const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) {
      let message = "Đã có lỗi xảy ra khi đăng ký";
      if (error.message.includes("already registered")) {
        message = "Email này đã được đăng ký";
      } else if (error.message.includes("password")) {
        message = "Mật khẩu phải có ít nhất 6 ký tự";
      }
      return { error: { message } };
    }

    return { data, error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let message = "Đã có lỗi xảy ra khi đăng nhập";
      if (error.message.includes("Invalid login credentials")) {
        message = "Email hoặc mật khẩu không chính xác";
      }
      return { error: { message } };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể đăng xuất",
        variant: "destructive",
      });
      return { error };
    }
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });

    if (error) {
      return { error: { message: "Không thể gửi email khôi phục mật khẩu" } };
    }

    return { error: null };
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = () => hasRole("admin");
  const isModerator = () => hasRole("moderator") || hasRole("admin");

  const value: AuthContextType = {
    user,
    session,
    loading,
    roles,
    signUp,
    signIn,
    signOut,
    resetPassword,
    hasRole,
    isAdmin,
    isModerator,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
