import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ShoppingCart, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalBookings: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
}

const DashboardOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookingsRes, profilesRes, ordersRes] = await Promise.all([
          supabase.from("design_bookings").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id, total_price"),
        ]);

        const totalRevenue = ordersRes.data?.reduce(
          (sum, order) => sum + Number(order.total_price || 0),
          0
        ) || 0;

        setStats({
          totalBookings: bookingsRes.count || 0,
          totalUsers: profilesRes.count || 0,
          totalOrders: ordersRes.data?.length || 0,
          totalRevenue,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "Đơn thiết kế", value: stats.totalBookings, icon: Package, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "Người dùng", value: stats.totalUsers, icon: Users, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Đơn hàng", value: stats.totalOrders, icon: ShoppingCart, color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { title: "Doanh thu", value: `${stats.totalRevenue.toLocaleString("vi-VN")}đ`, icon: DollarSign, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-8 bg-muted rounded" />
            </CardHeader>
            <CardContent><div className="h-8 w-16 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default DashboardOverview;