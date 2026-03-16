import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import LoginForm from "@/features/auth/components/LoginForm";
import RegisterForm from "@/features/auth/components/RegisterForm";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/routes";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuthContext();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register" || tab === "login") {
      setActiveTab(tab as "login" | "register");
      return;
    }

    if (location.pathname === ROUTES.REGISTER) {
      setActiveTab("register");
      return;
    }

    if (location.pathname === ROUTES.LOGIN) {
      setActiveTab("login");
    }
  }, [searchParams, location.pathname]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="page-brand-bg min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="page-brand-bg flex-1 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4 pt-44">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              {showForgotPassword ? (
                <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
              ) : (
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "login" | "register")}
                  className="w-full"
                >
                  <TabsList className="mb-6 grid w-full grid-cols-2 rounded-2xl bg-[linear-gradient(90deg,rgba(4,27,45,0.08),rgba(0,78,154,0.08),rgba(255,156,218,0.1))] p-1 text-white">
                    <TabsTrigger
                      value="login"
                      className="rounded-[0.9rem] font-semibold data-[state=active]:bg-[linear-gradient(90deg,rgb(4_27_45)_0%,rgb(0_78_154)_48%,rgb(234_68_146)_100%)] data-[state=active]:text-white data-[state=active]:shadow-[0_12px_24px_rgba(4,27,45,0.22)]"
                    >
                      Đăng nhập
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="rounded-[0.9rem] font-semibold data-[state=active]:bg-[linear-gradient(90deg,rgb(4_27_45)_0%,rgb(0_78_154)_48%,rgb(234_68_146)_100%)] data-[state=active]:text-white data-[state=active]:shadow-[0_12px_24px_rgba(4,27,45,0.22)]"
                    >
                      Đăng ký
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-0">
                    <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />
                  </TabsContent>
                  <TabsContent value="register" className="mt-0">
                    <RegisterForm />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AuthPage;
