import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  user_id: string;
  product_name: string;
  quantity: number;
  total_price: number | null;
  status: string;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
}

const statusOptions = [
  { value: "pending", label: "Chờ xử lý", color: "bg-yellow-500/10 text-yellow-500" },
  { value: "confirmed", label: "Đã xác nhận", color: "bg-blue-500/10 text-blue-500" },
  { value: "processing", label: "Đang xử lý", color: "bg-purple-500/10 text-purple-500" },
  { value: "shipped", label: "Đang giao", color: "bg-orange-500/10 text-orange-500" },
  { value: "delivered", label: "Đã giao", color: "bg-green-500/10 text-green-500" },
  { value: "cancelled", label: "Đã hủy", color: "bg-red-500/10 text-red-500" },
];

const OrdersManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as any[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Lỗi", description: "Không thể tải danh sách đơn hàng", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      toast({ title: "Thành công", description: "Đã cập nhật trạng thái đơn hàng" });
      fetchOrders();
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái", variant: "destructive" });
    }
  };

  const getStatusStyle = (status: string) => statusOptions.find((s) => s.value === status)?.color || "bg-gray-500/10 text-gray-500";
  const getStatusLabel = (status: string) => statusOptions.find((s) => s.value === status)?.label || status;

  if (loading) {
    return <Card><CardContent className="p-6"><div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div></CardContent></Card>;
  }

  return (
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
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>SL</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Cập nhật</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>{order.product_name}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell className="font-medium">{(order.total_price || 0).toLocaleString("vi-VN")}đ</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(order.status)}`}>{getStatusLabel(order.status)}</span>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <Select defaultValue={order.status} onValueChange={(v) => handleStatusChange(order.id, v)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>{statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersManager;