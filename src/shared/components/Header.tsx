import { Menu, X, LogOut, User, SlidersHorizontal, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import logoImg from "@/assets/logo.png";

const categories = [
  { id: "bags", label: "Túi & Balo" },
  { id: "accessories", label: "Phụ Kiện" },
  { id: "decor", label: "Trang Trí" },
];

interface HeaderProps {
  compact?: boolean;
}

const Header = ({ compact = false }: HeaderProps = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut, isAdmin, roles } = useAuthContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const isDesign3DPage = location.pathname === "/design-3d";

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
    if (window.location.pathname !== "/") {
      navigate(`/#${id}`);
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

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
    window.dispatchEvent(
      new CustomEvent("categoryFilterChange", {
        detail: selectedCategories.includes(categoryId)
          ? selectedCategories.filter((id) => id !== categoryId)
          : [...selectedCategories, categoryId],
      })
    );
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    return user.user_metadata?.full_name || user.email || "";
  };

  // Compact header for design-3d page
  if (compact || isDesign3DPage) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/35 bg-[linear-gradient(90deg,rgba(4,27,45,0.16),rgba(0,78,154,0.14),rgba(66,140,212,0.14),rgba(255,156,218,0.14),rgba(234,68,146,0.16))] shadow-[0_10px_30px_rgba(4,27,45,0.12)] backdrop-blur-lg supports-[backdrop-filter]:bg-[linear-gradient(90deg,rgba(4,27,45,0.12),rgba(0,78,154,0.11),rgba(66,140,212,0.12),rgba(255,156,218,0.11),rgba(234,68,146,0.12))]">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-300"
              >
                <img
                  src={logoImg}
                  alt="Circlo Logo"
                  className="logo-3d-pop h-28 w-28 object-contain transition-transform duration-300 hover:scale-105 md:h-32 md:w-32"
                />
                <h1 className="logo-text-3d text-4xl md:text-5xl font-extrabold tracking-[0.85em] uppercase transition-transform duration-300 hover:scale-[1.03]">
                  CIRCLO
                </h1>
              </Link>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-primary hover:bg-white/35 text-xs tracking-wide rounded-xl"
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
              className="flex items-center gap-4 hover:opacity-80 transition-opacity duration-300"
            >
              <img
                src={logoImg}
                alt="Circlo Logo"
                className="logo-3d-pop h-28 w-28 object-contain transition-transform duration-300 hover:scale-105 md:h-32 md:w-32"
              />
              <h1 className="logo-text-3d text-4xl md:text-5xl font-extrabold tracking-[0.85em] uppercase transition-transform duration-300 hover:scale-[1.03]">
                CIRCLO
              </h1>
            </button>

            {/* Filter Button */}
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:bg-primary/10 relative rounded-xl"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                  {selectedCategories.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                      {selectedCategories.length}
                    </span>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-background border-t-2">
                <DrawerHeader>
                  <DrawerTitle className="text-2xl font-bold tracking-wider uppercase">
                    Lọc Sản Phẩm
                  </DrawerTitle>
                </DrawerHeader>
                <div className="px-6 pb-8">
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-3 py-2"
                      >
                        <Checkbox
                          id={category.id}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                          className="h-5 w-5"
                        />
                        <label
                          htmlFor={category.id}
                          className="text-lg font-medium tracking-wide cursor-pointer"
                        >
                          {category.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedCategories.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategories([]);
                        window.dispatchEvent(
                          new CustomEvent("categoryFilterChange", {
                            detail: [],
                          })
                        );
                      }}
                      className="w-full mt-6"
                    >
                      Xóa Bộ Lọc
                    </Button>
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("products")}
              className="text-xs font-light tracking-[0.2em] hover:text-primary/75 transition-colors uppercase text-primary"
            >
              Sản phẩm
            </button>
            <button
              onClick={() => navigateTo("/design-3d")}
              className="text-xs font-light tracking-[0.2em] hover:text-primary/75 transition-colors uppercase text-primary"
            >
              Thiết kế 3D
            </button>
            <button
              onClick={() => navigateTo("/booking")}
              className="text-xs font-light tracking-[0.2em] hover:text-primary/75 transition-colors uppercase text-primary"
            >
              Đặt thiết kế
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo("/booking/history")}
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
                    onClick={() => navigateTo("/admin")}
                    className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Shield className="h-3.5 w-3.5 mr-2" />
                    Admin
                  </Button>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/25 rounded-xl">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-primary tracking-wide max-w-[150px] truncate">
                    {getUserDisplayName()}
                  </span>
                </div>
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
                  onClick={() => navigateTo("/auth")}
                  className="border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground tracking-[0.2em] rounded-xl"
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigateTo("/auth?tab=register")}
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
              onClick={() => navigateTo("/design-3d")}
              className="block text-sm font-light tracking-[0.2em] hover:text-primary/75 transition-colors uppercase w-full text-left text-primary"
            >
              Thiết kế 3D
            </button>
            <button
              onClick={() => navigateTo("/booking")}
              className="block text-sm font-light tracking-[0.2em] hover:text-primary/75 transition-colors uppercase w-full text-left text-primary"
            >
              Đặt thiết kế
            </button>

            {loading ? (
              <Skeleton className="h-9 w-full bg-primary/10" />
            ) : user ? (
              <div className="space-y-3 pt-3 border-t border-primary/10">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/25 rounded-xl">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary truncate">
                    {getUserDisplayName()}
                  </span>
                </div>
                {isAdmin() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateTo("/admin")}
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
                  onClick={() => navigateTo("/auth")}
                  className="w-full border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl"
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigateTo("/auth?tab=register")}
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
