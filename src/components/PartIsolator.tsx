import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  EyeOff, 
  Focus, 
  Layers, 
  Move3D,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PartIsolatorProps {
  parts: string[];
  selectedPart: string | null;
  visibleParts: Record<string, boolean>;
  partOpacities: Record<string, number>;
  isolatedPart: string | null;
  onPartVisibilityChange: (partName: string, visible: boolean) => void;
  onPartOpacityChange: (partName: string, opacity: number) => void;
  onIsolatePart: (partName: string | null) => void;
  onFocusPart: (partName: string) => void;
  onResetAll: () => void;
}

export default function PartIsolator({
  parts,
  selectedPart,
  visibleParts,
  partOpacities,
  isolatedPart,
  onPartVisibilityChange,
  onPartOpacityChange,
  onIsolatePart,
  onFocusPart,
  onResetAll,
}: PartIsolatorProps) {
  const [showOpacitySlider, setShowOpacitySlider] = useState<string | null>(null);

  const handleToggleVisibility = useCallback((partName: string) => {
    const currentVisible = visibleParts[partName] !== false;
    onPartVisibilityChange(partName, !currentVisible);
  }, [visibleParts, onPartVisibilityChange]);

  const handleIsolate = useCallback((partName: string) => {
    if (isolatedPart === partName) {
      onIsolatePart(null);
    } else {
      onIsolatePart(partName);
    }
  }, [isolatedPart, onIsolatePart]);

  return (
    <Card className="bg-card/95 backdrop-blur-lg border-2 border-border/50 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Quản lý bộ phận</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onResetAll}
          className="h-7 px-2 text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      <ScrollArea className="h-[300px] pr-2">
        <div className="space-y-2">
          {parts.map((partName) => {
            const isVisible = visibleParts[partName] !== false;
            const opacity = partOpacities[partName] ?? 1;
            const isIsolated = isolatedPart === partName;
            const isSelected = selectedPart === partName;

            return (
              <div
                key={partName}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-300",
                  isSelected 
                    ? "bg-primary/10 border-primary/50" 
                    : "bg-muted/30 border-border/30 hover:bg-muted/50",
                  isIsolated && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleVisibility(partName)}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        isVisible 
                          ? "text-primary hover:bg-primary/10" 
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <span className="text-sm font-medium truncate">{partName}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => onFocusPart(partName)}
                      title="Focus vào bộ phận"
                    >
                      <Focus className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant={isIsolated ? "default" : "ghost"}
                      className={cn("h-7 w-7 p-0", isIsolated && "bg-primary")}
                      onClick={() => handleIsolate(partName)}
                      title={isIsolated ? "Bỏ cô lập" : "Cô lập bộ phận"}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => setShowOpacitySlider(
                        showOpacitySlider === partName ? null : partName
                      )}
                      title="Điều chỉnh độ trong suốt"
                    >
                      <Move3D className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Opacity Slider */}
                {showOpacitySlider === partName && (
                  <div className="mt-3 pt-3 border-t border-border/30 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20">
                        Độ mờ: {Math.round(opacity * 100)}%
                      </span>
                      <Slider
                        value={[opacity * 100]}
                        min={10}
                        max={100}
                        step={5}
                        onValueChange={([value]) => onPartOpacityChange(partName, value / 100)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {parts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Chưa phát hiện bộ phận nào</p>
        </div>
      )}
    </Card>
  );
}
