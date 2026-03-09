import { useMemo, useState, type DragEvent } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DesignTool } from "@/components/design3d/BottomToolbar";
import { AssetStrip } from "@/components/design3d/AssetStrip";
import type { DecalInstance } from "@/types/decal";

function useAssetUrls(kind: "logos" | "patterns" | "stamps") {
  return useMemo(() => {
    const glob = kind === "logos"
      ? import.meta.glob("../../assets/logos/*.{svg,png,jpg,jpeg}", { eager: true, query: "?url", import: "default" })
      : kind === "patterns"
        ? import.meta.glob("../../assets/patterns/*.{svg,png,jpg,jpeg}", { eager: true, query: "?url", import: "default" })
        : import.meta.glob("../../assets/stamps/*.{svg,png,jpg,jpeg}", { eager: true, query: "?url", import: "default" });
    const all = Object.values(glob).map((v) => String(v)).sort();
    const sample = all.filter((u) => u.includes("sample-"));
    return sample.length > 0 ? sample : all;
  }, [kind]);
}

export type PartTab = { id: string; label: string };

const BASIC_COLORS = [
  "#FFFFFF",
  "#000000",
  "#E11D48",
  "#F97316",
  "#FACC15",
  "#65A30D",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#1D4ED8",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#EC4899",
  "#A3A3A3",
  "#8B5E3C",
];

