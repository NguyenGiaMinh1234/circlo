import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface DebugPanelProps {
  discoveredParts: string[];
  selectedPart: string | null;
  partColors: Record<string, string>;
  partTextures: Record<string, string>;
}

export function DebugPanel({ 
  discoveredParts, 
  selectedPart, 
  partColors, 
  partTextures 
}: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <Card className="p-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(true)}
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          Hiện Debug Info
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Debug Info</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(false)}
        >
          <EyeOff className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-3 text-xs">
        <div>
          <p className="font-semibold mb-1">Tổng số bộ phận:</p>
          <Badge variant="secondary">{discoveredParts.length} parts</Badge>
        </div>
        
        {selectedPart && (
          <div>
            <p className="font-semibold mb-1">Đang chọn:</p>
            <Badge variant="default">{selectedPart}</Badge>
          </div>
        )}
        
        <div>
          <p className="font-semibold mb-1">Đã tùy chỉnh màu:</p>
          <Badge variant="outline">{Object.keys(partColors).length} parts</Badge>
        </div>
        
        <div>
          <p className="font-semibold mb-1">Đã áp dụng họa tiết:</p>
          <Badge variant="outline">{Object.keys(partTextures).length} parts</Badge>
        </div>
        
        <div>
          <p className="font-semibold mb-2">Danh sách bộ phận:</p>
          <ScrollArea className="h-[120px] rounded border border-border p-2 bg-muted/30">
            {discoveredParts.map((part, index) => (
              <div 
                key={part} 
                className={`text-[10px] py-1 px-2 mb-1 rounded ${
                  part === selectedPart 
                    ? 'bg-primary text-primary-foreground font-semibold' 
                    : 'bg-muted/50'
                }`}
              >
                {index + 1}. {part}
                {partColors[part] && (
                  <span 
                    className="inline-block w-3 h-3 ml-2 rounded border border-border"
                    style={{ backgroundColor: partColors[part] }}
                  />
                )}
                {partTextures[part] && (
                  <span className="ml-1 text-accent">📐</span>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}
