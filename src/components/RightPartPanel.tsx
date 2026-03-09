import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RightPartPanelProps {
  parts: string[];
  selectedPart: string | null;
  onPartSelect: (part: string) => void;
  partColors?: Record<string, string>;
  partTextures?: Record<string, string>;
}

export function RightPartPanel({ 
  parts, 
  selectedPart, 
  onPartSelect,
  partColors = {},
  partTextures = {}
}: RightPartPanelProps) {
  if (parts.length === 0) {
    return (
      <div className="fixed top-4 right-4 z-40 w-64">
        <Card className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border-border">
          <p className="text-sm text-muted-foreground text-center">
            Click vào mô hình 3D để chọn bộ phận
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-64">
      <Card className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Bộ phận</h3>
          <Badge variant="secondary" className="text-xs">
            {parts.length}
          </Badge>
        </div>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {parts.map((part) => {
              const hasColor = !!partColors[part];
              const hasTexture = !!partTextures[part];
              const isSelected = selectedPart === part;

              return (
                <Button
                  key={part}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "w-full justify-start text-xs h-auto py-2 px-3 relative",
                    isSelected && "shadow-md"
                  )}
                  size="sm"
                  onClick={() => onPartSelect(part)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{part}</span>
                    <div className="flex items-center gap-1 ml-2">
                      {hasColor && (
                        <div 
                          className="w-3 h-3 rounded-full border border-border/50"
                          style={{ backgroundColor: partColors[part] }}
                        />
                      )}
                      {hasTexture && (
                        <span className="text-[10px] opacity-70">✨</span>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {selectedPart && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Đã chọn: <span className="font-medium text-foreground">{selectedPart}</span>
            </p>
            {partColors[selectedPart] && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Màu:</span>
                <div 
                  className="w-4 h-4 rounded border border-border/50"
                  style={{ backgroundColor: partColors[selectedPart] }}
                />
              </div>
            )}
            {partTextures[selectedPart] && (
              <div className="mt-1 text-xs text-muted-foreground">
                ✨ Đã áp dụng texture
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

