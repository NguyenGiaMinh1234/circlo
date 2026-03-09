import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

const BookingForm = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    productName: "",
    description: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File quá lớn. Vui lòng chọn file dưới 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt thiết kế.");
      navigate("/auth");
      return;
    }

    if (!formData.productName) {
      toast.error("Vui lòng chọn loại sản phẩm.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("design-images")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("design-images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // Insert booking into database
      const { error } = await supabase.from("design_bookings").insert({
        user_id: user.id,
        product_name: formData.productName,
        description: formData.description || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast.success("Đặt thiết kế thành công! Chúng tôi sẽ liên hệ bạn sớm.");
      navigate("/");
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking" className="py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-6">
            <h2 className="text-4xl md:text-6xl font-light tracking-wider">
              Đặt thiết kế
            </h2>
            <p className="text-lg text-muted-foreground font-light leading-relaxed">
              Điền thông tin bên dưới và chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ
            </p>
          </div>

          <Card className="shadow-elegant border-primary/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(66,140,212,0.06),rgba(255,156,218,0.08),rgba(234,68,146,0.06))] rounded-3xl">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl font-light tracking-wide">Thông tin đặt thiết kế</CardTitle>
              <CardDescription className="font-light">
                Vui lòng cung cấp thông tin chi tiết về dự án phụ kiện của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="productName">Loại sản phẩm *</Label>
                  <Select
                    value={formData.productName}
                    onValueChange={(value) => setFormData({ ...formData, productName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sản phẩm" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Túi Tote">Túi Tote</SelectItem>
                      <SelectItem value="Ví">Ví</SelectItem>
                      <SelectItem value="Túi đựng nhỏ">Túi đựng nhỏ</SelectItem>
                      <SelectItem value="Băng đô">Băng đô</SelectItem>
                      <SelectItem value="Bao đựng tablet">Bao đựng tablet</SelectItem>
                      <SelectItem value="Móc khóa">Móc khóa</SelectItem>
                      <SelectItem value="Đồ trang trí nhỏ">Đồ trang trí nhỏ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả thiết kế</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về thiết kế bạn mong muốn: màu sắc, họa tiết, kích thước, chất liệu..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tải lên hình ảnh tham khảo (tùy chọn)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    {selectedFile ? (
                      <p className="text-sm text-foreground">{selectedFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Kéo thả file hoặc click để tải lên</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG lên đến 10MB</p>
                      </>
                    )}
                  </div>
                </div>

                <Button type="submit" variant="default" size="lg" className="w-full font-light tracking-wider bg-[linear-gradient(90deg,rgba(4,27,45,0.96),rgba(0,78,154,0.94),rgba(66,140,212,0.88),rgba(234,68,146,0.9))] text-white hover:opacity-90 rounded-xl" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi yêu cầu thiết kế"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BookingForm;
