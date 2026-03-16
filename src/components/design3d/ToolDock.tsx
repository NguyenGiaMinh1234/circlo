import { useMemo, useState, type DragEvent } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DesignTool } from "@/components/design3d/BottomToolbar";
import { AssetStrip } from "@/components/design3d/AssetStrip";
import type { DecalInstance } from "@/types/decal";
import { ChevronDown } from "lucide-react";

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

const COLOR_OPTIONS = [
  { name: "Ivory", value: "#FFFFFF" },
  { name: "Midnight", value: "#111111" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Sun", value: "#FACC15" },
  { name: "Green", value: "#10B981" },
  { name: "Sky", value: "#06B6D4" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#9333EA" },
  { name: "Pink", value: "#EC4899" },
  { name: "Stone", value: "#A3A3A3" },
  { name: "Earth", value: "#8B5E3C" },
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
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false);
  const logos = useAssetUrls("logos");
  const patterns = useAssetUrls("patterns");
  const stamps = useAssetUrls("stamps");

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

  const currentColorLabel = useMemo(() => {
    const matched = COLOR_OPTIONS.find((c) => c.value.toLowerCase() === currentColor.toLowerCase());
    return matched ? matched.name : currentColor.toUpperCase();
  }, [currentColor]);

  if (!showDock) return null;

  return (
    <div className="fixed bottom-[42px] left-1/2 z-40 w-full -translate-x-1/2 px-2">
      <div className="mx-auto w-fit max-w-[94vw] overflow-hidden rounded-xl border border-primary/10 bg-white/92 text-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="px-2 py-1">
          {(activeTool === "color") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-semibold tracking-[0.18em] text-foreground/70">MÀU</div>
                <label
                  className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/80 shadow-[0_6px_16px_rgba(15,23,42,0.14)]"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #ff3b30, #ff9500, #ffcc00, #34c759, #00c7be, #007aff, #5856d6, #af52de, #ff2d55, #ff3b30)",
                  }}
                  title="Màu đa sắc"
                >
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <span className="pointer-events-none flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/95">
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-black/10"
                      style={{ backgroundColor: currentColor }}
                    />
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => setIsColorPaletteOpen((prev) => !prev)}
                className="flex w-fit items-center gap-2.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/30"
              >
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: currentColor }}
                />
                <span>{currentColorLabel}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-300",
                    isColorPaletteOpen && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "flex flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden transition-all duration-300 ease-out",
                  isColorPaletteOpen ? "max-h-12 opacity-100 pt-1" : "max-h-0 opacity-0"
                )}
              >
                {COLOR_OPTIONS.map(({ name, value: color }) => {
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
                        "relative h-[22px] w-[22px] overflow-hidden rounded-full border border-[#e5e7eb] transition-all duration-200 hover:scale-110",
                        isActive
                          ? "shadow-[0_0_0_1.5px_rgba(255,255,255,0.92),0_8px_20px_rgba(15,23,42,0.16)]"
                          : "shadow-[0_6px_16px_rgba(15,23,42,0.11)]"
                      )}
                      style={{
                        background: color,
                      }}
                      title={name}
                    >
                      {showBurst && (
                        <span
                          key={`${colorBurst?.id}-outer`}
                          className="pointer-events-none absolute inset-[2px] rounded-full border border-white/80 opacity-70 animate-[ping_520ms_cubic-bezier(0,0,0.2,1)_1]"
                        />
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
