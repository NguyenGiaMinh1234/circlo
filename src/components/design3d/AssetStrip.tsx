import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AssetStrip({
  items,
  selected,
  onSelect,
  dragType,
}: {
  items: string[];
  selected?: string | null;
  onSelect: (value: string) => void;
  dragType?: 'logo' | 'stamp' | 'pattern';
}) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto py-2">
      {items.map((url) => (
        <Button
          key={url}
          type="button"
          variant={selected === url ? "default" : "outline"}
          size="icon"
          className={cn("h-14 w-14 shrink-0 p-1 bg-white")}
          onClick={() => onSelect(url)}
          draggable={!!dragType}
          onDragStart={(e) => {
            if (!dragType) return;
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('type', dragType);
            e.dataTransfer.setData('value', url);
            e.dataTransfer.setData('text/plain', url);
          }}
        >
          <img src={url} alt="" className="h-full w-full rounded object-contain" />
        </Button>
      ))}
    </div>
  );
}
