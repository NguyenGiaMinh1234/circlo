import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Move,
  Droplet,
  Image,
  Stamp,
  Brush,
  Waves,
  Eraser,
} from "lucide-react";

export type DesignTool = "move" | "color" | "logo" | "stamp" | "brush" | "pattern" | "eraser";

const tools: Array<{ tool: DesignTool; label: string; Icon: typeof Move }> = [
  { tool: "move", label: "Move", Icon: Move },
  { tool: "color", label: "Color", Icon: Droplet },
  { tool: "logo", label: "Logo", Icon: Image },
  { tool: "stamp", label: "Stamp", Icon: Stamp },
  { tool: "brush", label: "Brush", Icon: Brush },
  { tool: "pattern", label: "Pattern", Icon: Waves },
  { tool: "eraser", label: "Eraser", Icon: Eraser },
];

export function BottomToolbar({
  activeTool,
  onToolChange,
}: {
  activeTool: DesignTool;
  onToolChange: (tool: DesignTool) => void;
}) {
  return (
    <div className="fixed bottom-2 left-1/2 z-40 -translate-x-1/2">
      <div className="mx-auto flex w-fit items-center justify-center gap-0.5 rounded-full border border-border/60 bg-muted/80 px-0.5 py-0.5 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-muted/60">
        {tools.map(({ tool, label, Icon }) => (
          <Button
            key={tool}
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onToolChange(tool)}
            aria-label={label}
            className={cn(
              "relative h-7 w-8 rounded-full transition-colors",
              activeTool === tool
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground/70 hover:bg-background/30 hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>
    </div>
  );
}
