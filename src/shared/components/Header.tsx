import { Menu, X, LogOut, User, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import logoImg from "../../../Logo/LOGO-01.png";
import brandBgImg from "@/assets/backgrounds/nenweb-01.png";
import { ROUTES } from "@/lib/routes";

interface HeaderProps {
  compact?: boolean;
}

const Header = ({ compact = false }: HeaderProps = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut, isAdmin } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isDesign3DPage = location.pathname === ROUTES.DESIGN_3D;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      });
      navigate("/");
    }
  };

  const scrollToSection = (id: string) => {
    if (window.location.pathname !== ROUTES.HOME) {
      if (id === "products") {
        navigate(ROUTES.PRODUCTS);
      } else {
        navigate(ROUTES.HOME);
      }
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    return user.user_metadata?.full_name || user.email || "";
  };

  // Compact header for design-3d page
  if (compact || isDesign3DPage) {
    return (
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/35 shadow-[0_10px_30px_rgba(4,27,45,0.12)] backdrop-blur-lg"
        style={{
          backgroundImage: `linear-gradient(112deg,rgba(4,27,45,0.72)_0%,rgba(4,27,45,0.5)_26%,rgba(0,78,154,0.22)_48%,rgba(255,156,218,0.12)_72%,rgba(4,27,45,0.36)_100%), url(${brandBgImg})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center hover:opacity-80 transition-opacity duration-300"
              >
                <img
                  src={logoImg}
                  alt="Circlo Logo"
                  className="logo-3d-pop h-28 w-28 shrink-0 scale-[1.45] object-contain transition-transform duration-300 hover:scale-[1.5] md:h-32 md:w-32 md:scale-[1.5] md:hover:scale-[1.55]"
                />
              </Link>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-white hover:bg-white/20 text-xs tracking-wide rounded-xl"
            >
              ← Trang chủ
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-primary/10 shadow-sm backdrop-blur-md bg-[linear-gradient(90deg,rgba(4,27,45,0.08),rgba(0,78,154,0.1),rgba(66,140,212,0.1),rgba(255,156,218,0.09),rgba(234,68,146,0.08))]">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center hover:opacity-80 transition-opacity duration-300"
            >
              <img
                src={logoImg}
                alt="Circlo Logo"
                className="logo-3d-pop h-28 w-28 shrink-0 scale-[1.45] object-contain transition-transform duration-300 hover:scale-[1.5] md:h-32 md:w-32 md:scale-[1.5] md:hover:scale-[1.55]"
              />
            </button>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("products")}
              className="text-xs font-bold tracking-[0.2em] text-white hover:text-white/80 transition-colors uppercase"
            >
              Sản phẩm
            </button>
            <button
              onClick={() => navigateTo(ROUTES.DESIGN_3D)}
              className="text-xs font-bold tracking-[0.2em] text-white hover:text-white/80 transition-colors uppercase"
            >
              Thiết kế 3D
            </button>
            <button
              onClick={() => navigateTo(ROUTES.BOOKING)}
              className="text-xs font-bold tracking-[0.2em] text-white hover:text-white/80 transition-colors uppercase"
            >
              Đặt thiết kế
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo(ROUTES.BOOKING_HISTORY)}
              className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl"
            >
              Lịch sử đặt
            </Button>

            {loading ? (
              <Skeleton className="h-9 w-24 bg-primary/10" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {isAdmin() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateTo(ROUTES.ADMIN)}
                    className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Shield className="h-3.5 w-3.5 mr-2" />
                    Admin
                  </Button>
                )}
                <button
                  onClick={() => navigateTo(ROUTES.PROFILE)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/25 rounded-xl hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-primary tracking-wide max-w-[150px] truncate">
                    {getUserDisplayName()}
                  </span>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateTo(ROUTES.LOGIN)}
                  className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground tracking-[0.2em] rounded-xl"
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigateTo(ROUTES.REGISTER)}
                  className="bg-[linear-gradient(90deg,rgba(4,27,45,0.96),rgba(0,78,154,0.94),rgba(66,140,212,0.88),rgba(234,68,146,0.9))] text-white hover:opacity-90 rounded-xl"
                >
                  Đăng ký
                </Button>
              </div>
            )}
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary hover:bg-primary/10 rounded-xl"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mt-6 pb-4 space-y-4 border-t border-primary/20 pt-6">
            <button
              onClick={() => scrollToSection("products")}
              className="block text-sm font-light tracking-[0.2em] hover:text-primary/75 transition-colors uppercase w-full text-left text-primary"
            >
              Sản phẩm
            </button>
            <button
              onClick={() => navigateTo(ROUTES.DESIGN_3D)}
              className="block text-sm font-light tracking-[0.2em] hover:text-primary/75 transition-colors uppercase w-full text-left text-primary"
            >
              Thiết kế 3D
            </button>
            <button
              onClick={() => navigateTo(ROUTES.BOOKING)}
              className="block text-sm font-light tracking-[0.2em] hover:text-primary/75 transition-colors uppercase w-full text-left text-primary"
            >
              Đặt thiết kế
            </button>

            {loading ? (
              <Skeleton className="h-9 w-full bg-primary/10" />
            ) : user ? (
              <div className="space-y-3 pt-3 border-t border-primary/10">
                <button
                  onClick={() => navigateTo(ROUTES.PROFILE)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/25 rounded-xl hover:bg-primary/20 transition-colors w-full"
                >
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary truncate">
                    {getUserDisplayName()}
                  </span>
                </button>
                {isAdmin() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateTo(ROUTES.ADMIN)}
                    className="w-full border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateTo(ROUTES.LOGIN)}
                  className="w-full border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl"
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigateTo(ROUTES.REGISTER)}
                  className="w-full bg-[linear-gradient(90deg,rgba(4,27,45,0.96),rgba(0,78,154,0.94),rgba(66,140,212,0.88),rgba(234,68,146,0.9))] text-white hover:opacity-90 rounded-xl"
                >
                  Đăng ký
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
