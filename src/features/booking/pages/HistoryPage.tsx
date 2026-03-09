import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Booking {
  id: string;
  product_name: string;
  description: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Chờ xử lý", variant: "outline" },
  processing: { label: "Đang xử lý", variant: "secondary" },
  completed: { label: "Hoàn tất", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const HistoryPage = () => {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchBookings();
    }
  }, [user, authLoading]);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("design_bookings")
        .select("id, product_name, description, image_url, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (status: string) => statusMap[status] || { label: status, variant: "outline" as const };

  return (
    <div className="flex flex-col min-h-screen brand-surface-gradient text-primary">
      <Header />

      <main className="flex-1 px-6 pt-32 pb-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-12 text-center text-primary tracking-wide uppercase">
            Lịch sử đặt thiết kế của bạn
          </h1>

          {loading || authLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-primary/60 italic">
              Bạn chưa có đơn đặt thiết kế nào.
            </p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => {
                const st = getStatus(booking.status);
                return (
                  <Card
                    key={booking.id}
                    className="bg-white/75 border border-primary/15 rounded-2xl shadow-[0_12px_36px_rgba(55,74,90,0.12)] hover:shadow-[0_18px_42px_rgba(55,74,90,0.18)] transition-all duration-300 backdrop-blur-sm"
                  >
                    {booking.image_url && (
                      <div className="w-full h-40 overflow-hidden rounded-t-2xl">
                        <img
                          src={booking.image_url}
                          alt={booking.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="border-b border-primary/10 pb-3">
                      <CardTitle className="text-xl font-medium text-primary flex items-center justify-between">
                        {booking.product_name}
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </CardTitle>
                      <p className="text-xs text-primary/60 mt-1">
                        Ngày đặt: {new Date(booking.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </CardHeader>

                    <CardContent className="p-5 text-sm text-primary/85">
                      <p className="leading-relaxed">
                        {booking.description || "Không có mô tả"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HistoryPage;
