import { Card } from "@/components/ui/card";
import { ColorPicker } from "@/components/ColorPicker";
import { ColorPickerVisual } from "@/components/ColorPickerVisual";
import PresetLibrary from "@/components/PresetLibrary";

interface ToolPanelProps {
  activeTool: string;
  selectedPart: string | null;
  partColors: Record<string, string>;
  partTextures: Record<string, string>;
  partTextureSizes: Record<string, number>;
  partTextureRotations?: Record<string, number>;
  partTextureFlips?: Record<string, { flipX: boolean; flipY: boolean }>;
  onColorApply: (color: string) => void;
  onPresetApply: (type: 'logo' | 'stamp' | 'pattern', value: string) => void;
  onDragStart: (type: 'color' | 'pattern' | 'logo' | 'stamp', value: string) => void;
  onTextureSizeChange: (partName: string, size: number) => void;
  onTextureRotationChange?: (partName: string, rotation: number) => void;
  onTextureFlipChange?: (partName: string, flipX: boolean, flipY: boolean) => void;
}

export default function ToolPanel({
  activeTool,
  selectedPart,
  partColors,
  partTextures,
  partTextureSizes,
  partTextureRotations = {},
  partTextureFlips = {},
  onColorApply,
  onPresetApply,
  onDragStart,
  onTextureSizeChange,
  onTextureRotationChange,
  onTextureFlipChange,
}: ToolPanelProps) {
  if (activeTool === 'move') {
    return null; // No panel for move tool
  }

  return (
    <div className="fixed left-20 top-20 z-30 w-80 max-h-[calc(100vh-6rem)] overflow-y-auto animate-in slide-in-from-left-2 duration-200">
      <Card className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border-border">
        {activeTool === 'color' && (
          <div className="space-y-4">
            <ColorPicker
              selectedPart={selectedPart}
              partColors={partColors}
              onColorApply={onColorApply}
              onDragStart={(color) => onDragStart('color', color)}
            />
            <ColorPickerVisual partColors={partColors} />
          </div>
        )}

        {activeTool === 'logo' && (
          <PresetLibrary
            type="logo"
            selectedPart={selectedPart}
            onApply={(value) => onPresetApply('logo', value)}
            onDragStart={(type, value) => onDragStart(type, value)}
            onSizeChange={onTextureSizeChange}
            onRotationChange={onTextureRotationChange}
            onFlipChange={onTextureFlipChange}
            currentSize={selectedPart ? (partTextureSizes[selectedPart] || 0.5) : 0.5}
            currentRotation={selectedPart ? (partTextureRotations[selectedPart] || 0) : 0}
            currentFlipX={selectedPart ? (partTextureFlips[selectedPart]?.flipX || false) : false}
            currentFlipY={selectedPart ? (partTextureFlips[selectedPart]?.flipY || false) : false}
          />
        )}

        {activeTool === 'stamp' && (
          <PresetLibrary
            type="stamp"
            selectedPart={selectedPart}
            onApply={(value) => onPresetApply('stamp', value)}
            onDragStart={(type, value) => onDragStart(type, value)}
            onSizeChange={onTextureSizeChange}
            onRotationChange={onTextureRotationChange}
            onFlipChange={onTextureFlipChange}
            currentSize={selectedPart ? (partTextureSizes[selectedPart] || 0.5) : 0.5}
            currentRotation={selectedPart ? (partTextureRotations[selectedPart] || 0) : 0}
            currentFlipX={selectedPart ? (partTextureFlips[selectedPart]?.flipX || false) : false}
            currentFlipY={selectedPart ? (partTextureFlips[selectedPart]?.flipY || false) : false}
          />
        )}

        {activeTool === 'pattern' && (
          <PresetLibrary
            type="pattern"
            selectedPart={selectedPart}
            onApply={(value) => onPresetApply('pattern', value)}
            onDragStart={(type, value) => onDragStart(type, value)}
            onSizeChange={onTextureSizeChange}
            onRotationChange={onTextureRotationChange}
            onFlipChange={onTextureFlipChange}
            currentSize={selectedPart ? (partTextureSizes[selectedPart] || 0.5) : 0.5}
            currentRotation={selectedPart ? (partTextureRotations[selectedPart] || 0) : 0}
            currentFlipX={selectedPart ? (partTextureFlips[selectedPart]?.flipX || false) : false}
            currentFlipY={selectedPart ? (partTextureFlips[selectedPart]?.flipY || false) : false}
          />
        )}
      </Card>
    </div>
  );
}

