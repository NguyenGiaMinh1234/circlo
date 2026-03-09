import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Model3DViewer } from "@/components/Model3DViewer";
import { products, type Product } from "@/data/products";
import { toast } from "sonner";
import type { DecalInstance, DecalType } from "@/types/decal";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BottomToolbar, type DesignTool } from "@/components/design3d/BottomToolbar";
import { ToolDock } from "@/components/design3d/ToolDock";
import { ProductDropdown } from "@/components/ProductDropdown";
import { ExportControls } from "@/components/ExportControls";
import { supabase } from "@/integrations/supabase/client";

type Design3DProps = {
  initialProductId?: string;
};

const Design3D = ({ initialProductId }: Design3DProps) => {
  const resolvedInitial = useMemo(() => {
    return products.find((p) => p.id === initialProductId) ?? products[0];
  }, [initialProductId]);

  const [selectedProduct, setSelectedProduct] = useState<Product>(resolvedInitial);
  const [activeTool, setActiveTool] = useState<DesignTool>("move");

  const [discoveredParts, setDiscoveredParts] = useState<string[]>([]);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const [partColors, setPartColors] = useState<Record<string, string>>({});
  const [partTextures, setPartTextures] = useState<Record<string, string>>({});
  const [partTextureAnchors, setPartTextureAnchors] = useState<
    Record<
      string,
      {
        position: { x: number; y: number; z: number };
        normal?: { x: number; y: number; z: number };
        meshUuid?: string;
      }
    >
  >({});

  // Multiple overlapping decals per mesh/part
  const [decals, setDecals] = useState<DecalInstance[]>([]);
  const [activeDecalId, setActiveDecalId] = useState<string | null>(null);

  // Bottom dock states (match the screenshot-style workflow)
  const [currentColor, setCurrentColor] = useState<string>("#111827");
  const [brushSize, setBrushSize] = useState<number>(30);
  const [patternRotation, setPatternRotation] = useState<number>(0);
  const [lockParts, setLockParts] = useState<boolean>(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);

  const [isCloudSaving, setIsCloudSaving] = useState<boolean>(false);

  const degToRad = useCallback((deg: number) => (deg * Math.PI) / 180, []);
  const radToDeg = useCallback((rad: number) => (rad * 180) / Math.PI, []);

  const activeDecal = useMemo(() => {
    if (!activeDecalId) return null;
    return decals.find((d) => d.id === activeDecalId) ?? null;
  }, [activeDecalId, decals]);

  const activeDecalRotationDeg = useMemo(() => {
    if (!activeDecal) return null;
    return Math.round(radToDeg(activeDecal.rotation));
  }, [activeDecal, radToDeg]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
  const controlsRef = useRef<OrbitControlsImpl>(null!);

  const handleProductChange = useCallback((product: Product) => {
    setSelectedProduct(product);
    setActiveTool("move");
    setDiscoveredParts([]);
    setSelectedPart(null);

    setPartColors({});
    setPartTextures({});
    setPartTextureAnchors({});

    setDecals([]);
    setActiveDecalId(null);
    setSelectedLogo(null);
    setSelectedPattern(null);
    setSelectedStamp(null);
  }, []);

  useEffect(() => {
    // Keep in sync when user arrives from product selection page
    if (!resolvedInitial) return;
    handleProductChange(resolvedInitial);
  }, [handleProductChange, resolvedInitial]);

  const handlePartsDiscovered = useCallback((parts: string[]) => {
    setDiscoveredParts(parts);
  }, []);

  const formatPartLabel = useCallback((rawName: string) => {
    const toTitleCase = (value: string) =>
      value
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toLocaleUpperCase("vi-VN") + word.slice(1).toLocaleLowerCase("vi-VN"))
        .join(" ");

    // 1. Check product-specific label mapping first
    const labelMap = selectedProduct.partLabels;
    if (labelMap && labelMap[rawName]) {
      return toTitleCase(labelMap[rawName]);
    }

    // 2. Fallback: generic "Mesh N" pattern
    const trimmed = rawName.trim();
    const m = /^mesh\s*(\d+)$/i.exec(trimmed);
    if (m) {
      if (m[1] === "10") return "Thân Chính";
      return `Bộ Phận ${m[1]}`;
    }

    // 3. Humanize raw mesh names if they leak to the UI
    if (/^[a-z]+\d+_/i.test(trimmed) || trimmed.includes("lambert")) {
      return "Bộ Phận Mô Hình";
    }

    return toTitleCase(trimmed);
  }, [selectedProduct.partLabels]);

  const handlePartClick = useCallback((partName: string) => {
    setSelectedPart(partName);
  }, []);

  const handleBlankCanvasClick = useCallback(() => {
    setActiveTool("move");
    setActiveDecalId(null);
  }, []);

  const handleColorApply = useCallback(
    (color: string) => {
      if (!selectedPart) return;
      setPartColors((prev) => ({ ...prev, [selectedPart]: color }));
    },
    [selectedPart]
  );

  const handleDecalSelect = useCallback(
    (decalId: string | null) => {
      setActiveDecalId(decalId);
      if (!decalId) return;
      const d = decals.find((x) => x.id === decalId);
      if (d) {
        setSelectedPart(d.partName);
        setCurrentColor(d.color);

        // Make editing discoverable: switch to the tool that can edit this decal.
        if (d.type === 'logo' || d.type === 'stamp' || d.type === 'pattern') {
          setActiveTool(d.type);
        }
      }
    },
    [decals]
  );

  const handleDecalUpdate = useCallback((decalId: string, update: Partial<DecalInstance>) => {
    setDecals((prev) => prev.map((d) => (d.id === decalId ? { ...d, ...update } : d)));
  }, []);

  const handleDecalDelete = useCallback((decalId: string) => {
    setDecals((prev) => {
      const next = prev.filter((d) => d.id !== decalId);
      return next;
    });
    setActiveDecalId((prevActive) => (prevActive === decalId ? null : prevActive));
  }, []);

  const handleDecalDuplicate = useCallback((decalId: string) => {
    const newId = globalThis.crypto && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `decal_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    setDecals((prev) => {
      const idx = prev.findIndex((d) => d.id === decalId);
      if (idx === -1) return prev;
      const original = prev[idx];
      const copy: DecalInstance = {
        ...original,
        id: newId,
        rotation: original.rotation + 0.05,
      };
      const next = [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
      return next;
    });
    setActiveDecalId(newId);
  }, []);

  const handleDecalMove = useCallback((decalId: string, direction: 'up' | 'down') => {
    setDecals((prev) => {
      const idx = prev.findIndex((d) => d.id === decalId);
      if (idx === -1) return prev;
      const partName = prev[idx].partName;

      const partItems = prev.filter((d) => d.partName === partName);
      const pos = partItems.findIndex((d) => d.id === decalId);
      const nextPos = direction === 'up' ? pos + 1 : pos - 1;
      if (nextPos < 0 || nextPos >= partItems.length) return prev;

      const reordered = [...partItems];
      const [item] = reordered.splice(pos, 1);
      reordered.splice(nextPos, 0, item);

      let cursor = 0;
      return prev.map((d) => {
        if (d.partName !== partName) return d;
        const replacement = reordered[cursor];
        cursor += 1;
        return replacement;
      });
    });
  }, []);

  const handlePresetApply = useCallback(
    (type: "logo" | "stamp" | "pattern", value: string) => {
      if (!selectedPart) return;

      // Legacy marker for the part list (optional)
      setPartTextures((prev) => ({ ...prev, [selectedPart]: value }));

      const id = globalThis.crypto && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `decal_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const anchor = partTextureAnchors[selectedPart];

      const newDecal: DecalInstance = {
        id,
        type: type as DecalType,
        value,
        partName: selectedPart,
        meshUuid: anchor?.meshUuid,
        position: anchor?.position,
        normal: anchor?.normal,
        size: 0.5,
        rotation: type === 'pattern' ? degToRad(patternRotation) : 0,
        flipX: false,
        flipY: false,
        color: currentColor,
      };

      setDecals((prev) => [...prev, newDecal]);
      setActiveDecalId(id);
    },
    [currentColor, degToRad, partTextureAnchors, patternRotation, selectedPart]
  );

  const handleDecalCreate = useCallback((decal: DecalInstance) => {
    setDecals((prev) => [...prev, decal]);
    setActiveDecalId(decal.id);
  }, []);

  const handlePartDrop = useCallback(
    (
      partName: string,
      data: {
        type: "color" | "pattern" | "logo" | "stamp";
        value: string;
        uv?: { u: number; v: number };
        meshUuid?: string;
        worldPoint?: { x: number; y: number; z: number };
        worldNormal?: { x: number; y: number; z: number };
      }
    ) => {
      setSelectedPart(partName);

      if (data.type === "color") {
        setPartColors((prev) => ({ ...prev, [partName]: data.value }));
        return;
      }

      // Keep a marker per-part (optional) so the part list shows “has texture”
      setPartTextures((prev) => ({ ...prev, [partName]: data.value }));

      if (data.worldPoint) {
        setPartTextureAnchors((prev) => ({
          ...prev,
          [partName]: {
            position: data.worldPoint,
            normal: data.worldNormal,
            meshUuid: data.meshUuid,
          },
        }));
      }

      const id = globalThis.crypto && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `decal_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const newDecal: DecalInstance = {
        id,
        type: data.type as DecalType,
        value: data.value,
        partName,
        meshUuid: data.meshUuid,
        position: data.worldPoint,
        normal: data.worldNormal,
        size: 0.5,
        rotation: data.type === 'pattern' ? degToRad(patternRotation) : 0,
        flipX: false,
        flipY: false,
        color: currentColor,
      };

      setDecals((prev) => [...prev, newDecal]);
      setActiveDecalId(id);
      toast.success("Sticker added", { description: "You can stack multiple decals" });
    },
    [currentColor, degToRad, patternRotation]
  );

  const handleEraseAllDesign = useCallback(() => {
    setPartColors({});
    setPartTextures({});
    setPartTextureAnchors({});
    setDecals([]);
    setActiveDecalId(null);
  }, []);

  const handleErasePartDesign = useCallback((partName: string) => {
    setPartColors((prev) => {
      const next = { ...prev };
      delete next[partName];
      return next;
    });

    setPartTextures((prev) => {
      const next = { ...prev };
      delete next[partName];
      return next;
    });

    setPartTextureAnchors((prev) => {
      const next = { ...prev };
      delete next[partName];
      return next;
    });

    setDecals((prev) => prev.filter((d) => d.partName !== partName));
    setActiveDecalId((prevActive) => {
      if (!prevActive) return null;
      const active = decals.find((d) => d.id === prevActive);
      return active?.partName === partName ? null : prevActive;
    });
  }, [decals]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `design-${selectedProduct.id}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [selectedProduct.id]);

  const handleSaveToCloud = useCallback(async () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) {
      toast.error("Canvas not found", { description: "Nothing to save" });
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      toast.error("Supabase is not configured", { description: "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY" });
      return;
    }

    setIsCloudSaving(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) {
        toast.error("Please sign in", { description: "You need to be logged in to save to cloud" });
        return;
      }

      const blob: Blob | null = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png");
      });
      if (!blob) {
        toast.error("Failed to create image");
        return;
      }

      const bucket = (import.meta.env.VITE_SUPABASE_DESIGN_BUCKET as string | undefined) ?? "designs";
      const fileName = `design-${selectedProduct.id}-${Date.now()}.png`;
      const path = `${userId}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType: "image/png", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: signed, error: signedErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60);
      if (signedErr) throw signedErr;

      toast.success("Saved to cloud", {
        description: signed?.signedUrl ? "A download link was created (valid for 1 hour)" : undefined,
      });
      if (signed?.signedUrl) {
        window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Cloud save failed";
      toast.error("Cloud save failed", { description: msg });
    } finally {
      setIsCloudSaving(false);
    }
  }, [selectedProduct.id]);

  const handleReset = useCallback(() => {
    setSelectedPart(null);
    setPartColors({});
    setPartTextures({});
    setPartTextureAnchors({});
    setDecals([]);
    setActiveDecalId(null);
    setActiveTool("move");
    setSelectedLogo(null);
    setSelectedPattern(null);
    setSelectedStamp(null);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div ref={canvasRef} className="fixed inset-0 overflow-hidden">
        <Model3DViewer
          modelPath={selectedProduct.modelPath}
          productType={selectedProduct.id}
          selectedPart={selectedPart}
          onPartClick={handlePartClick}
          onBlankCanvasClick={handleBlankCanvasClick}
          onPartsDiscovered={handlePartsDiscovered}
          partColors={partColors}
          partTextures={partTextures}
          partTextureAnchors={partTextureAnchors}
          onPartDrop={handlePartDrop}
          decals={decals}
          activeDecalId={activeDecalId}
          onDecalSelect={handleDecalSelect}
          onDecalUpdate={handleDecalUpdate}
          onDecalCreate={handleDecalCreate}
          onDecalDelete={handleDecalDelete}
          cameraRef={cameraRef}
          controlsRef={controlsRef}
          editorTool={activeTool}
          editorColor={currentColor}
          editorBrushSize={brushSize}
          editorPatternRotationDeg={patternRotation}
          editorLockParts={lockParts}
          editorSelectedLogo={selectedLogo}
          editorSelectedPattern={selectedPattern}
          editorSelectedStamp={selectedStamp}
        />
      </div>

      <div className="fixed left-6 top-[10.5rem] z-50 md:left-8 md:top-[10.5rem]">
        <ProductDropdown selectedProduct={selectedProduct} onProductChange={handleProductChange} />
      </div>

      <div className="fixed right-4 top-28 z-50">
        <ExportControls onExport={handleExport} onReset={handleReset} onSaveToCloud={handleSaveToCloud} isCloudSaving={isCloudSaving} />
      </div>

      <ToolDock
        activeTool={activeTool}
        parts={discoveredParts.map((p) => ({ id: p, label: formatPartLabel(p) }))}
        selectedPart={selectedPart}
        onSelectPart={setSelectedPart}
        activeDecal={activeDecal}
        activeDecalRotationDeg={activeDecalRotationDeg}
        onActiveDecalRotationChange={(deg) => {
          if (!activeDecalId) return;
          const normalized = ((deg % 360) + 360) % 360;
          handleDecalUpdate(activeDecalId, { rotation: degToRad(normalized) });
        }}
        currentColor={currentColor}
        onColorChange={(c) => {
          setCurrentColor(c);
          if (activeTool === 'color') {
            handleColorApply(c);
          } else if (activeDecalId && (activeTool === 'logo' || activeTool === 'stamp' || activeTool === 'pattern')) {
            handleDecalUpdate(activeDecalId, { color: c });
          }
        }}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        patternRotation={patternRotation}
        onPatternRotationChange={setPatternRotation}
        lockParts={lockParts}
        onLockPartsChange={setLockParts}
        selectedLogo={selectedLogo}
        onSelectLogo={(url) => {
          setSelectedLogo(url);
          if (activeTool !== 'logo') setActiveTool('logo');
        }}
        selectedPattern={selectedPattern}
        onSelectPattern={(url) => {
          setSelectedPattern(url);
          if (activeTool !== 'pattern') setActiveTool('pattern');
        }}
        selectedStamp={selectedStamp}
        onSelectStamp={(url) => {
          setSelectedStamp(url);
          if (activeTool !== 'stamp') setActiveTool('stamp');
        }}
        onEraseAll={handleEraseAllDesign}
        onErasePart={handleErasePartDesign}
      />

      <BottomToolbar activeTool={activeTool} onToolChange={setActiveTool} />
    </div>
  );
};

export default Design3D;
