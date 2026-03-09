import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { products, type Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductPreview3D } from "@/features/design3d/components/ProductPreview3D";

export default function ProductSelectPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>(products[0]?.id ?? "tshirt");

  const selectedProduct: Product = useMemo(() => {
    return products.find((p) => p.id === selectedId) ?? products[0];
  }, [selectedId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 w-full">
        <div className="h-full w-full bg-gradient-to-b from-muted/40 to-background">
          <ProductPreview3D modelPath={selectedProduct.modelPath} />
        </div>
      </div>

      <div className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-5xl mx-auto w-full px-4 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3">
            {products.map((p) => {
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "border bg-background rounded-md px-3 py-3 text-left",
                    "hover:bg-accent/50 transition-colors",
                    active ? "border-primary" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("text-muted-foreground", active && "text-foreground")}>{p.icon}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          className="w-full rounded-none h-14 text-base tracking-wider"
          onClick={() => navigate(`/design-3d?product=${encodeURIComponent(selectedProduct.id)}`)}
        >
          LET'S START
        </Button>
      </div>
    </div>
  );
}
