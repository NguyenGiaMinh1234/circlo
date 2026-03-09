import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Phone } from "lucide-react";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleEmailReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập email",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Email đã được gửi",
      description: `Link khôi phục mật khẩu đã được gửi đến ${email}`,
    });
    setTimeout(() => onBack(), 2000);
  };

  const handlePhoneReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số điện thoại",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "SMS đã được gửi",
      description: `Mã khôi phục đã được gửi đến ${phone}`,
    });
    setTimeout(() => onBack(), 2000);
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit -ml-2"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Button>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Quên mật khẩu</h2>
        <p className="text-sm text-muted-foreground">Nhập thông tin để khôi phục mật khẩu</p>
      </div>
      
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="phone" className="gap-2">
            <Phone className="w-4 h-4" />
            Số điện thoại
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="email" className="mt-0">
          <form onSubmit={handleEmailReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Chúng tôi sẽ gửi link khôi phục mật khẩu đến email của bạn
              </p>
            </div>
            <Button type="submit" className="w-full">
              Gửi link khôi phục
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="phone" className="mt-0">
          <form onSubmit={handlePhoneReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-phone">Số điện thoại</Label>
              <Input
                id="forgot-phone"
                type="tel"
                placeholder="0123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Chúng tôi sẽ gửi mã khôi phục qua SMS đến số của bạn
              </p>
            </div>
            <Button type="submit" className="w-full">
              Gửi mã khôi phục
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ForgotPasswordForm;
