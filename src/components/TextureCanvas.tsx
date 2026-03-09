import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush, Pattern, Rect, Image as FabricImage, IText } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Type, Upload } from "lucide-react";
import { toast } from "sonner";

// Import logos - NOTE: Copy these PNG files from project 1 to project 2/src/assets/logos/
// import logo1 from "@/assets/logos/logo1.png";
// import logo2 from "@/assets/logos/logo2.png";
// import logo3 from "@/assets/logos/logo3.png";
// import logo4 from "@/assets/logos/logo4.png";
// import logo5 from "@/assets/logos/logo5.png";
// import logo6 from "@/assets/logos/logo6.png";

// Import stamps - NOTE: Copy these PNG files from project 1 to project 2/src/assets/stamps/
// import stamp1 from "@/assets/stamps/stamp1.png";
// import stamp2 from "@/assets/stamps/stamp2.png";
// import stamp3 from "@/assets/stamps/stamp3.png";
// import stamp4 from "@/assets/stamps/stamp4.png";
// import stamp5 from "@/assets/stamps/stamp5.png";
// import stamp6 from "@/assets/stamps/stamp6.png";

// Import patterns - NOTE: Copy these PNG files from project 1 to project 2/src/assets/patterns/
// import pattern1 from "@/assets/patterns/pattern1.png";
// import pattern2 from "@/assets/patterns/pattern2.png";
// import pattern3 from "@/assets/patterns/pattern3.png";
// import pattern4 from "@/assets/patterns/pattern4.png";
// import pattern5 from "@/assets/patterns/pattern5.png";
// import pattern6 from "@/assets/patterns/pattern6.png";

interface TextureCanvasProps {
  activeTool: string;
  brushColor: string;
  selectedPart: string | null;
  partName: string;
  onTextureUpdate: (partName: string, canvas: FabricCanvas) => void;
  onDragStart?: (type: 'logo' | 'stamp' | 'pattern', value: string) => void;
}

