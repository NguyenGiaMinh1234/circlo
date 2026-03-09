import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const basicColors = [
  { color: "#FF0000", name: "Đỏ" },
  { color: "#FF7F00", name: "Cam" },
  { color: "#FFFF00", name: "Vàng" },
  { color: "#00FF00", name: "Xanh lá" },
  { color: "#0000FF", name: "Xanh dương" },
  { color: "#4B0082", name: "Tím đậm" },
  { color: "#9400D3", name: "Tím" },
  { color: "#FFFFFF", name: "Trắng" },
  { color: "#000000", name: "Đen" },
  { color: "#808080", name: "Xám" },
  { color: "#FFC0CB", name: "Hồng" },
  { color: "#FFB6C1", name: "Hồng nhạt" },
  { color: "#87CEEB", name: "Xanh nhạt" },
  { color: "#98FB98", name: "Xanh lá nhạt" },
  { color: "#DDA0DD", name: "Tím nhạt" },
];

interface ColorPickerProps {
  selectedPart: string | null;
  partColors: Record<string, string>;
  onColorApply: (color: string) => void;
  onDragStart: (color: string) => void;
}

export function ColorPicker({ selectedPart, partColors, onColorApply, onDragStart }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState("#FF0000");

  const handleColorDragStart = (color: string, name: string) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("type", "color");
    e.dataTransfer.setData("value", color);
    onDragStart(color);
  };

  const handleDragEnd = () => {
    // Drag ended
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 text-foreground">Màu sắc</h3>
      
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic" className="text-xs">Cơ bản</TabsTrigger>
          <TabsTrigger value="custom" className="text-xs">Tùy chỉnh</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-3">
          <div className="mb-2 p-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium">Mẹo:</span> Click để áp dụng, hoặc <span className="font-bold text-primary">KÉO THẢ</span> trực tiếp lên 3D
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {basicColors.map(({ color, name }) => (
              <div
                key={color}
                draggable
                onDragStart={handleColorDragStart(color, name)}
                onDragEnd={handleDragEnd}
                className="group relative aspect-square rounded-xl border-2 transition-all hover:scale-110 hover:shadow-lg cursor-move active:scale-95 active:cursor-grabbing"
                style={{
                  backgroundColor: color,
                  borderColor: (selectedPart && partColors[selectedPart] === color)
                    ? "hsl(var(--primary))"
                    : "hsl(var(--border))",
                }}
                onClick={() => selectedPart && onColorApply(color)}
                title={`${name} - Kéo để áp dụng`}
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {(selectedPart && partColors[selectedPart] === color) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full shadow-lg" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="color-input" className="text-xs">Chọn màu</Label>
            <div className="flex gap-2">
              <Input
                id="color-input"
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
              <div
                draggable
                onDragStart={handleColorDragStart(customColor, "Tùy chỉnh")}
                onDragEnd={handleDragEnd}
                className="w-10 h-10 rounded-xl border-2 border-border cursor-grab active:cursor-grabbing flex-shrink-0 hover:scale-110 hover:shadow-lg transition-all"
                style={{ backgroundColor: customColor }}
                title="Kéo màu này vào mô hình"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => selectedPart && onColorApply(customColor)}
            disabled={!selectedPart}
          >
            Áp dụng màu
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
