import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2, Mail, User, Phone } from "lucide-react";

const RegisterForm = () => {
  const navigate = useNavigate();
  const { signUp } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.phone
    );

    setIsLoading(false);

    if (error) {
      toast({
        title: "Lỗi đăng ký",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Đăng ký thành công",
      description: "Tài khoản của bạn đã được tạo!",
    });
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Đăng ký</h2>
        <p className="text-sm text-muted-foreground">
          Tạo tài khoản mới để bắt đầu
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="Nhập họ và tên"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-phone">Số điện thoại</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="pl-10"
              disabled={isLoading}
              maxLength={15}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-email"
              type="email"
              placeholder="Nhập email của bạn"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Mật khẩu</Label>
          <Input
            id="register-password"
            type="password"
            placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm">Xác nhận mật khẩu</Label>
          <Input
            id="register-confirm"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang đăng ký...
            </>
          ) : (
            "Đăng ký"
          )}
        </Button>
      </form>
    </div>
  );
};

export default RegisterForm;
