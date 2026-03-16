import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, ShoppingCart, LayoutDashboard } from "lucide-react";
import Header from "@/shared/components/Header";
import ProductsManager from "../components/ProductsManager";
import UsersManager from "../components/UsersManager";
import OrdersManager from "../components/OrdersManager";
import DashboardOverview from "../components/DashboardOverview";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuthContext();

  useEffect(() => {
    if (!loading && (!user || !isAdmin())) {
      navigate("/");
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="page-brand-bg min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="page-brand-bg min-h-screen">
      <Header compact />
      <main className="container mx-auto px-4 pt-28 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-white/80 mt-2">
            Quản lý sản phẩm, người dùng và đơn hàng
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="inline-grid h-auto w-fit grid-cols-4 gap-1 rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
            <TabsTrigger value="overview" className="h-9 gap-1.5 px-2.5 text-xs sm:px-3 sm:text-sm">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="h-9 gap-1.5 px-2.5 text-xs sm:px-3 sm:text-sm">
              <Package className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sản phẩm</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="h-9 gap-1.5 px-2.5 text-xs sm:px-3 sm:text-sm">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Người dùng</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="h-9 gap-1.5 px-2.5 text-xs sm:px-3 sm:text-sm">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Đơn hàng</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="products">
            <ProductsManager />
          </TabsContent>

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
