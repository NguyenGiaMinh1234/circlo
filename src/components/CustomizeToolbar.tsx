import { Button } from "@/components/ui/button";
import { 
  Move, 
  Palette,
  Image, 
  Stamp, 
  Grid3x3
} from "lucide-react";

interface CustomizeToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export default function CustomizeToolbar({ activeTool, onToolChange }: CustomizeToolbarProps) {
  const tools = [
    { id: 'move', icon: Move, label: 'Di chuyển', description: 'Xoay & zoom 3D' },
    { id: 'color', icon: Palette, label: 'Màu sắc', description: 'Kéo thả màu' },
    { id: 'logo', icon: Image, label: 'Logo', description: 'Chọn logo' },
    { id: 'stamp', icon: Stamp, label: 'Tem', description: 'Chọn tem' },
    { id: 'pattern', icon: Grid3x3, label: 'Họa tiết', description: 'Chọn họa tiết' },
  ];

  return (
    <div className="bg-card/50 border-b border-border px-4 py-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(tool.id)}
            className={`flex-col h-auto py-3 min-w-[70px] transition-all ${
              activeTool === tool.id 
                ? "shadow-md scale-105" 
                : "hover:shadow-sm hover:scale-102"
            }`}
            title={`${tool.label} - ${tool.description}`}
          >
            <tool.icon className="h-5 w-5 mb-1.5" />
            <span className="text-[10px] font-medium">{tool.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

