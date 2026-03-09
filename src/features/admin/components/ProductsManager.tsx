import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  user_id: string;
  product_name: string;
  description: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
}

const statusOptions = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "processing", label: "Đang xử lý" },
  { value: "completed", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
];

const ProductsManager = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("design_bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings((data as any[]) || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({ title: "Lỗi", description: "Không thể tải danh sách đơn thiết kế", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("design_bookings").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      toast({ title: "Thành công", description: "Đã cập nhật trạng thái" });
      fetchBookings();
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật", variant: "destructive" });
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6"><div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Quản lý đơn thiết kế</CardTitle></CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Chưa có đơn thiết kế nào</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Cập nhật</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.product_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{b.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === "completed" ? "default" : b.status === "cancelled" ? "destructive" : "outline"}>
                        {statusOptions.find((s) => s.value === b.status)?.label || b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(b.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <Select defaultValue={b.status} onValueChange={(v) => handleStatusChange(b.id, v)}>
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

export default ProductsManager;