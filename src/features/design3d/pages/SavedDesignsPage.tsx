import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2, Eye, Palette } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedDesign {
  id: string;
  name: string;
  product_id: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

const SavedDesignsPage = () => {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDesigns = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("saved_designs")
        .select("id, name, product_id, thumbnail_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      console.error("Error fetching designs:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (user) fetchDesigns();
  }, [user, authLoading, navigate, fetchDesigns]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("saved_designs").delete().eq("id", id);
      if (error) throw error;
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      toast.success("Đã xóa thiết kế");
    } catch {
      toast.error("Không thể xóa thiết kế");
    }
  };

  const handleLoad = (design: SavedDesign) => {
    navigate(`${ROUTES.DESIGN_3D}?product=${design.product_id}&load=${design.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen text-white">
      <div className="page-brand-bg flex-1">
        <Header />

        <main className="flex-1 px-6 pt-44 pb-20">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-semibold mb-4 text-center text-white tracking-wide uppercase">
              Bộ sưu tập thiết kế
            </h1>
            <p className="text-center text-white/60 mb-12 text-sm">
              Các thiết kế 3D bạn đã lưu trước đó
            </p>

            {loading || authLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : designs.length === 0 ? (
              <div className="text-center py-20">
                <Palette className="h-16 w-16 mx-auto text-white/30 mb-4" />
                <p className="text-white/70 italic mb-6">
                  Bạn chưa có thiết kế nào được lưu.
                </p>
                <Button
                  onClick={() => navigate(ROUTES.DESIGN_3D)}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                >
                  Bắt đầu thiết kế
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {designs.map((design) => (
                  <Card
                    key={design.id}
                    className="bg-white/75 border border-primary/15 rounded-2xl shadow-[0_12px_36px_rgba(55,74,90,0.12)] hover:shadow-[0_18px_42px_rgba(55,74,90,0.18)] transition-all duration-300 backdrop-blur-sm overflow-hidden group"
                  >
                    <div className="relative w-full h-48 bg-muted/30 overflow-hidden">
                      {design.thumbnail_url ? (
                        <img
                          src={design.thumbnail_url}
                          alt={design.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Palette className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-primary truncate">
                          {design.name}
                        </h3>
                        <p className="text-xs text-primary/50 mt-1">
                          {new Date(design.created_at).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 text-xs"
                          onClick={() => handleLoad(design)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Mở thiết kế
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="px-3">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa thiết kế?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác. Thiết kế sẽ bị xóa vĩnh viễn.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(design.id)}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default SavedDesignsPage;
