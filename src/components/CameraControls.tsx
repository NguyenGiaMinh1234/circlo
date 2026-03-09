import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Camera,
  Orbit,
  Move,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraControlsProps {
  onViewChange: (view: 'front' | 'back' | 'left' | 'right' | 'top' | 'isometric') => void;
  onZoom: (delta: number) => void;
  onReset: () => void;
  onFullscreen: () => void;
  onScreenshot: () => void;
  isAnimating?: boolean;
}

export default function CameraControls({ 
  onViewChange, 
  onZoom, 
  onReset, 
  onFullscreen,
  onScreenshot,
  isAnimating = false
}: CameraControlsProps) {
  const [zoomLevel, setZoomLevel] = useState(50);

  const views = [
    { id: 'front' as const, label: 'Trước', icon: '👁️' },
    { id: 'back' as const, label: 'Sau', icon: '🔙' },
    { id: 'left' as const, label: 'Trái', icon: '⬅️' },
    { id: 'right' as const, label: 'Phải', icon: '➡️' },
    { id: 'top' as const, label: 'Trên', icon: '⬆️' },
    { id: 'isometric' as const, label: '3D', icon: '📐' },
  ];

  const handleZoomSlider = (value: number[]) => {
    const delta = (value[0] - zoomLevel) / 25;
    setZoomLevel(value[0]);
    onZoom(delta);
  };

  return (
    <>
      {/* View Presets - Bottom Left */}
      <div className="fixed bottom-6 left-6 z-10 flex flex-col gap-3">
        {/* Main Controls */}
        <div className="bg-card/95 backdrop-blur-lg border-2 border-border/50 rounded-2xl p-3 shadow-2xl">
          <div className="flex flex-col gap-3">
            {/* Zoom Slider */}
            <div className="px-1">
              <div className="flex items-center justify-between mb-2">
                <ZoomOut className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Zoom</span>
                <ZoomIn className="h-3 w-3 text-muted-foreground" />
              </div>
              <Slider
                value={[zoomLevel]}
                min={10}
                max={100}
                step={5}
                onValueChange={handleZoomSlider}
                className="w-full"
                disabled={isAnimating}
              />
            </div>

            {/* Quick Zoom Buttons */}
            <div className="flex gap-2 pb-2 border-b border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setZoomLevel(Math.min(100, zoomLevel + 15));
                  onZoom(0.6);
                }}
                className={cn(
                  "flex-1 hover:bg-primary/10 transition-all duration-300",
                  isAnimating && "opacity-50 pointer-events-none"
                )}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setZoomLevel(Math.max(10, zoomLevel - 15));
                  onZoom(-0.6);
                }}
                className={cn(
                  "flex-1 hover:bg-primary/10 transition-all duration-300",
                  isAnimating && "opacity-50 pointer-events-none"
                )}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Reset & Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setZoomLevel(50);
                  onReset();
                }}
                className={cn(
                  "hover:bg-primary/10 transition-all duration-300",
                  isAnimating && "animate-pulse"
                )}
                title="Reset View"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onScreenshot}
                className="hover:bg-primary/10 transition-all duration-300"
                title="Screenshot"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* View Presets */}
        <div className="bg-card/95 backdrop-blur-lg border-2 border-border/50 rounded-2xl p-3 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Orbit className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">
              Góc nhìn
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {views.map((view) => (
              <Button
                key={view.id}
                size="sm"
                variant="outline"
                onClick={() => onViewChange(view.id)}
                className={cn(
                  "hover:bg-primary/10 transition-all duration-300 text-xs",
                  "hover:scale-105 hover:shadow-lg",
                  isAnimating && "opacity-50 pointer-events-none"
                )}
                title={view.label}
              >
                <span className="mr-1">{view.icon}</span>
                {view.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Animation Indicator */}
        {isAnimating && (
          <div className="bg-primary/20 backdrop-blur-lg border border-primary/50 rounded-xl px-3 py-2 text-center animate-pulse">
            <div className="flex items-center justify-center gap-2">
              <Move className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs text-primary font-medium">Đang di chuyển...</span>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-10">
        <Button
          size="sm"
          variant="default"
          onClick={onFullscreen}
          className="bg-card/95 backdrop-blur-lg border-2 border-border/50 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300 px-4 py-2"
          title="Fullscreen"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          <span className="text-xs">Toàn màn hình</span>
        </Button>
      </div>
    </>
  );
}
