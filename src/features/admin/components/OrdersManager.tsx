import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Check, X, Eye, CheckCircle, Loader2 } from "lucide-react";

interface OrderWithProfile {
  id: string;
  user_id: string;
  product_name: string;
  quantity?: number;
  total_price?: number | null;
  status: string;
  shipping_address?: string | null;
  notes?: string | null;
  description?: string | null;
  image_url?: string | null;
  type?: "order" | "design";
  created_at: string;
  profiles: {
    full_name: string | null;
    phone: string | null;
    avatar_url?: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  pending: { label: "Chờ xử lý", variant: "outline" },
  confirmed: { label: "Đã xác nhận", variant: "secondary" },
  processing: { label: "Đang xử lý", variant: "secondary" },
  shipped: { label: "Đang giao", variant: "secondary" },
  delivered: { label: "Hoàn tất", variant: "default" },
  completed: { label: "Hoàn tất", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const OrdersManager = () => {
  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithProfile | null>(null);

  const fetchOrders = async () => {
    try {
      // Fetch from orders table
      let ordersData: any[] = [];
      const { data: ordersRaw, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!ordersError && ordersRaw) {
        // Fetch profiles separately for orders
        const orderUserIds = [...new Set((ordersRaw || []).map((o: any) => o.user_id))];
        if (orderUserIds.length > 0) {
          const { data: orderProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, phone")
            .in("id", orderUserIds);
          const orderProfileMap = new Map((orderProfiles || []).map((p: any) => [p.id, p]));
          ordersData = (ordersRaw || []).map((o: any) => ({
            ...o,
            profiles: orderProfileMap.get(o.user_id) || null,
            type: "order",
          }));
        }
      }

      // Fetch completed design bookings from design_bookings table
      let bookingsData: any[] = [];
      const { data: bookingsRaw, error: bookingsError } = await supabase
        .from("design_bookings")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (!bookingsError && bookingsRaw) {
        // Fetch profiles separately for bookings
        const bookingUserIds = [...new Set((bookingsRaw || []).map((b: any) => b.user_id))];
        if (bookingUserIds.length > 0) {
          const { data: bookingProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, phone, avatar_url")
            .in("id", bookingUserIds);
          const bookingProfileMap = new Map((bookingProfiles || []).map((p: any) => [p.id, p]));
          bookingsData = (bookingsRaw || []).map((b: any) => ({
            ...b,
            quantity: 1,
            total_price: null,
            shipping_address: null,
            notes: null,
            profiles: bookingProfileMap.get(b.user_id) || null,
            type: "design",
          }));
        }
      }

      // Merge and sort
      const allOrders = [...ordersData, ...bookingsData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setOrders(allOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Lỗi", description: "Không thể tải danh sách đơn hàng", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId: string, newStatus: string, type: string = "order") => {
    setUpdatingId(orderId);
    try {
      const table = type === "design" ? "design_bookings" : "orders";
      const { error } = await supabase.from(table).update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      toast({ title: "Thành công", description: `Đã cập nhật: ${statusConfig[newStatus]?.label || newStatus}` });
      fetchOrders();
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6"><div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div></CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Quản lý đơn hàng</CardTitle></CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có đơn hàng nào</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>SL</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOrder(order)}>
                      <TableCell className="font-medium">{order.profiles?.full_name || "Chưa cập nhật"}</TableCell>
                      <TableCell>{order.product_name}</TableCell>
                      <TableCell>{order.quantity || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[order.status]?.variant || "outline"}>
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {order.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 text-green-600 border-green-200 hover:bg-green-50" disabled={updatingId === order.id} onClick={() => handleStatusChange(order.id, "confirmed", order.type)}>
                                {updatingId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:bg-red-50" disabled={updatingId === order.id} onClick={() => handleStatusChange(order.id, "cancelled", order.type)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {(order.status === "confirmed" || order.status === "processing") && (
                            <Button size="sm" variant="outline" className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50" disabled={updatingId === order.id} onClick={() => handleStatusChange(order.id, "completed", order.type)}>
                              {updatingId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
            <DialogDescription>Thông tin chi tiết đơn hàng và khách hàng</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{selectedOrder.profiles?.full_name || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{selectedOrder.profiles?.phone || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sản phẩm</p>
                  <p className="font-medium">{selectedOrder.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số lượng</p>
                  <p className="font-medium">{selectedOrder.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng tiền</p>
                  <p className="font-medium text-lg">{(selectedOrder.total_price || 0).toLocaleString("vi-VN")}đ</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge variant={statusConfig[selectedOrder.status]?.variant || "outline"}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày đặt</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mã đơn</p>
                  <p className="font-mono text-xs">{selectedOrder.id}</p>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ giao hàng</p>
                  <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">{selectedOrder.shipping_address}</p>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Ghi chú</p>
                  <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                {selectedOrder.status === "pending" && (
                  <>
                    <Button className="flex-1" onClick={() => { handleStatusChange(selectedOrder.id, "confirmed", selectedOrder.type); setSelectedOrder(null); }}>
                      <Check className="h-4 w-4 mr-2" /> Xác nhận
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => { handleStatusChange(selectedOrder.id, "cancelled", selectedOrder.type); setSelectedOrder(null); }}>
                      <X className="h-4 w-4 mr-2" /> Hủy đơn
                    </Button>
                  </>
                )}
                {(selectedOrder.status === "confirmed" || selectedOrder.status === "processing") && (
                  <Button className="flex-1" onClick={() => { handleStatusChange(selectedOrder.id, "completed", selectedOrder.type); setSelectedOrder(null); }}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Hoàn tất giao hàng
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersManager;
