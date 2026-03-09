import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Move, 
  Palette,
  Image, 
  Stamp, 
  Grid3x3,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
}

const tools: Tool[] = [
  { id: 'move', icon: Move, label: 'Di chuyển', description: 'Xoay & zoom 3D' },
  { id: 'color', icon: Palette, label: 'Màu sắc', description: 'Kéo thả màu' },
  { id: 'logo', icon: Image, label: 'Logo', description: 'Chọn logo' },
  { id: 'stamp', icon: Stamp, label: 'Tem', description: 'Chọn tem' },
  { id: 'pattern', icon: Grid3x3, label: 'Họa tiết', description: 'Chọn họa tiết' },
];

interface VerticalToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  expandedTool?: string | null;
  onExpandedToolChange?: (tool: string | null) => void;
}

export default function VerticalToolbar({ 
  activeTool, 
  onToolChange,
  expandedTool,
  onExpandedToolChange 
}: VerticalToolbarProps) {
  const handleToolClick = (toolId: string) => {
    if (expandedTool === toolId) {
      onExpandedToolChange?.(null);
    } else {
      onToolChange(toolId);
      onExpandedToolChange?.(toolId);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <Card className="p-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border-border rounded-2xl">
          <div className="flex flex-row gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              const isExpanded = expandedTool === tool.id;

              return (
                <Tooltip key={tool.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToolClick(tool.id)}
                      onMouseEnter={() => {}} // Trigger tooltip on hover
                      className={cn(
                        "h-12 w-12 relative transition-all group",
                        isActive && "bg-primary text-primary-foreground shadow-md",
                        isExpanded && "bg-accent",
                        "hover:bg-accent"
                      )}
                    >
                      <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                      {isActive && (
                        <span className="absolute -right-1 -top-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-border shadow-lg z-50"
                  >
                    <div>
                      <p className="font-semibold">{tool.label}</p>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}

