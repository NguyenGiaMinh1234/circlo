import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
const Index = lazy(() => import("./features/home/pages/Index"));
const Design3DPage = lazy(() => import("./features/design3d/pages/Design3DPage"));
const ProductSelectPage = lazy(() => import("./features/design3d/pages/ProductSelectPage"));
const BookingPage = lazy(() => import("./features/booking/pages/BookingPage"));
const AuthPage = lazy(() => import("./features/auth/pages/AuthPage"));
const ChatBox = lazy(() => import("./features/chat/components/ChatBox"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HistoryPage = lazy(() => import("./features/booking/pages/HistoryPage"));
const AdminDashboard = lazy(() => import("./features/admin/pages/AdminDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">
    Đang tải nội dung...
  </div>
);

const DeferredChatBox = () => {
  const location = useLocation();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;

    const enable = () => setShouldRender(true);
    const idleCallback =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(enable, { timeout: 1800 })
        : window.setTimeout(enable, 1200);

    const eagerEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
    eagerEvents.forEach((eventName) => window.addEventListener(eventName, enable, { once: true, passive: true }));

    return () => {
      if ("cancelIdleCallback" in window && typeof idleCallback === "number") {
        window.cancelIdleCallback(idleCallback);
      } else {
        window.clearTimeout(idleCallback as number);
      }
      eagerEvents.forEach((eventName) => window.removeEventListener(eventName, enable));
    };
  }, [shouldRender]);

  if (!shouldRender || location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <ChatBox />
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/design-3d/select" element={<ProductSelectPage />} />
              <Route path="/design-3d" element={<Design3DPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/booking/history" element={<HistoryPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <DeferredChatBox />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
