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

interface BookingWithProfile {
  id: string;
  user_id: string;
  product_name: string;
  description: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  pending: { label: "Chờ xử lý", variant: "outline" },
  confirmed: { label: "Đã xác nhận", variant: "secondary" },
  processing: { label: "Đang xử lý", variant: "secondary" },
  completed: { label: "Hoàn tất", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const ProductsManager = () => {
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithProfile | null>(null);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("design_bookings")
        .select("*, profiles!design_bookings_user_id_fkey(full_name, phone, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback without join if FK doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("design_bookings")
          .select("*")
          .order("created_at", { ascending: false });
        if (fallbackError) throw fallbackError;

        // Fetch profiles separately
        const userIds = [...new Set((fallbackData || []).map((b: any) => b.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone, avatar_url")
          .in("id", userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        const merged = (fallbackData || []).map((b: any) => ({
          ...b,
          profiles: profileMap.get(b.user_id) || null,
        }));
        setBookings(merged);
        return;
      }
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
    setUpdatingId(id);
    try {
      const { error } = await supabase.from("design_bookings").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      toast({ title: "Thành công", description: `Đã cập nhật trạng thái: ${statusConfig[newStatus]?.label || newStatus}` });
      fetchBookings();
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật", variant: "destructive" });
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
        <CardHeader><CardTitle>Quản lý đơn thiết kế</CardTitle></CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có đơn thiết kế nào</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedBooking(b)}>
                      <TableCell className="font-medium">{b.profiles?.full_name || "Chưa cập nhật"}</TableCell>
                      <TableCell>{b.product_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{b.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[b.status]?.variant || "outline"}>
                          {statusConfig[b.status]?.label || b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(b.created_at).toLocaleDateString("vi-VN")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => setSelectedBooking(b)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {b.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                                disabled={updatingId === b.id}
                                onClick={() => handleStatusChange(b.id, "confirmed")}
                              >
                                {updatingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                disabled={updatingId === b.id}
                                onClick={() => handleStatusChange(b.id, "cancelled")}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {(b.status === "confirmed" || b.status === "processing") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              disabled={updatingId === b.id}
                              onClick={() => handleStatusChange(b.id, "completed")}
                            >
                              {updatingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
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

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn thiết kế</DialogTitle>
            <DialogDescription>Thông tin chi tiết về đơn đặt thiết kế</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{selectedBooking.profiles?.full_name || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{selectedBooking.profiles?.phone || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sản phẩm</p>
                  <p className="font-medium">{selectedBooking.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge variant={statusConfig[selectedBooking.status]?.variant || "outline"}>
                    {statusConfig[selectedBooking.status]?.label || selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày đặt</p>
                  <p className="font-medium">{new Date(selectedBooking.created_at).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mã đơn</p>
                  <p className="font-mono text-xs">{selectedBooking.id}</p>
                </div>
              </div>

              {selectedBooking.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Mô tả</p>
                  <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg">{selectedBooking.description}</p>
                </div>
              )}

              {selectedBooking.image_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Hình ảnh tham khảo</p>
                  <img
                    src={selectedBooking.image_url}
                    alt="Design reference"
                    className="rounded-lg max-h-48 object-cover border"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                {selectedBooking.status === "pending" && (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => { handleStatusChange(selectedBooking.id, "confirmed"); setSelectedBooking(null); }}
                    >
                      <Check className="h-4 w-4 mr-2" /> Xác nhận
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => { handleStatusChange(selectedBooking.id, "cancelled"); setSelectedBooking(null); }}
                    >
                      <X className="h-4 w-4 mr-2" /> Hủy đơn
                    </Button>
                  </>
                )}
                {(selectedBooking.status === "confirmed" || selectedBooking.status === "processing") && (
                  <Button
                    className="flex-1"
                    onClick={() => { handleStatusChange(selectedBooking.id, "completed"); setSelectedBooking(null); }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Hoàn tất
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

export default ProductsManager;
