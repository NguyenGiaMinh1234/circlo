import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PartSelectorProps {
  parts: string[];
  selectedPart: string | null;
  onPartSelect: (part: string) => void;
}

export function PartSelector({ parts, selectedPart, onPartSelect }: PartSelectorProps) {
  if (parts.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Click vào mô hình 3D để chọn bộ phận
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 text-foreground">Bộ phận</h3>
      <ScrollArea className="h-[150px]">
        <div className="space-y-2">
          {parts.map((part) => (
            <Button
              key={part}
              variant={selectedPart === part ? "default" : "outline"}
              className="w-full justify-start text-xs"
              size="sm"
              onClick={() => onPartSelect(part)}
            >
              {part}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
