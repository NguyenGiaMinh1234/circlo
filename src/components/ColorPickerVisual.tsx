import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ColorPickerVisualProps {
  partColors: Record<string, string>;
}

export function ColorPickerVisual({ partColors }: ColorPickerVisualProps) {
  const entries = Object.entries(partColors);
  
  if (entries.length === 0) {
    return null;
  }
  
  return (
    <Card className="p-4 bg-card/80 backdrop-blur-sm">
      <h3 className="text-sm font-semibold mb-3">Màu đã áp dụng</h3>
      <div className="space-y-2">
        {entries.map(([partName, color]) => (
          <div key={partName} className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded border-2 border-border flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <Badge variant="secondary" className="text-xs flex-1">
              {partName}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
