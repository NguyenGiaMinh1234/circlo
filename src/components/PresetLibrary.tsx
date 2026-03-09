import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Minus, Plus, RotateCw, FlipHorizontal, FlipVertical } from "lucide-react";
import { useState, useEffect } from "react";

interface PresetLibraryProps {
  type: 'logo' | 'stamp' | 'pattern';
  selectedPart: string | null;
  onApply: (value: string) => void;
  onDragStart?: (type: 'logo' | 'stamp' | 'pattern', value: string) => void;
  onSizeChange?: (partName: string, size: number) => void;
  onRotationChange?: (partName: string, rotation: number) => void;
  onFlipChange?: (partName: string, flipX: boolean, flipY: boolean) => void;
  currentSize?: number;
  currentRotation?: number;
  currentFlipX?: boolean;
  currentFlipY?: boolean;
}

export default function PresetLibrary({ 
  type, 
  selectedPart, 
  onApply, 
  onDragStart, 
  onSizeChange, 
  onRotationChange,
  onFlipChange,
  currentSize = 0.5,
  currentRotation = 0,
  currentFlipX = false,
  currentFlipY = false
}: PresetLibraryProps) {
  const [localSize, setLocalSize] = useState(currentSize);
  const [localRotation, setLocalRotation] = useState(currentRotation);
  const [localFlipX, setLocalFlipX] = useState(currentFlipX);
  const [localFlipY, setLocalFlipY] = useState(currentFlipY);
  
  // Update local state when props change
  useEffect(() => {
    setLocalSize(currentSize);
  }, [currentSize]);
  
  useEffect(() => {
    setLocalRotation(currentRotation);
  }, [currentRotation]);
  
  useEffect(() => {
    setLocalFlipX(currentFlipX);
  }, [currentFlipX]);
  
  useEffect(() => {
    setLocalFlipY(currentFlipY);
  }, [currentFlipY]);
  // Tự động load tất cả file SVG/PNG/JPG trong assets/logos bằng Vite glob
  const logoModules = import.meta.glob("@/assets/logos/*.{svg,png,jpg,jpeg}", { eager: true, query: "?url", import: "default" });
  const logosAll = Object.values(logoModules).map(v => String(v)) as string[];
  const logos = logosAll.filter((v) => v.includes("sample-"));

  const stampModules = import.meta.glob("@/assets/stamps/*.{svg,png,jpg,jpeg}", { eager: true, query: "?url", import: "default" });
  const stampsAll = Object.values(stampModules).map(v => String(v)) as string[];
  const stamps = stampsAll.filter((v) => v.includes("sample-"));

  const patternModules = import.meta.glob("@/assets/patterns/*.{svg,png,jpg,jpeg}", { eager: true, query: "?url", import: "default" });
  const patternsAll = Object.values(patternModules).map(v => String(v)) as string[];
  const patterns = patternsAll.filter((v) => v.includes("sample-"));

  const handleClick = (value: string) => {
    if (!selectedPart) {
      // toast.error("Vui lòng chọn bộ phận trước", {
      //   description: "Click vào mô hình 3D để chọn bộ phận, hoặc kéo thả trực tiếp lên 3D"
      // });
      return;
    }
    onApply(value);
    const typeName = type === 'logo' ? 'logo' : type === 'stamp' ? 'tem' : 'họa tiết';
    // toast.success(`✨ Đã áp dụng ${typeName} cho ${selectedPart}`);
  };

  const handleDragStart = (value: string) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('value', value);
    // Also set as text for compatibility
    e.dataTransfer.setData('text/plain', value);
    if (onDragStart) {
      onDragStart(type, value);
    }
  };

  const handleDragEnd = () => {
    // Drag ended
  };

  const getTitle = () => {
    switch (type) {
      case 'logo':
        return 'Chọn logo';
      case 'stamp':
        return 'Chọn tem';
      case 'pattern':
        return 'Chọn họa tiết';
    }
  };

  const getItems = () => {
    switch (type) {
      case 'logo':
        return logos;
      case 'stamp':
        return stamps;
      case 'pattern':
        return patterns;
    }
  };

  const items = getItems();

  const effectiveItems = items.length > 0
    ? items
    : type === 'logo'
      ? logosAll
      : type === 'stamp'
        ? stampsAll
        : patternsAll;

  if (effectiveItems.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">{getTitle()}</h3>
        <p className="text-xs text-muted-foreground text-center py-4">
          Copy {type} PNG files to src/assets/{type}s/ to enable this feature
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{getTitle()}</h3>
        <span className="text-xs text-primary font-medium">🖱️ Kéo thả hoặc click</span>
      </div>
      
      <div className="mb-2 p-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20">
        <p className="text-xs text-muted-foreground">
          💡 <span className="font-medium">Mẹo:</span> Click để áp dụng (cần chọn bộ phận), hoặc <span className="font-bold text-primary">KÉO THẢ</span> trực tiếp lên 3D (tự động detect bộ phận)
        </p>
        {!selectedPart && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Chưa chọn bộ phận - Kéo thả lên 3D để tự động áp dụng
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {effectiveItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleClick(item)}
            draggable
            onDragStart={handleDragStart(item)}
            onDragEnd={handleDragEnd}
            className="aspect-square rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-110 hover:shadow-xl bg-background p-2 active:scale-95 cursor-move group"
          >
            <img 
              src={item} 
              alt={`${type} ${index + 1}`} 
              className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
            />
          </button>
        ))}
      </div>

      {/* Texture Controls - Only show if part is selected and has texture */}
      {selectedPart && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {/* Size Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground">Kích thước</label>
              <span className="text-xs text-muted-foreground">{Math.round(localSize * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const newSize = Math.max(0.1, localSize - 0.1);
                  setLocalSize(newSize);
                  if (onSizeChange && selectedPart) {
                    onSizeChange(selectedPart, newSize);
                  }
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Slider
                value={[localSize]}
                onValueChange={([value]) => {
                  setLocalSize(value);
                  if (onSizeChange && selectedPart) {
                    onSizeChange(selectedPart, value);
                  }
                }}
                min={0.1}
                max={2.0}
                step={0.1}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const newSize = Math.min(2.0, localSize + 0.1);
                  setLocalSize(newSize);
                  if (onSizeChange && selectedPart) {
                    onSizeChange(selectedPart, newSize);
                  }
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Rotation Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground">Xoay</label>
              <span className="text-xs text-muted-foreground">{Math.round((localRotation * 180) / Math.PI)}°</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const newRotation = localRotation - (Math.PI / 4); // Rotate 45 degrees
                  setLocalRotation(newRotation);
                  if (onRotationChange && selectedPart) {
                    onRotationChange(selectedPart, newRotation);
                  }
                }}
              >
                <RotateCw className="h-3 w-3" />
              </Button>
              <Slider
                value={[localRotation]}
                onValueChange={([value]) => {
                  setLocalRotation(value);
                  if (onRotationChange && selectedPart) {
                    onRotationChange(selectedPart, value);
                  }
                }}
                min={0}
                max={Math.PI * 2}
                step={Math.PI / 180}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const newRotation = localRotation + (Math.PI / 4); // Rotate 45 degrees
                  setLocalRotation(newRotation);
                  if (onRotationChange && selectedPart) {
                    onRotationChange(selectedPart, newRotation);
                  }
                }}
              >
                <RotateCw className="h-3 w-3 rotate-180" />
              </Button>
            </div>
          </div>

          {/* Flip Controls */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">Đảo chiều</label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={localFlipX ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  const newFlipX = !localFlipX;
                  setLocalFlipX(newFlipX);
                  if (onFlipChange && selectedPart) {
                    onFlipChange(selectedPart, newFlipX, localFlipY);
                  }
                }}
              >
                <FlipHorizontal className="h-3 w-3 mr-1" />
                Ngang
              </Button>
              <Button
                size="sm"
                variant={localFlipY ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  const newFlipY = !localFlipY;
                  setLocalFlipY(newFlipY);
                  if (onFlipChange && selectedPart) {
                    onFlipChange(selectedPart, localFlipX, newFlipY);
                  }
                }}
              >
                <FlipVertical className="h-3 w-3 mr-1" />
                Dọc
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}