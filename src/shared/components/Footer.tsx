import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
const Footer = () => {
  return (
    <footer className="py-24 border-t border-primary/10 brand-surface-gradient">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          <div className="space-y-6">
            <h3 className="logo-text-3d text-5xl font-extrabold tracking-[0.24em] uppercase">CIRCLO</h3>
            <p className="text-sm text-primary/85 font-light leading-relaxed tracking-wide">
              Tạo nên những phụ kiện thời trang độc đáo, thể hiện phong cách riêng của bạn.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="font-light tracking-[0.3em] uppercase text-sm text-primary/85">Liên kết</h4>
            <ul className="space-y-4 text-sm text-primary/85 font-light">
              <li>
                <a href="#products" className="hover:text-primary transition-colors tracking-wide">
                  Sản phẩm
                </a>
              </li>
              <li>
                <a href="#design3d" className="hover:text-primary transition-colors tracking-wide">
                  Thiết kế 3D
                </a>
              </li>
              <li>
                <a href="#booking" className="hover:text-primary transition-colors tracking-wide">
                  Đặt thiết kế
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-light tracking-[0.3em] uppercase text-sm text-primary/85">Liên hệ</h4>
            <ul className="space-y-4 text-sm text-primary/85 font-light">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4" />
                <span className="tracking-wide">0355547936</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                <span className="tracking-wide">circlo.contact@gmail.com</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4" />
                <span className="tracking-wide">Cần Thơ, Việt Nam</span>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-light tracking-[0.3em] uppercase text-sm text-primary/85">Theo dõi</h4>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/circlo.2025/?igsh=aGQ0aXY4eDVsc2p2&utm_source=ig_contact_invite"
                className="w-10 h-10 rounded-full border border-border/30 flex items-center justify-center hover:border-primary hover:text-primary transition-all"
              >
                <Instagram className="h-4 w-4" />
              </a>

              <a
                href="https://www.facebook.com/share/17MwxFsQFE/?mibextid=wwXIfr"
                className="w-10 h-10 rounded-full border border-border/30 flex items-center justify-center hover:border-primary hover:text-primary transition-all"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@circlo4?_t=ZS-90JRzg7RwKw&_r=1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-border/30 flex items-center justify-center hover:border-primary hover:text-primary transition-all"
              >
                <FaTiktok className="h-4 w-4" />
              </a>

            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-primary/10 text-center text-sm text-primary/75 font-light tracking-wider">
          <p>&copy; 2026 CIRCLO. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