export default function TextureCanvas({ 
  activeTool, 
  brushColor, 
  selectedPart, 
  partName, 
  onTextureUpdate,
  onDragStart
}: TextureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [patternRotation, setPatternRotation] = useState(0);

  // Clear canvas when part changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (canvas && selectedPart) {
      // Keep existing content when switching parts - don't clear
      canvas.renderAll();
    }
  }, [selectedPart]);

  useEffect(() => {
    if (!canvasRef.current || !selectedPart) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 512,
      height: 512,
      backgroundColor: 'transparent',
    });

    // Initialize the freeDrawingBrush with PencilBrush
    canvas.freeDrawingBrush = new PencilBrush(canvas);

    fabricCanvasRef.current = canvas;

    // Update texture on any canvas change
    const updateTexture = () => {
      if (selectedPart && canvas) {
        onTextureUpdate(selectedPart, canvas);
      }
    };

    canvas.on('object:added', updateTexture);
    canvas.on('object:modified', updateTexture);
    canvas.on('object:removed', updateTexture);
    canvas.on('path:created', updateTexture);
    canvas.on('after:render', updateTexture);

    return () => {
      canvas.dispose();
    };
  }, [selectedPart, onTextureUpdate]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Reset mode
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';

    switch (activeTool) {
      case 'move':
        canvas.defaultCursor = 'move';
        canvas.selection = true;
        break;

      case 'brush':
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = brushColor;
          canvas.freeDrawingBrush.width = brushSize;
        }
        break;

      case 'eraser': {
        canvas.isDrawingMode = true;
        const eraserBrush = new PencilBrush(canvas);
        eraserBrush.color = '#ffffff';
        eraserBrush.width = brushSize;
        canvas.freeDrawingBrush = eraserBrush;
        break;
      }

      case 'text':
        canvas.defaultCursor = 'text';
        break;

      default:
        canvas.selection = true;
        break;
    }
  }, [activeTool, brushColor, brushSize]);

  const handleAddLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      FabricImage.fromURL(event.target?.result as string).then((img) => {
        img.scaleToWidth(150);
        img.set({
          left: 256,
          top: 256,
          originX: 'center',
          originY: 'center',
        });
        fabricCanvasRef.current?.add(img);
        // toast.success("Đã thêm logo tùy chỉnh");
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddPresetLogo = (logoUrl: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    FabricImage.fromURL(logoUrl).then((img) => {
      img.scaleToWidth(120);
      img.set({
        left: 256,
        top: 256,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      // toast.success("✨ Logo đã được thêm - Kéo thả và thay đổi kích thước");
    });
  };

  const handleAddPresetStamp = (stampUrl: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    FabricImage.fromURL(stampUrl).then((img) => {
      img.scaleToWidth(100);
      img.set({
        left: 256,
        top: 256,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      // toast.success("✨ Tem đã được thêm - Kéo thả và thay đổi kích thước");
    });
  };

  const handleAddPattern = (patternType: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let patternSVG = '';
    
    switch (patternType) {
      case 'dots':
        patternSVG = `<svg width="20" height="20"><circle cx="10" cy="10" r="3" fill="${brushColor}"/></svg>`;
        break;
      case 'stripes':
        patternSVG = `<svg width="20" height="20"><line x1="0" y1="0" x2="0" y2="20" stroke="${brushColor}" stroke-width="10"/></svg>`;
        break;
      case 'grid':
        patternSVG = `<svg width="20" height="20"><rect x="0" y="0" width="20" height="20" fill="none" stroke="${brushColor}" stroke-width="2"/></svg>`;
        break;
      case 'waves':
        patternSVG = `<svg width="40" height="20"><path d="M0 10 Q10 0, 20 10 T40 10" stroke="${brushColor}" fill="none" stroke-width="2"/></svg>`;
        break;
    }

    const blob = new Blob([patternSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    FabricImage.fromURL(url).then((patternImg) => {
      const pattern = new Pattern({
        source: patternImg.getElement() as HTMLImageElement,
        repeat: 'repeat',
      });

      const rect = new Rect({
        left: 100,
        top: 100,
        width: 300,
        height: 300,
        fill: pattern,
        angle: patternRotation,
      });

      canvas.add(rect);
      // toast.success("Đã thêm pattern");
    });
  };

  const handleAddPresetPattern = (patternUrl: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    FabricImage.fromURL(patternUrl).then((patternImg) => {
      const pattern = new Pattern({
        source: patternImg.getElement() as HTMLImageElement,
        repeat: 'repeat',
      });

      const rect = new Rect({
        left: 100,
        top: 100,
        width: 300,
        height: 300,
        fill: pattern,
        angle: patternRotation,
        selectable: true,
        evented: true,
      });

      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
      // toast.success("✨ Họa tiết đã được thêm - Kéo thả và điều chỉnh");
    });
  };

  const handleAddText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const text = new IText('Nhập chữ...', {
      left: 256,
      top: 256,
      fontFamily: 'Arial',
      fontSize: 40,
      fill: brushColor,
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();
    // toast.success("✨ Nhập text của bạn - Click để chỉnh sửa");
  };

  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    canvas.clear();
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();
    // toast.success("Đã xóa toàn bộ");
  };

  // Placeholder arrays for logos/stamps/patterns - replace with actual imports when assets are copied
  const logos: string[] = [];
  const stamps: string[] = [];
  const patterns: string[] = [];

  if (!selectedPart) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground text-center">
          Vui lòng chọn bộ phận để bắt đầu thiết kế
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary/10 via-secondary/20 to-primary/10 rounded-xl p-4 border border-primary/30 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Canvas thiết kế: {partName}
          </h3>
          <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded">Live Preview</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          ✨ <span className="font-medium">Vẽ, thêm logo, tem, họa tiết sẽ hiển thị ngay trên 3D</span>
        </p>
        <p className="text-xs text-muted-foreground">
          💡 Mỗi bộ phận có canvas riêng. Chuyển bộ phận để thiết kế tiếp.
        </p>
      </div>
      
      <div className="bg-card rounded-xl p-4 border-2 border-primary/20 shadow-xl">
        <canvas ref={canvasRef} className="border-2 border-dashed border-primary/30 rounded-lg w-full" />
      </div>

      {/* Tool Settings */}
      {(activeTool === 'brush' || activeTool === 'eraser') && (
        <div className="bg-card rounded-lg p-4 border border-border space-y-2">
          <label className="text-sm font-medium">Kích thước: {brushSize}</label>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            min={5}
            max={100}
            step={5}
          />
        </div>
      )}

      {activeTool === 'logo' && (
        <div className="bg-card rounded-xl p-4 border border-border space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Chọn logo có sẵn</h3>
            <span className="text-xs text-primary font-medium">🖱️ Kéo thả lên 3D</span>
          </div>
          {logos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {logos.map((logo, index) => (
              <button
                key={index}
                onClick={() => handleAddPresetLogo(logo)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('type', 'logo');
                  e.dataTransfer.setData('value', logo);
                  if (onDragStart) onDragStart('logo', logo);
                }}
                onDragEnd={() => {}}
                className="aspect-square rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-110 hover:shadow-xl bg-background p-2 active:scale-95 cursor-move"
              >
                  <img src={logo} alt={`Logo ${index + 1}`} className="w-full h-full object-contain pointer-events-none" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Copy logo PNG files to src/assets/logos/ to enable this feature
            </p>
          )}
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Hoặc</span>
            </div>
          </div>

          <label className="block">
            <Button variant="outline" className="w-full" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Tải logo tùy chỉnh
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleAddLogo}
              className="hidden"
            />
          </label>
        </div>
      )}

      {activeTool === 'stamp' && (
        <div className="bg-card rounded-xl p-4 border border-border space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Chọn tem có sẵn</h3>
            <span className="text-xs text-primary font-medium">🖱️ Kéo thả lên 3D</span>
          </div>
          {stamps.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {stamps.map((stamp, index) => (
              <button
                key={index}
                onClick={() => handleAddPresetStamp(stamp)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('type', 'stamp');
                  e.dataTransfer.setData('value', stamp);
                  if (onDragStart) onDragStart('stamp', stamp);
                }}
                onDragEnd={() => {}}
                className="aspect-square rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-110 hover:shadow-xl bg-background p-2 active:scale-95 cursor-move"
              >
                  <img src={stamp} alt={`Tem ${index + 1}`} className="w-full h-full object-contain pointer-events-none" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Copy stamp PNG files to src/assets/stamps/ to enable this feature
            </p>
          )}
        </div>
      )}

      {activeTool === 'pattern' && (
        <div className="bg-card rounded-xl p-4 border border-border space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Họa tiết có sẵn</h3>
              <span className="text-xs text-primary font-medium">🖱️ Kéo thả lên 3D</span>
            </div>
            {patterns.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {patterns.map((pattern, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddPresetPattern(pattern)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'copy';
                      e.dataTransfer.setData('type', 'pattern');
                      e.dataTransfer.setData('value', pattern);
                      if (onDragStart) onDragStart('pattern', pattern);
                    }}
                    onDragEnd={() => {}}
                    className="aspect-square rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-110 hover:shadow-xl bg-background overflow-hidden active:scale-95 cursor-move"
                  >
                    <img src={pattern} alt={`Họa tiết ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Pattern tùy chỉnh</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handleAddPattern('dots')}>Chấm tròn</Button>
              <Button variant="outline" onClick={() => handleAddPattern('stripes')}>Sọc dọc</Button>
              <Button variant="outline" onClick={() => handleAddPattern('grid')}>Lưới</Button>
              <Button variant="outline" onClick={() => handleAddPattern('waves')}>Sóng</Button>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Xoay: {patternRotation}°</label>
              <Slider
                value={[patternRotation]}
                onValueChange={(value) => setPatternRotation(value[0])}
                min={0}
                max={360}
                step={15}
              />
            </div>
          </div>
        </div>
      )}

      {activeTool === 'text' && (
        <div className="bg-card rounded-lg p-4 border border-border">
          <Button variant="outline" onClick={handleAddText} className="w-full">
            <Type className="mr-2 h-4 w-4" />
            Thêm chữ
          </Button>
        </div>
      )}

      <Button variant="destructive" onClick={handleClear} className="w-full">
        Xóa toàn bộ
      </Button>
    </div>
  );
}

