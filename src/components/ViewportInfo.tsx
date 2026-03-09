import { Shirt, Info } from "lucide-react";

interface ViewportInfoProps {
  productName: string;
  selectedPart: string | null;
  partName: string;
}

export default function ViewportInfo({ productName, selectedPart, partName }: ViewportInfoProps) {
  return (
    <div className="absolute top-[3rem] left-[2rem] z-10 space-y-3">
      {/* Product Info */}
      <div className="bg-card/95 backdrop-blur-lg border-2 border-border/50 rounded-xl p-4 shadow-2xl max-w-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shirt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{productName}</h3>
            <p className="text-xs text-muted-foreground">3D Design Studio</p>
          </div>
        </div>
        {selectedPart && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Đang chỉnh: <span className="font-semibold text-foreground">{partName}</span></span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-lg border border-primary/20 rounded-xl p-3 shadow-lg max-w-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-medium text-primary">Cách sử dụng:</p>
            <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Kéo chuột để xoay</li>
              <li>Cuộn để zoom</li>
              <li>Click bộ phận để chọn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}



