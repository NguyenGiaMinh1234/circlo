import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Star, Heart, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sample patterns using data URLs
const samplePatterns = [
  { id: "dots", name: "Chấm", icon: <Circle className="w-4 h-4" /> },
  { id: "stars", name: "Sao", icon: <Star className="w-4 h-4" /> },
  { id: "hearts", name: "Trái tim", icon: <Heart className="w-4 h-4" /> },
];

interface PatternLibraryProps {
  selectedPart: string | null;
  onPatternApply: (pattern: string) => void;
  onDragStart: (pattern: string) => void;
}

export function PatternLibrary({ selectedPart, onPatternApply, onDragStart }: PatternLibraryProps) {
  const handlePatternDragStart = (patternId: string) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", patternId);
    onDragStart(patternId);
    console.log('Pattern drag started:', patternId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (selectedPart) {
          onPatternApply(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 text-foreground">Họa tiết</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="pattern-upload" className="text-xs mb-2 block">
            Tải lên họa tiết
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="pattern-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="text-xs"
              disabled={!selectedPart}
            />
            <Button size="icon" variant="outline" disabled={!selectedPart}>
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-xs mb-2 block">Họa tiết mẫu</Label>
          <ScrollArea className="h-[120px]">
            <div className="grid grid-cols-3 gap-2">
              {samplePatterns.map((pattern) => (
                <Button
                  key={pattern.id}
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-1"
                  draggable
                  onDragStart={handlePatternDragStart(pattern.id)}
                  onClick={() => selectedPart && onPatternApply(pattern.id)}
                  disabled={!selectedPart}
                >
                  {pattern.icon}
                  <span className="text-[10px]">{pattern.name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <p className="text-xs text-muted-foreground">
          {selectedPart 
            ? "Kéo thả hoặc click để áp dụng họa tiết" 
            : "Chọn bộ phận trước khi áp dụng họa tiết"}
        </p>
      </div>
    </Card>
  );
}