export function ToolDock({
  activeTool,
  parts,
  selectedPart,
  onSelectPart,
  activeDecal,
  activeDecalRotationDeg,
  onActiveDecalRotationChange,
  currentColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  patternRotation,
  onPatternRotationChange,
  lockParts,
  onLockPartsChange,
  selectedLogo,
  onSelectLogo,
  selectedPattern,
  onSelectPattern,
  selectedStamp,
  onSelectStamp,
  onEraseAll,
  onErasePart,
}: {
  activeTool: DesignTool;
  parts: PartTab[];
  selectedPart: string | null;
  onSelectPart: (partId: string) => void;

  activeDecal: DecalInstance | null;
  activeDecalRotationDeg: number | null;
  onActiveDecalRotationChange: (deg: number) => void;

  currentColor: string;
  onColorChange: (color: string) => void;

  brushSize: number;
  onBrushSizeChange: (value: number) => void;

  patternRotation: number;
  onPatternRotationChange: (value: number) => void;

  lockParts: boolean;
  onLockPartsChange: (value: boolean) => void;

  selectedLogo: string | null;
  onSelectLogo: (value: string) => void;

  selectedPattern: string | null;
  onSelectPattern: (value: string) => void;

  selectedStamp: string | null;
  onSelectStamp: (value: string) => void;

  onEraseAll: () => void;
  onErasePart: (partId: string) => void;
}) {
  const [colorBurst, setColorBurst] = useState<{ color: string; id: number } | null>(null);
  const logos = useAssetUrls("logos");
  const patterns = useAssetUrls("patterns");
  const stamps = useAssetUrls("stamps");

  const showParts = activeTool === "logo" || activeTool === "stamp" || activeTool === "pattern" || activeTool === "brush" || activeTool === "color" || activeTool === "eraser";
  const showDock = activeTool !== "move";
  const showActiveDecalControls =
    (activeTool === "logo" || activeTool === "stamp" || activeTool === "pattern") &&
    !!activeDecal &&
    typeof activeDecalRotationDeg === 'number';

  const handleColorDragStart = (color: string) => (event: DragEvent<HTMLButtonElement | HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("type", "color");
    event.dataTransfer.setData("value", color);
    event.dataTransfer.setData("text/plain", color);
    onColorChange(color);
  };

  const handleColorClick = (color: string) => {
    const burstId = Date.now();

    onColorChange(color);
    setColorBurst({ color, id: burstId });

    window.setTimeout(() => {
      setColorBurst((current) => (current?.id === burstId ? null : current));
    }, 520);
  };

  if (!showDock) return null;

  return (
    <div className="fixed bottom-[50px] left-0 right-0 z-40">
      <div className="mx-auto max-w-[56rem] overflow-hidden rounded-xl border border-primary/10 bg-white/92 text-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/80">
        {showParts && parts.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto px-2.5 py-1.5 text-[11px]">
            {parts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPart(p.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-1 transition-colors",
                  selectedPart === p.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="px-2.5 py-1.5">
          {(activeTool === "color") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-semibold tracking-[0.18em] text-foreground/70">MÀU</div>
                <label
                  className="group relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/60 shadow-[0_5px_14px_rgba(15,23,42,0.1)] transition-transform hover:scale-105"
                  style={{ backgroundColor: currentColor }}
                  title="Chọn màu tùy chỉnh"
                >
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <div className="pointer-events-none h-3 w-3 rounded-full border border-white/70 bg-white/20" />
                </label>
              </div>

              <div className="grid grid-cols-8 gap-1.5">
                {BASIC_COLORS.map((color) => {
                  const isActive = currentColor.toLowerCase() === color.toLowerCase();
                  const showBurst = colorBurst?.color === color;

                  return (
                    <button
                      key={color}
                      type="button"
                      draggable
                      onDragStart={handleColorDragStart(color)}
                      onClick={() => handleColorClick(color)}
                      className={cn(
                        "relative h-7 w-7 overflow-hidden rounded-full border transition-all duration-200 hover:scale-105 active:scale-[0.96]",
                        isActive
                          ? "shadow-[0_0_0_1.5px_rgba(255,255,255,0.92),0_8px_20px_rgba(15,23,42,0.16)]"
                          : "shadow-[0_6px_16px_rgba(15,23,42,0.11)]"
                      )}
                      style={{
                        background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 16%, ${color} 38%, ${color} 100%)`,
                      }}
                      title={color}
                    >
                      <span className="pointer-events-none absolute inset-x-[18%] top-[14%] h-[26%] rounded-full bg-white/45 blur-[1px]" />
                      {showBurst && (
                        <>
                          <span
                            key={`${colorBurst?.id}-outer`}
                            className="pointer-events-none absolute inset-[2px] rounded-full border border-white/80 opacity-70 animate-[ping_520ms_cubic-bezier(0,0,0.2,1)_1]"
                          />
                          <span
                            key={`${colorBurst?.id}-inner`}
                            className="pointer-events-none absolute inset-[18%] rounded-full bg-white/25 animate-[ping_420ms_ease-out_1]"
                          />
                        </>
                      )}
                      {isActive && (
                        <span className="absolute inset-0 m-auto h-2 w-2 rounded-full border border-white/90 bg-black/20" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(activeTool === "logo") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">LOGOS</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Tint</div>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="h-7 w-9 cursor-pointer overflow-hidden rounded-lg border border-border bg-transparent p-0"
                  />
                </div>
              </div>
              <AssetStrip items={logos} selected={selectedLogo} onSelect={onSelectLogo} dragType="logo" />

              {showActiveDecalControls && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <div className="text-xs text-muted-foreground">ROTATION</div>
                  <div className="w-48">
                    <Slider
                      value={[Math.max(0, Math.min(360, activeDecalRotationDeg!))]}
                      min={0}
                      max={360}
                      step={1}
                      onValueChange={(v) => onActiveDecalRotationChange(v[0])}
                    />
                  </div>
                  <input
                    type="number"
                    value={Math.max(0, Math.min(360, activeDecalRotationDeg!))}
                    onChange={(e) => onActiveDecalRotationChange(Number(e.target.value) || 0)}
                    className="h-8 w-14 rounded-md border border-input bg-background px-2 text-xs"
                  />
                  <div className="text-xs text-muted-foreground">°</div>
                </div>
              )}
            </div>
          )}

          {(activeTool === "stamp") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">STAMPS</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Tint</div>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="h-7 w-9 cursor-pointer overflow-hidden rounded-lg border border-border bg-transparent p-0"
                  />
                </div>
              </div>
              <AssetStrip items={stamps} selected={selectedStamp} onSelect={onSelectStamp} dragType="stamp" />

              {showActiveDecalControls && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <div className="text-xs text-muted-foreground">ROTATION</div>
                  <div className="w-48">
                    <Slider
                      value={[Math.max(0, Math.min(360, activeDecalRotationDeg!))]}
                      min={0}
                      max={360}
                      step={1}
                      onValueChange={(v) => onActiveDecalRotationChange(v[0])}
                    />
                  </div>
                  <input
                    type="number"
                    value={Math.max(0, Math.min(360, activeDecalRotationDeg!))}
                    onChange={(e) => onActiveDecalRotationChange(Number(e.target.value) || 0)}
                    className="h-8 w-14 rounded-md border border-input bg-background px-2 text-xs"
                  />
                  <div className="text-xs text-muted-foreground">°</div>
                </div>
              )}
            </div>
          )}

          {(activeTool === "brush") && (
            <div className="grid gap-3">
              <div className="flex items-center justify-center gap-2.5">
                <div className="text-xs text-muted-foreground">COLOR</div>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="h-8 w-10 cursor-pointer overflow-hidden rounded-lg border border-border bg-transparent p-0"
                />
                <div className="text-xs text-muted-foreground">BRUSH SIZE</div>
                <div className="w-48">
                  <Slider value={[brushSize]} min={5} max={80} step={1} onValueChange={(v) => onBrushSizeChange(v[0])} />
                </div>
                <div className="text-xs tabular-nums text-muted-foreground w-8 text-right">{brushSize}</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">LOCK PARTS</div>
                  <Switch checked={lockParts} onCheckedChange={onLockPartsChange} />
                </div>
              </div>
            </div>
          )}

          {(activeTool === "pattern") && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-3.5">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">COLOR</div>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="h-8 w-10 cursor-pointer overflow-hidden rounded-lg border border-border bg-transparent p-0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">PATTERN SIZE</div>
                  <div className="w-44">
                    <Slider value={[brushSize]} min={5} max={80} step={1} onValueChange={(v) => onBrushSizeChange(v[0])} />
                  </div>
                  <div className="text-xs tabular-nums text-muted-foreground w-8 text-right">{brushSize}</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">PATTERN ROTATION</div>
                  <input
                    type="number"
                    value={Math.round(patternRotation)}
                    onChange={(e) => onPatternRotationChange(Number(e.target.value) || 0)}
                    className="h-8 w-14 rounded-md border border-input bg-background px-2 text-xs"
                  />
                  <div className="text-xs text-muted-foreground">°</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">LOCK PARTS</div>
                  <Switch checked={lockParts} onCheckedChange={onLockPartsChange} />
                </div>
              </div>
              <AssetStrip items={patterns} selected={selectedPattern} onSelect={onSelectPattern} dragType="pattern" />

              {showActiveDecalControls && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  <div className="text-xs text-muted-foreground">DECAL ROTATION</div>
                  <div className="w-48">
                    <Slider
                      value={[Math.max(0, Math.min(360, activeDecalRotationDeg!))]}
                      min={0}
                      max={360}
                      step={1}
                      onValueChange={(v) => onActiveDecalRotationChange(v[0])}
                    />
                  </div>
                  <input
                    type="number"
                    value={Math.max(0, Math.min(360, activeDecalRotationDeg!))}
                    onChange={(e) => onActiveDecalRotationChange(Number(e.target.value) || 0)}
                    className="h-8 w-14 rounded-md border border-input bg-background px-2 text-xs"
                  />
                  <div className="text-xs text-muted-foreground">°</div>
                </div>
              )}
            </div>
          )}

          {(activeTool === "eraser") && (
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <Button
                type="button"
                variant="outline"
                onClick={onEraseAll}
                className="text-primary-foreground"
              >
                ERASE ALL
              </Button>

              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">ERASER SIZE</div>
                <div className="w-48">
                  <Slider value={[brushSize]} min={5} max={80} step={1} onValueChange={(v) => onBrushSizeChange(v[0])} />
                </div>
                <div className="text-xs tabular-nums text-muted-foreground w-8 text-right">{brushSize}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">LOCK PARTS</div>
                <Switch checked={lockParts} onCheckedChange={onLockPartsChange} />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={!selectedPart}
                onClick={() => {
                  if (selectedPart) onErasePart(selectedPart);
                }}
                className="text-primary-foreground"
              >
                ERASE PART
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
