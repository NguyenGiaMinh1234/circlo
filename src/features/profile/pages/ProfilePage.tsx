import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Phone, Calendar, FileText, Save } from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    birthday: "",
    bio: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone, birthday, bio")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        birthday: data.birthday || "",
        bio: data.bio || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name.trim() || null,
        phone: formData.phone.trim() || null,
        birthday: formData.birthday || null,
        bio: formData.bio.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật hồ sơ",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Thành công",
      description: "Hồ sơ đã được cập nhật",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-start justify-center py-12 px-4 pt-44">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <User className="h-6 w-6" />
              Hồ sơ cá nhân
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Cập nhật thông tin cá nhân của bạn
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-name">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-name"
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="pl-10"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-birthday">Ngày sinh</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profile-birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-bio">Mô tả ngắn</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="profile-bio"
                    placeholder="Giới thiệu ngắn về bạn..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="pl-10 min-h-[100px]"
                    maxLength={500}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/500
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
