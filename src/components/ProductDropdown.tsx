import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { products, type Product } from "@/data/products";

interface ProductDropdownProps {
  selectedProduct: Product;
  onProductChange: (product: Product) => void;
  className?: string;
}

export function ProductDropdown({ selectedProduct, onProductChange, className }: ProductDropdownProps) {
  const [open, setOpen] = useState(false);

  const currentProduct = products.find(p => p.id === selectedProduct.id) || products[0];

  return (
    <div className={cn("z-[50]", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-12 px-4 gap-2 border-white/35 bg-[linear-gradient(90deg,rgba(4,27,45,0.12),rgba(0,78,154,0.14),rgba(66,140,212,0.16),rgba(255,156,218,0.14),rgba(234,68,146,0.12))] shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-[linear-gradient(90deg,rgba(4,27,45,0.09),rgba(0,78,154,0.1),rgba(66,140,212,0.12),rgba(255,156,218,0.1),rgba(234,68,146,0.09))]",
              "hover:bg-white/75 hover:text-accent-foreground",
              "transition-all"
            )}
          >
            <div className="flex items-center gap-2">
              {currentProduct.icon}
              <span className="font-medium">{currentProduct.name}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={10}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="w-56 border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,247,255,0.84),rgba(255,241,248,0.8))] shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(240,247,255,0.72),rgba(255,241,248,0.68))]"
        >
          {products.map((product) => (
            <DropdownMenuItem
              key={product.id}
              onClick={() => {
                onProductChange(product);
                setOpen(false);
              }}
              className={cn(
                "cursor-pointer",
                selectedProduct.id === product.id && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                {product.icon}
                <span>{product.name}</span>
                {selectedProduct.id === product.id && (
                  <span className="ml-auto text-xs text-muted-foreground">✓</span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

