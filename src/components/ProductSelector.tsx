import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { products, type Product } from "@/data/products";

interface ProductSelectorProps {
  selectedProduct: string;
  onProductChange: (product: Product) => void;
}

export function ProductSelector({ selectedProduct, onProductChange }: ProductSelectorProps) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 text-foreground">Chọn sản phẩm</h3>
      <div className="grid grid-cols-2 gap-2">
        {products.map((product) => (
          <Button
            key={product.id}
            variant={selectedProduct === product.id ? "default" : "outline"}
            className="h-auto py-3 flex flex-col items-center gap-2"
            onClick={() => onProductChange(product)}
          >
            <span className="flex h-5 w-5 items-center justify-center">{product.icon}</span>
            <span className="text-xs">{product.name}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}
