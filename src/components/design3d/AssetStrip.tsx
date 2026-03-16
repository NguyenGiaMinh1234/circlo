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
  const handleAssetDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    type: 'logo' | 'stamp' | 'pattern',
    url: string
  ) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('type', type);
    event.dataTransfer.setData('value', url);
    event.dataTransfer.setData('application/x-design-type', type);
    event.dataTransfer.setData('application/x-design-value', url);
    event.dataTransfer.setData('application/json', JSON.stringify({ type, value: url }));
    event.dataTransfer.setData('text/plain', url);
  };

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
            handleAssetDragStart(e, dragType, url);
          }}
        >
          <img src={url} alt="" draggable={false} className="h-full w-full rounded object-contain" />
        </Button>
      ))}
    </div>
  );
}
