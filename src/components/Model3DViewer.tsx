import { useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { 
  IntelligentMeshSegmenter,
  MeshPart,
  findPartAtPoint
} from "@/utils/intelligentMeshSegmentation";
import { DecalSystem } from "@/utils/decalSystem";
import { PartTextureSystem } from "@/utils/partTextureSystem";
import DragDropHandler from "./DragDropHandler";
import { generateUVs } from "@/utils/meshUtils";
import type { DecalInstance } from "@/types/decal";
import type { DesignTool } from "@/components/design3d/BottomToolbar";
import { useIsMobile } from "@/hooks/use-mobile";

declare global {
  interface Window {
    __partTextureSystem?: PartTextureSystem;
  }
}

interface Model3DViewerProps {
  modelPath: string;
  productType: string;
  selectedPart: string | null;
  onPartClick: (partName: string) => void;
  onBlankCanvasClick?: () => void;
  onPartsDiscovered: (parts: string[]) => void;
  partColors: Record<string, string>;
  partTextures: Record<string, string>;
  decals?: DecalInstance[];
  activeDecalId?: string | null;
  onDecalSelect?: (decalId: string | null) => void;
  onDecalUpdate?: (decalId: string, update: Partial<DecalInstance>) => void;
  onDecalCreate?: (decal: DecalInstance) => void;
  onDecalDelete?: (decalId: string) => void;

  // Screenshot-style editor tools
  editorTool?: DesignTool;
  editorColor?: string;
  editorBrushSize?: number; // UI scale (5..80)
  editorPatternRotationDeg?: number;
  editorLockParts?: boolean;
  editorSelectedLogo?: string | null;
  editorSelectedPattern?: string | null;
  editorSelectedStamp?: string | null;
  partTextureSizes?: Record<string, number>;
  partTextureUVs?: Record<string, { u: number; v: number; meshUuid?: string }>;
  partTextureAnchors?: Record<string, { 
    position: { x: number; y: number; z: number };
    normal?: { x: number; y: number; z: number };
    meshUuid?: string;
  }>;
  visibleParts?: Record<string, boolean>;
  partOpacities?: Record<string, number>;
  onDragOver?: (partName: string | null) => void;
  onPartDrop?: (
    part: string,
    data: {
      type: 'color' | 'pattern' | 'logo' | 'stamp';
      value: string;
      uv?: { u: number; v: number };
      meshUuid?: string;
      worldPoint?: { x: number; y: number; z: number };
      worldNormal?: { x: number; y: number; z: number };
    }
  ) => void;
  onTextureRotationChange?: (partName: string, rotation: number) => void;
  onTextureFlipChange?: (partName: string, flipX: boolean, flipY: boolean) => void;
  cameraRef?: React.RefObject<THREE.PerspectiveCamera>;
  controlsRef?: React.RefObject<OrbitControlsImpl>;
  onDraggingDecalChange?: (isDragging: boolean) => void;
}

const WALLET_DESIGNABLE_MESHES = new Set<string>([
  'pCube1_lambert3_0',
  'pCube2_lambert3_0',
  'pCube3_lambert3_0',
  'pCube4_lambert3_0',
  'pCube5_lambert3_0',
]);

const WALLET_MESH_LABELS: Record<string, string> = {
  pCube1_lambert3_0: 'Mặt trước',
  pCube2_lambert3_0: 'Mặt sau',
  pCube3_lambert3_0: 'Ngăn thẻ trái',
  pCube4_lambert3_0: 'Ngăn thẻ phải',
  pCube5_lambert3_0: 'Gáy ví',
  pCylinder1_lambert3_0: 'Nút bấm',
};

function Model({ 
  modelPath,
  productType,
  selectedPart, 
  onPartClick,
  onBlankCanvasClick,
  onPartsDiscovered,
  partColors,
  partTextures,
  decals = [],
  activeDecalId,
  onDecalSelect,
  onDecalUpdate,
  onDecalCreate,
  onDecalDelete,
  partTextureSizes = {},
  partTextureUVs = {},
  partTextureAnchors = {},
  visibleParts = {},
  partOpacities = {},
  onDragOver,
  onPartDrop,
  onTextureRotationChange,
  onTextureFlipChange,
  cameraRef,
  controlsRef,
  onDraggingDecalChange,
  editorTool = 'move',
  editorColor = '#111827',
  editorBrushSize = 30,
  editorPatternRotationDeg = 0,
  editorLockParts = false,
  editorSelectedLogo = null,
  editorSelectedPattern = null,
  editorSelectedStamp = null
}: Model3DViewerProps) {
  const { scene } = useGLTF(modelPath);
  const { camera, gl, scene: r3fScene } = useThree();
  const [parts, setParts] = useState<MeshPart[]>([]);
  const [meshRef, setMeshRef] = useState<THREE.Mesh | null>(null);
  const [allMeshes, setAllMeshes] = useState<THREE.Mesh[]>([]); // Store all meshes for multi-mesh models
  const [decalSystem, setDecalSystem] = useState<DecalSystem | null>(null);
  const [partTextureSystem, setPartTextureSystem] = useState<PartTextureSystem | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const textureLoaderRef = useRef(new THREE.TextureLoader());
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const colorBuffersRef = useRef<Map<string, Float32Array>>(new Map());
  // Track which decal is being dragged (by decalId)
  const [draggingDecalId, setDraggingDecalId] = useState<string | null>(null);

  const paintTextureCacheRef = useRef<Map<string, string>>(new Map());
  const lastPaintPointRef = useRef<THREE.Vector3 | null>(null);
  const lastPaintAtRef = useRef<number>(0);

  const normalizePartKey = (value: string | null | undefined): string => {
    return (value ?? '').trim().toLowerCase();
  };

  const resolveOwningMeshForHit = (hitMesh: THREE.Mesh): THREE.Mesh => {
    const scopedMeshUuids = new Set(parts.filter((part) => !!part.meshUuid).map((part) => part.meshUuid as string));
    if (scopedMeshUuids.size === 0) return hitMesh;

    let current: THREE.Object3D | null = hitMesh;
    while (current) {
      if (current instanceof THREE.Mesh && scopedMeshUuids.has(current.uuid)) {
        return current;
      }
      current = current.parent;
    }

    return hitMesh;
  };

  const resolvePartFromHitMesh = (hitMesh: THREE.Mesh, worldPoint: THREE.Vector3): MeshPart | null => {
    const owningMesh = resolveOwningMeshForHit(hitMesh);
    const hasScopedParts = parts.some((part) => !!part.meshUuid);
    const localPoint = owningMesh.worldToLocal(worldPoint.clone());

    if (hasScopedParts) {
      const exactScoped = parts.filter((part) => part.meshUuid === owningMesh.uuid);
      if (exactScoped.length === 1) {
        return exactScoped[0];
      }
      if (exactScoped.length > 1) {
        const byBounds = findPartAtPoint(localPoint, exactScoped);
        if (byBounds) return byBounds;

        const byName = exactScoped.find((part) => normalizePartKey(part.name) === normalizePartKey(owningMesh.name));
        if (byName) return byName;

        return exactScoped[0];
      }

      // When parts are mesh-scoped, never fall through to cross-mesh resolution.
      return null;
    }

    if (owningMesh.name) {
      const byName = parts.find((part) => {
        if (normalizePartKey(part.name) !== normalizePartKey(owningMesh.name)) return false;
        if (!hasScopedParts) return true;
        return !part.meshUuid || part.meshUuid === owningMesh.uuid;
      });
      if (byName) return byName;
    }

    const scopedParts = hasScopedParts
      ? parts.filter((part) => !part.meshUuid || part.meshUuid === owningMesh.uuid)
      : parts;

    return findPartAtPoint(localPoint, scopedParts);
  };

  const resolveSurfacePlacementForPart = (
    part: MeshPart,
    targetMesh: THREE.Mesh
  ): { position: THREE.Vector3; normal: THREE.Vector3 } => {
    const centerWorld = targetMesh.localToWorld(part.center.clone());
    const toCamera = camera.position.clone().sub(centerWorld).normalize();
    const rayOrigin = centerWorld.clone().addScaledVector(toCamera, 3);
    const rayDirection = centerWorld.clone().sub(rayOrigin).normalize();

    const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);
    const hits = raycaster.intersectObject(targetMesh, true);

    if (hits.length > 0) {
      const hit = hits[0];
      const hitMesh = hit.object as THREE.Mesh;
      let worldNormal = toCamera.clone().negate();
      if (hit.face?.normal) {
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hitMesh.matrixWorld);
        worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
      }

      if (worldNormal.dot(toCamera) > 0) {
        worldNormal.negate();
      }

      return {
        position: hit.point.clone().addScaledVector(worldNormal, 0.002),
        normal: worldNormal,
      };
    }

    const fallbackNormal = toCamera.clone().negate();
    return {
      position: centerWorld.clone().addScaledVector(fallbackNormal, 0.002),
      normal: fallbackNormal,
    };
  };

  const getCircleDataUrl = (hex: string): string => {
    const key = `circle:${hex}`;
    const cached = paintTextureCacheRef.current.get(key);
    if (cached) return cached;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const r = size / 2;
    const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, hex);
    grad.addColorStop(0.7, hex);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fill();

    const url = canvas.toDataURL('image/png');
    paintTextureCacheRef.current.set(key, url);
    return url;
  };

  const uiSizeToWorld = (v: number): number => {
    // Tune to roughly match screenshot scale
    return Math.max(0.05, Math.min(1.2, v / 120));
  };

  const ensureUniqueMaterials = (mesh: THREE.Mesh) => {
    const flag = '__uniqueMaterialCloned';
    if ((mesh.userData as Record<string, unknown>)[flag]) return;

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => (m ? m.clone() : m));
    } else if (mesh.material) {
      mesh.material = mesh.material.clone();
    }

    (mesh.userData as Record<string, unknown>)[flag] = true;
  };

  const ensureMaterialBaseColor = (material: THREE.MeshStandardMaterial) => {
    const data = material.userData as { __baseColorHex?: number };
    if (typeof data.__baseColorHex !== 'number') {
      data.__baseColorHex = material.color.getHex();
    }
  };

  const getMaterialBaseColor = (material: THREE.MeshStandardMaterial): THREE.Color => {
    const data = material.userData as { __baseColorHex?: number };
    if (typeof data.__baseColorHex === 'number') {
      return new THREE.Color(data.__baseColorHex);
    }

    return material.color.clone();
  };

  // Initialize parts using intelligent segmentation
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    
    // Deep traverse to find all meshes
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Important: prevent shared material references across meshes.
        ensureUniqueMaterials(child);
        meshes.push(child);
      }
    });
    
    // Mesh 10 (index 9) will be included and displayed normally
    
    if (meshes.length === 0) {
      // Fallback: try to find mesh in scene.children directly
      const directMeshes = scene.children.filter(child => child instanceof THREE.Mesh) as THREE.Mesh[];
      if (directMeshes.length > 0) {
        meshes.push(...directMeshes);
      } else {
        return;
      }
    }
    
    // ─── AUTO-FIT: normalise model so it always fills the viewport nicely ───
    // Reset any previous normalisation that was baked into the cached scene
    scene.scale.setScalar(1);
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    {
      const combinedBox = new THREE.Box3();
      meshes.forEach((m) => {
        m.geometry.computeBoundingBox();
        const worldBox = m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld);
        combinedBox.union(worldBox);
      });
      if (!combinedBox.isEmpty()) {
        const bbCenter = new THREE.Vector3();
        combinedBox.getCenter(bbCenter);
        const bbSize = new THREE.Vector3();
        combinedBox.getSize(bbSize);
        const maxDim = Math.max(bbSize.x, bbSize.y, bbSize.z);
        if (maxDim > 0.001) {
          const TARGET_SIZE = 2.5; // target max dimension in Three.js world units
          const autoScale = TARGET_SIZE / maxDim;
          scene.scale.setScalar(autoScale);
          scene.position.set(
            -bbCenter.x * autoScale,
            -bbCenter.y * autoScale,
            -bbCenter.z * autoScale
          );
          scene.updateMatrixWorld(true);
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Check if we have multiple meshes (pre-segmented model)
    // If we have multiple meshes with meaningful names, use them as separate parts
    const hasMultipleMeshes = meshes.length > 1;
    const hasNamedMeshes = meshes.some(m => m.name && m.name.trim() !== '');
    
    if (hasMultipleMeshes && hasNamedMeshes) {
      // Create parts from individual meshes
      const createdParts: MeshPart[] = [];
      const pickableMeshes: THREE.Mesh[] = [];

      const meshStats = meshes
        .filter((mesh) => !!mesh.geometry?.attributes?.position)
        .map((mesh) => {
          if (!mesh.geometry.boundingBox) {
            mesh.geometry.computeBoundingBox();
          }

          const bounds = mesh.geometry.boundingBox!.clone();
          const size = new THREE.Vector3();
          bounds.getSize(size);
          const volume = Math.max(0, size.x * size.y * size.z);
          const vertexCount = mesh.geometry.attributes.position.count;

          return {
            mesh,
            bounds,
            volume,
            vertexCount,
          };
        });

      const isWalletAccessoryMesh = (meshName: string): boolean => {
        if (productType !== 'wallet') return false;
        return !WALLET_DESIGNABLE_MESHES.has(meshName);
      };
      
      meshStats.forEach(({ mesh, bounds, volume }, index) => {
        if (!mesh.geometry.attributes.position) return;

        const rawMeshName = (mesh.name || '').trim();
        const isAccessory = isWalletAccessoryMesh(rawMeshName);
        mesh.userData.__designPickable = !isAccessory;
        
        // Include all meshes including mesh 10 (index 9) - make visible and configure
        mesh.visible = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        
        // Ensure material supports vertex colors
        const materials = Array.isArray(mesh.material) 
          ? mesh.material 
          : [mesh.material];
        
        materials.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial) {
            ensureMaterialBaseColor(material);
            // Don't enable vertexColors until we have color attribute
            // It will be enabled when colors are applied
            material.metalness = 0.05;
            material.roughness = 0.85;
            material.side = THREE.DoubleSide;
            material.needsUpdate = true;
          }
        });
        
        // Ensure UV coordinates exist
        generateUVs(mesh.geometry);
        
        // Create vertex indices set for this mesh
        const vertexIndices = new Set<number>();
        const positions = mesh.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          vertexIndices.add(i);
        }
        
        // Calculate bounds and center
        const center = new THREE.Vector3();

        bounds.getCenter(center);
        
        // Keep part keys consistent with mesh names so new models are auto-supported.
        const partName = rawMeshName !== ''
          ? (productType === 'wallet' ? WALLET_MESH_LABELS[rawMeshName] || rawMeshName : rawMeshName)
          : `Bộ phận ${index + 1}`;

        if (isAccessory) {
          return;
        }
        
        createdParts.push({
          name: partName,
          vertexIndices,
          center,
          bounds,
          volume,
          meshUuid: mesh.uuid
        });

        pickableMeshes.push(mesh);
      });
      
      // Use the largest mesh as main mesh for rendering
      const mainMesh = meshes.reduce((largest, current) => {
        const largestCount = largest.geometry?.attributes.position?.count || 0;
        const currentCount = current.geometry?.attributes.position?.count || 0;
        return currentCount > largestCount ? current : largest;
      }, meshes[0]);
      
      setMeshRef(mainMesh);
      setAllMeshes(pickableMeshes.length > 0 ? pickableMeshes : meshes);
      setParts(createdParts);
      
      // Initialize systems
      const decalSys = new DecalSystem(mainMesh);
      setDecalSystem(decalSys);
      
      const partTexSys = new PartTextureSystem(mainMesh);
      setPartTextureSystem(partTexSys);
      
      const partNames = createdParts.map(p => p.name);
      onPartsDiscovered(partNames);
      
      return;
    }
    
    // Otherwise, use intelligent segmentation on the largest mesh
    const mainMesh = meshes.reduce((largest, current) => {
      const largestCount = largest.geometry?.attributes.position?.count || 0;
      const currentCount = current.geometry?.attributes.position?.count || 0;
      return currentCount > largestCount ? current : largest;
    }, meshes[0]);
    
    if (!mainMesh.geometry.attributes.position) {
      return;
    }
    
    setMeshRef(mainMesh);
    setAllMeshes([mainMesh]);
    
    // Make mesh visible and configure
    mainMesh.visible = true;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    mainMesh.frustumCulled = false; // Prevent culling issues
    
    // Ensure material supports vertex colors
    const materials = Array.isArray(mainMesh.material) 
      ? mainMesh.material 
      : [mainMesh.material];
    
    materials.forEach(material => {
      if (material instanceof THREE.MeshStandardMaterial) {
        ensureMaterialBaseColor(material);
        // Don't enable vertexColors until we have color attribute
        // It will be enabled when colors are applied
        material.metalness = 0.05;
        material.roughness = 0.85;
        material.side = THREE.DoubleSide; // Render both sides
        material.needsUpdate = true;
      }
    });
    
    // Ensure UV coordinates exist (required for texture mapping)
    generateUVs(mainMesh.geometry);
    
    // Use intelligent segmentation
    try {
      const segmenter = new IntelligentMeshSegmenter(mainMesh.geometry, productType);
      const createdParts = segmenter.segment();
      // Tag parts with the mesh UUID so we can scope picking in multi-mesh scenes.
      createdParts.forEach((p) => {
        p.meshUuid = mainMesh.uuid;
      });
      
      setParts(createdParts);
      
      // Initialize decal system
      const decalSys = new DecalSystem(mainMesh);
      setDecalSystem(decalSys);
      
      // Initialize part texture system for per-part texture application
      const partTexSys = new PartTextureSystem(mainMesh);
      setPartTextureSystem(partTexSys);
      
      const partNames = createdParts.map(p => p.name);
      onPartsDiscovered(partNames);
    } catch {
      setParts([]);
      setDecalSystem(null);
      onPartsDiscovered([]);
    }
    
  }, [scene, productType, modelPath, onPartsDiscovered]);

  // Apply visibility and opacity to parts
  useEffect(() => {
    if (allMeshes.length === 0) return;

    allMeshes.forEach(mesh => {
      const partName =
        parts.find((part) => part.meshUuid === mesh.uuid)?.name ||
        mesh.name;
      if (!partName) return;
      
      // Apply visibility
      const isVisible = visibleParts[partName] !== false;
      mesh.visible = isVisible;
      
      // Apply opacity
      const opacity = partOpacities[partName] ?? 1;
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      
      if (material instanceof THREE.MeshStandardMaterial) {
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.needsUpdate = true;
      }
    });
  }, [allMeshes, visibleParts, partOpacities, parts]);

  // Apply colors to parts
  useEffect(() => {
    if (!meshRef || parts.length === 0) return;

      const hasExplicitPartColors = Object.keys(partColors).length > 0;
      const shouldUseVertexColors = hasExplicitPartColors || !!selectedPart;

      // Get all meshes in scene (for multi-mesh models) - use cached allMeshes state
      const allMeshesToUse = allMeshes.length > 0 ? allMeshes : (() => {
        // Fallback: traverse scene if allMeshes not yet populated
        const meshes: THREE.Mesh[] = [];
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child);
          }
        });
        return meshes;
      })();
      
      const hasMultipleMeshes = allMeshesToUse.length > 1;
    
    // Apply colors to each mesh
    allMeshesToUse.forEach(mesh => {
      const geometry = mesh.geometry;
      const material = Array.isArray(mesh.material)
        ? mesh.material[0]
        : mesh.material;
      
      if (!(material instanceof THREE.MeshStandardMaterial)) {
        return;
      }

      const baseColor = getMaterialBaseColor(material);

      if (!shouldUseVertexColors) {
        material.vertexColors = false;
        material.color.copy(baseColor);
        material.needsUpdate = true;

        if (partTextureSystem) {
          partTextureSystem.markBaseLayerDirty(mesh);
        }

        return;
      }

      // Enable vertex colors when highlighting or applying part colors.
      material.vertexColors = true;
      
      const positions = geometry.attributes.position;
      const bufferKey = mesh.uuid;
      let colorArray = colorBuffersRef.current.get(bufferKey);
      if (!colorArray || colorArray.length !== positions.count * 3) {
        colorArray = new Float32Array(positions.count * 3);
        colorBuffersRef.current.set(bufferKey, colorArray);
      }
      // Reset base to the mesh material color so the model keeps its default look.
      for (let i = 0; i < colorArray.length; i += 3) {
        colorArray[i] = baseColor.r;
        colorArray[i + 1] = baseColor.g;
        colorArray[i + 2] = baseColor.b;
      }
      
      // Find the part that corresponds to this mesh
      let correspondingPart: MeshPart | null = null;
      if (hasMultipleMeshes) {
        correspondingPart =
          parts.find((part) => part.meshUuid === mesh.uuid) ||
          (mesh.name
            ? parts.find((part) => normalizePartKey(part.name) === normalizePartKey(mesh.name) && (!part.meshUuid || part.meshUuid === mesh.uuid)) || null
            : null);
      } else if (!hasMultipleMeshes) {
        // For single mesh models, apply colors based on vertex indices
        // This will be handled by the main mesh logic below
      }
      
      // If we found a corresponding part for this mesh, apply its color
      if (correspondingPart) {
        let finalColor = baseColor.clone();
        const scopedColorKey = `${correspondingPart.name}::${mesh.uuid}`;
        
        if (partColors[scopedColorKey]) {
          finalColor = new THREE.Color(partColors[scopedColorKey]);
        } else if (partColors[correspondingPart.name]) {
          finalColor = new THREE.Color(partColors[correspondingPart.name]);
        }
        
        if (correspondingPart.name === selectedPart) {
          const highlightColor = new THREE.Color(0x3b82f6);
          finalColor = finalColor.clone().lerp(highlightColor, 0.3);
        }
        
        // Apply color to all vertices in this mesh
        for (let i = 0; i < colorArray.length; i += 3) {
          colorArray[i] = finalColor.r;
          colorArray[i + 1] = finalColor.g;
          colorArray[i + 2] = finalColor.b;
        }
      } else if (!hasMultipleMeshes) {
        // For single mesh models, apply colors based on vertex indices
        parts.forEach(part => {
          let finalColor = baseColor.clone();
          const scopedColorKey = `${part.name}::${mesh.uuid}`;
          
          if (partColors[scopedColorKey]) {
            finalColor = new THREE.Color(partColors[scopedColorKey]);
          } else if (partColors[part.name]) {
            finalColor = new THREE.Color(partColors[part.name]);
          }
          
          if (part.name === selectedPart) {
            const highlightColor = new THREE.Color(0x3b82f6);
            finalColor = finalColor.clone().lerp(highlightColor, 0.3);
          }
          
          // Apply to all vertices in this part
          part.vertexIndices.forEach(index => {
            if (index < positions.count) {
              colorArray[index * 3] = finalColor.r;
              colorArray[index * 3 + 1] = finalColor.g;
              colorArray[index * 3 + 2] = finalColor.b;
            }
          });
        });
      }
      
      // Update or create color attribute
      if (!geometry.attributes.color) {
        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        // Now enable vertexColors after we have the color attribute
        material.vertexColors = true;
      } else {
        const existingColors = geometry.attributes.color;
        const arr = existingColors.array as Float32Array;
        if (arr.length === colorArray.length) {
          arr.set(colorArray);
        } else {
          // Geometry changed; replace the attribute to match new buffer size
          geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        }
        existingColors.needsUpdate = true;
        // Ensure vertexColors is enabled
        material.vertexColors = true;
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeBoundingSphere();
      material.needsUpdate = true;

      // If textures are used on this mesh, tell the texture system the base layer changed.
      if (partTextureSystem) {
        partTextureSystem.markBaseLayerDirty(mesh);
      }
    });
    
  }, [scene, meshRef, parts, selectedPart, partColors, partTextures, partTextureSystem, allMeshes]);

  // Sync decals to scene (multi decal instances; supports overlap)
  useEffect(() => {
    if (!meshRef || !decalSystem || parts.length === 0) return;

    const timeoutId = setTimeout(() => {
      // Clear any legacy canvas maps from PartTextureSystem to avoid UV-repeat artifacts
      const meshesToClear = allMeshes.length > 0 ? allMeshes : [meshRef];
      meshesToClear.forEach((m) => {
        const material = Array.isArray(m.material) ? m.material[0] : m.material;
        if (material instanceof THREE.MeshStandardMaterial && material.map instanceof THREE.CanvasTexture) {
          material.map = null;
          material.needsUpdate = true;
        }
      });

      const desired = decals;
      const desiredIds = new Set(desired.map((d) => d.id));
      const existing = decalSystem.getDecals();

      // Remove decals that are no longer present
      existing.forEach((d) => {
        if (!desiredIds.has(d.id)) {
          decalSystem.removeDecal(d.id);
        }
      });

      // Add / update desired decals (order also controls layering)
      desired.forEach((d, index) => {
        const targetMesh = d.meshUuid
          ? allMeshes.find((m) => m.uuid === d.meshUuid) || meshRef
          : meshRef;

        const part = d.meshUuid
          ? parts.find((p) => p.meshUuid === d.meshUuid)
          : parts.find((p) => normalizePartKey(p.name) === normalizePartKey(d.partName));

        let worldPos: THREE.Vector3;
        let worldNormal: THREE.Vector3;
        if (d.position) {
          worldPos = new THREE.Vector3(d.position.x, d.position.y, d.position.z);
          worldNormal = d.normal
            ? new THREE.Vector3(d.normal.x, d.normal.y, d.normal.z).normalize()
            : new THREE.Vector3(0, 0, 1);
        } else {
          if (part) {
            const placement = resolveSurfacePlacementForPart(part, targetMesh);
            worldPos = placement.position;
            worldNormal = placement.normal;
          } else {
            const fallback = new THREE.Vector3();
            targetMesh.getWorldPosition(fallback);
            worldPos = fallback;
            worldNormal = new THREE.Vector3(0, 0, 1);
          }
          onDecalUpdate?.(d.id, {
            position: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
            normal: { x: worldNormal.x, y: worldNormal.y, z: worldNormal.z },
            meshUuid: targetMesh.uuid,
          });
        }

        const exists = existing.some((ex) => ex.id === d.id);
        if (!exists) {
          const decalId = decalSystem.addDecal(
            d.value,
            worldPos,
            worldNormal,
            d.partName,
            d.size,
            {
              id: d.id,
              rotation: d.rotation,
              color: d.color,
              flipX: d.flipX,
              flipY: d.flipY,
              targetMesh,
              clipPart: part,
              renderOrder: 900 + index,
            }
          );
          // Update decal with additional properties
          decalSystem.updateDecal(decalId, {
            rotation: d.rotation,
            color: d.color,
            flipX: d.flipX,
            flipY: d.flipY,
            targetMesh,
            renderOrder: 900 + index
          });
        } else {
          decalSystem.updateDecal(d.id, {
            texture: d.value,
            position: worldPos,
            normal: worldNormal,
            size: d.size,
            rotation: d.rotation,
            color: d.color,
            flipX: d.flipX,
            flipY: d.flipY,
            targetMesh,
            clipPart: part,
            renderOrder: 900 + index
          });
        }
      });
    }, 60);

    return () => clearTimeout(timeoutId);
  }, [meshRef, decalSystem, parts, decals, allMeshes, onDecalUpdate]);

  // Highlight active decal and optionally focus camera on it.
  useEffect(() => {
    if (!decalSystem) return;

    const meshes = decalSystem.getDecalMeshes();
    meshes.forEach((m) => {
      const decalId = (m.userData as { decalId?: string }).decalId;
      const material = m.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = decalId && activeDecalId && decalId === activeDecalId ? 1 : 0.85;
        material.needsUpdate = true;
      }
    });

    if (!activeDecalId) return;
    const active = decals.find((d) => d.id === activeDecalId);
    if (!active) return;

    const orbit = controlsRef?.current;
    if (!orbit) return;

    const targetMesh = active.meshUuid
      ? allMeshes.find((m) => m.uuid === active.meshUuid) || meshRef
      : meshRef;
    if (!targetMesh) return;

    const part = parts.find((p) => p.name === active.partName && (!p.meshUuid || p.meshUuid === targetMesh.uuid));
    if (!part) return;

    const targetWorld = targetMesh.localToWorld(part.center.clone());

    const currentCam = cameraRef?.current ?? camera;
    const oldTarget = orbit.target.clone();
    const dist = currentCam.position.distanceTo(oldTarget);
    const dir = currentCam.position.clone().sub(oldTarget);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    dir.normalize();

    orbit.target.copy(targetWorld);
    currentCam.position.copy(targetWorld.clone().add(dir.multiplyScalar(dist)));
    orbit.update();
  }, [activeDecalId, allMeshes, decals, decalSystem, meshRef, parts, controlsRef, cameraRef, camera]);

  // Expose partTextureSystem methods via callbacks
  useEffect(() => {
    if (!partTextureSystem || !onTextureRotationChange || !onTextureFlipChange) return;
    
    // Store callbacks in window for access (temporary solution)
    window.__partTextureSystem = partTextureSystem;
    
    return () => {
      delete window.__partTextureSystem;
    };
  }, [partTextureSystem, onTextureRotationChange, onTextureFlipChange]);

  // Handle mouse interactions
  useEffect(() => {
    if (!meshRef) return;
    
    const canvas = gl.domElement;
    
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // Prefer selecting decals if clicked on one.
      if (decalSystem) {
        const decalMeshes = decalSystem.getDecalMeshes();
        const decalHits = raycasterRef.current.intersectObjects(decalMeshes, false);
        if (decalHits.length > 0) {
          const hitMesh = decalHits[0].object as THREE.Mesh;
          const decalId = (hitMesh.userData as { decalId?: string }).decalId;
          if (decalId) {
            onDecalSelect?.(decalId);
            const d = decals.find((x) => x.id === decalId);
            if (d) onPartClick(d.partName);
            return;
          }
        }
      }

      // Tool-based placement (logo/stamp/pattern) on click
      const clickPlace =
        (editorTool === 'logo' && editorSelectedLogo) ||
        (editorTool === 'stamp' && editorSelectedStamp) ||
        (editorTool === 'pattern' && editorSelectedPattern);

      if (clickPlace && onDecalCreate) {
        const meshPool = allMeshes.length > 0 ? allMeshes : [meshRef];
        let hits = raycasterRef.current.intersectObjects(meshPool, true);
        if (hits.length === 0) hits = raycasterRef.current.intersectObject(meshRef, false);
        if (hits.length > 0) {
          const hit = hits[0];
          const hitMesh = hit.object as THREE.Mesh;
          const point = hit.point;
          const part = resolvePartFromHitMesh(hitMesh, point);
          if (part) {
            const id = globalThis.crypto && 'randomUUID' in globalThis.crypto
              ? globalThis.crypto.randomUUID()
              : `decal_${Date.now()}_${Math.random().toString(16).slice(2)}`;
            let normal = new THREE.Vector3(0, 0, 1);
            if (hit.face?.normal) {
              const normalMatrix = new THREE.Matrix3().getNormalMatrix(hitMesh.matrixWorld);
              normal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
            }

            const decalType = editorTool === 'stamp' ? 'stamp' : editorTool === 'pattern' ? 'pattern' : 'logo';
            const decalValue = editorTool === 'stamp'
              ? editorSelectedStamp!
              : editorTool === 'pattern'
                ? editorSelectedPattern!
                : editorSelectedLogo!;

            const targetMesh = resolveOwningMeshForHit(hitMesh);

            onDecalCreate({
              id,
              type: decalType,
              value: decalValue,
              partName: part.name,
              meshUuid: targetMesh.uuid,
              position: { x: point.x, y: point.y, z: point.z },
              normal: { x: normal.x, y: normal.y, z: normal.z },
              size: productType === 'wallet' ? 0.8 : 0.5,
              rotation: editorTool === 'pattern' ? (editorPatternRotationDeg * Math.PI) / 180 : 0,
              flipX: false,
              flipY: false,
              color: editorColor,
            });
            onDecalSelect?.(id);
            onPartClick(part.name);
            return;
          }
        } else {
          onBlankCanvasClick?.();
        }
      }
      
      // Check if clicking on a part with texture (for moving logo on surface)
      // We'll detect this by checking if the clicked part has a texture
      
      // Raycast to all meshes in scene (in case of multiple meshes)
      const allMeshes: THREE.Mesh[] = [];
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if ((child.userData as { __designPickable?: boolean }).__designPickable === false) {
            return;
          }
          allMeshes.push(child);
        }
      });
      
      // Try to intersect with all meshes, prioritizing the clicked mesh
      let intersects = raycasterRef.current.intersectObjects(allMeshes, false);
      
      // If no intersection with all meshes, try with main mesh
      if (intersects.length === 0) {
        intersects = raycasterRef.current.intersectObject(meshRef, false);
      }
      
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const point = intersection.point;
        const clickedMesh = intersection.object as THREE.Mesh;
        const part = resolvePartFromHitMesh(clickedMesh, point);
        if (part) {
          onPartClick(part.name);
        } else {
          onBlankCanvasClick?.();
        }
      } else {
        onBlankCanvasClick?.();
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!meshRef) return;

      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // Start dragging if mouse is down on a decal.
      if (decalSystem) {
        const decalMeshes = decalSystem.getDecalMeshes();
        const decalHits = raycasterRef.current.intersectObjects(decalMeshes, false);
        if (decalHits.length > 0) {
          const hitMesh = decalHits[0].object as THREE.Mesh;
          const decalId = (hitMesh.userData as { decalId?: string }).decalId;
          if (decalId) {
            setDraggingDecalId(decalId);
            onDecalSelect?.(decalId);
            onDraggingDecalChange?.(true);
            return;
          }
        }
      }

      // Start painting / erasing
      if ((editorTool === 'brush' || editorTool === 'pattern' || editorTool === 'eraser') && decalSystem) {
        lastPaintPointRef.current = null;
        lastPaintAtRef.current = 0;
      }

      // Otherwise fall back to normal part selection via click.
    };
    
    const handleMouseUp = () => {
      if (draggingDecalId) {
        setDraggingDecalId(null);
        onDraggingDecalChange?.(false);
      }
      lastPaintPointRef.current = null;
    };
    
    // Throttle drag updates for better performance
    let lastDragUpdateTime = 0;
    const DRAG_UPDATE_THROTTLE = 50; // Update every 50ms during drag

      // Cache vertex indices list per part+mesh for faster nearest-vertex lookup
      const partVertexIndexListCache = new Map<string, number[]>();
      const getPartVertexIndexList = (part: MeshPart, mesh: THREE.Mesh): number[] => {
      const key = `${mesh.uuid}:${part.name}`;
      const cached = partVertexIndexListCache.get(key);
      if (cached) return cached;
      const list = Array.from(part.vertexIndices);
      partVertexIndexListCache.set(key, list);
      return list;
    };

      const findClosestVertexInPart = (
        part: MeshPart,
        mesh: THREE.Mesh,
        worldPoint: THREE.Vector3
      ): { position: THREE.Vector3; normal: THREE.Vector3 } | null => {
        const geometry = mesh.geometry;
        const posAttr = geometry.attributes.position;
        const normalAttr = geometry.attributes.normal;
        if (!posAttr) return null;

        const localPoint = mesh.worldToLocal(worldPoint.clone());
        const indices = getPartVertexIndexList(part, mesh);

        let bestIndex = -1;
        let bestDistSq = Infinity;
        for (let i = 0; i < indices.length; i++) {
          const vi = indices[i];
          if (vi >= posAttr.count) continue;
          const vx = posAttr.getX(vi);
          const vy = posAttr.getY(vi);
          const vz = posAttr.getZ(vi);
          const dx = vx - localPoint.x;
          const dy = vy - localPoint.y;
          const dz = vz - localPoint.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < bestDistSq) {
            bestDistSq = distSq;
            bestIndex = vi;
          }
        }

        if (bestIndex === -1) return null;

        const localPos = new THREE.Vector3(posAttr.getX(bestIndex), posAttr.getY(bestIndex), posAttr.getZ(bestIndex));
        const worldPos = mesh.localToWorld(localPos);

        let worldNormal = new THREE.Vector3(0, 0, 1);
        if (normalAttr && bestIndex < normalAttr.count) {
          const localNormal = new THREE.Vector3(
            normalAttr.getX(bestIndex),
            normalAttr.getY(bestIndex),
            normalAttr.getZ(bestIndex)
          ).normalize();
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
          worldNormal = localNormal.applyMatrix3(normalMatrix).normalize();
        }

        return { position: worldPos, normal: worldNormal };
      };
    
    const handleMouseDrag = (event: MouseEvent) => {
      if (!draggingDecalId || !meshRef || !decalSystem) return;

      // Only drag while holding left mouse button.
      if ((event.buttons & 1) !== 1) return;
      
      const now = Date.now();
      if (now - lastDragUpdateTime < DRAG_UPDATE_THROTTLE) {
        return; // Skip if called too soon
      }
      lastDragUpdateTime = now;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      const draggingDecal = decals.find((d) => d.id === draggingDecalId);
      if (!draggingDecal) return;

      const part = parts.find((p) => {
        if (p.name !== draggingDecal.partName) return false;
        if (!draggingDecal.meshUuid) return true;
        return !p.meshUuid || p.meshUuid === draggingDecal.meshUuid;
      });
      if (!part) return;

      // Raycast to the whole model so the user can drag anywhere on the model surface.
      const modelIntersects = raycasterRef.current.intersectObjects(
        cachedAllMeshes.length > 0 ? cachedAllMeshes : [meshRef],
        false
      );
      if (modelIntersects.length === 0) return;

      const hit = modelIntersects[0];

      const hitMesh = hit.object as THREE.Mesh;
      const targetMesh = draggingDecal.meshUuid
        ? cachedAllMeshes.find((m) => m.uuid === draggingDecal.meshUuid) || hitMesh
        : hitMesh;

      // Move the decal by snapping to the closest vertex on the selected part.
      const snapped = findClosestVertexInPart(part, targetMesh, hit.point);
      if (!snapped) return;

      decalSystem.updateDecal(draggingDecalId, {
        position: snapped.position,
        normal: snapped.normal,
        targetMesh,
        clipPart: part
      });

      onDecalUpdate?.(draggingDecalId, {
        position: { x: snapped.position.x, y: snapped.position.y, z: snapped.position.z },
        normal: { x: snapped.normal.x, y: snapped.normal.y, z: snapped.normal.z },
        meshUuid: targetMesh.uuid
      });
    };

    const handlePaintOrErase = (event: MouseEvent) => {
      if (!meshRef || !decalSystem) return;
      if (!(editorTool === 'brush' || editorTool === 'pattern' || editorTool === 'eraser')) return;

      // Only act while mouse button is down
      if ((event.buttons & 1) !== 1) return;

      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const meshes: THREE.Mesh[] = [];
      scene.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        if ((child.userData as { __designPickable?: boolean }).__designPickable === false) return;
        meshes.push(child);
      });
      let hits = raycasterRef.current.intersectObjects(meshes, false);
      if (hits.length === 0) hits = raycasterRef.current.intersectObject(meshRef, false);
      if (hits.length === 0) return;

      const hit = hits[0];
      const hitMesh = hit.object as THREE.Mesh;
      const point = hit.point;

      const now = performance.now();
      const minMs = 35;
      const minDist = uiSizeToWorld(editorBrushSize) * 0.4;
      if (lastPaintAtRef.current && now - lastPaintAtRef.current < minMs) return;
      if (lastPaintPointRef.current && lastPaintPointRef.current.distanceTo(point) < minDist) return;
      lastPaintAtRef.current = now;
      lastPaintPointRef.current = point.clone();

      let normal = new THREE.Vector3(0, 0, 1);
      if (hit.face?.normal) {
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hitMesh.matrixWorld);
        normal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
      }

      if (editorTool === 'eraser') {
        if (!onDecalDelete) return;
        const radius = uiSizeToWorld(editorBrushSize) * 0.8;
        decals
          .filter((d) => d.type === 'paint')
          .forEach((d) => {
            if (!d.position) return;
            const dp = new THREE.Vector3(d.position.x, d.position.y, d.position.z);
            if (dp.distanceTo(point) <= radius) {
              onDecalDelete(d.id);
            }
          });
        return;
      }

      // In paint modes, default to painting across the whole model unless the user explicitly locks parts.
      // We still keep meshUuid so the projection targets the correct mesh in multi-mesh models.
      const partName = editorLockParts && selectedPart ? selectedPart : '__ALL__';

      if (!onDecalCreate) return;

      if (editorTool === 'pattern' && !editorSelectedPattern) return;

      const id = globalThis.crypto && 'randomUUID' in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `decal_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const value = editorTool === 'pattern'
        ? editorSelectedPattern!
        : getCircleDataUrl(editorColor);

      onDecalCreate({
        id,
        type: 'paint',
        value,
        partName,
        meshUuid: hitMesh.uuid,
        position: { x: point.x, y: point.y, z: point.z },
        normal: { x: normal.x, y: normal.y, z: normal.z },
        size: uiSizeToWorld(editorBrushSize),
        rotation: editorTool === 'pattern' ? (editorPatternRotationDeg * Math.PI) / 180 : 0,
        flipX: false,
        flipY: false,
        color: editorTool === 'pattern' ? editorColor : '#ffffff',
      });
    };
    
    // Cache all meshes to avoid traversing scene on every mouse move
    let cachedAllMeshes: THREE.Mesh[] = [];
    const updateCachedMeshes = () => {
      cachedAllMeshes = [];
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if ((child.userData as { __designPickable?: boolean }).__designPickable === false) {
            return;
          }
          cachedAllMeshes.push(child);
        }
      });
    };
    updateCachedMeshes();
    
    // Throttle mouse move for better performance
    let lastMouseMoveTime = 0;
    const MOUSE_MOVE_THROTTLE = 16; // ~60fps
    
    const handleMouseMove = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouseMoveTime < MOUSE_MOVE_THROTTLE) {
        return; // Skip if called too soon
      }
      lastMouseMoveTime = now;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      // Use cached meshes instead of traversing scene
      const intersects = raycasterRef.current.intersectObjects(
        cachedAllMeshes.length > 0 ? cachedAllMeshes : [meshRef], 
        false
      );
      
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const point = intersection.point;
        const hoveredMesh = intersection.object as THREE.Mesh;
        const part = resolvePartFromHitMesh(hoveredMesh, point);
        
        canvas.style.cursor = 'pointer';
        
        if (onDragOver && part) {
          onDragOver(part.name);
        } else if (onDragOver) {
          onDragOver(null);
        }
      } else {
        canvas.style.cursor = 'default';
        if (onDragOver) {
          onDragOver(null);
        }
      }
    };
    
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    
    // Use passive listeners for better performance
    const mouseMoveHandler = (e: MouseEvent) => {
      handleMouseMove(e);
      handleMouseDrag(e);
      handlePaintOrErase(e);
    };
    
    canvas.addEventListener('mousemove', mouseMoveHandler, { passive: true });
    canvas.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handleMouseUp); // Also listen on document for mouse up outside canvas
    
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', mouseMoveHandler);
      canvas.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [meshRef, parts, camera, gl, onPartClick, onBlankCanvasClick, onDragOver, scene, allMeshes, decalSystem, decals, draggingDecalId, onDecalSelect, onDecalUpdate, onDraggingDecalChange, editorTool, editorColor, editorBrushSize, editorPatternRotationDeg, editorLockParts, editorSelectedLogo, editorSelectedPattern, editorSelectedStamp, onDecalCreate, onDecalDelete, selectedPart]);

  return (
    <>
      {meshRef && parts.length > 0 && onPartDrop && (
        <DragDropHandler
          meshRef={meshRef}
          allMeshes={allMeshes}
          parts={parts}
          productType={productType}
          selectedPart={selectedPart}
          onPartDrop={onPartDrop}
        />
      )}
      <primitive object={scene} scale={1} />
    </>
  );
}

export function Model3DViewer({
  modelPath,
  productType,
  selectedPart,
  onPartClick,
  onBlankCanvasClick,
  onPartsDiscovered,
  partColors,
  partTextures,
  decals = [],
  activeDecalId,
  onDecalSelect,
  onDecalUpdate,
  onDecalCreate,
  onDecalDelete,
  partTextureSizes = {},
  partTextureUVs = {},
  partTextureAnchors = {},
  visibleParts = {},
  partOpacities = {},
  onDragOver,
  onPartDrop,
  onTextureRotationChange,
  onTextureFlipChange,
  cameraRef,
  controlsRef,
  editorTool,
  editorColor,
  editorBrushSize,
  editorPatternRotationDeg,
  editorLockParts,
  editorSelectedLogo,
  editorSelectedPattern,
  editorSelectedStamp
}: Model3DViewerProps) {
  const [isDraggingDecal, setIsDraggingDecal] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg overflow-hidden shadow-lg">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={isMobile ? [1, 1.2] : [1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{ 
          preserveDrawingBuffer: true, 
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? "default" : "high-performance"
        }}
      >
        <color attach="background" args={['#f0f0f0']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 5]} fov={50} />
        <Model
          modelPath={modelPath}
          productType={productType}
          selectedPart={selectedPart}
          onPartClick={onPartClick}
          onBlankCanvasClick={onBlankCanvasClick}
          onPartsDiscovered={onPartsDiscovered}
          partColors={partColors}
          partTextures={partTextures}
          partTextureSizes={partTextureSizes}
          partTextureUVs={partTextureUVs}
          partTextureAnchors={partTextureAnchors}
          visibleParts={visibleParts}
          partOpacities={partOpacities}
          onDragOver={onDragOver}
          onPartDrop={onPartDrop}
          onTextureRotationChange={onTextureRotationChange}
          onTextureFlipChange={onTextureFlipChange}
          decals={decals}
          activeDecalId={activeDecalId}
          onDecalSelect={onDecalSelect}
          onDecalUpdate={onDecalUpdate}
          onDecalCreate={onDecalCreate}
          onDecalDelete={onDecalDelete}
          cameraRef={cameraRef}
          controlsRef={controlsRef}
          onDraggingDecalChange={setIsDraggingDecal}
          editorTool={editorTool}
          editorColor={editorColor}
          editorBrushSize={editorBrushSize}
          editorPatternRotationDeg={editorPatternRotationDeg}
          editorLockParts={editorLockParts}
          editorSelectedLogo={editorSelectedLogo}
          editorSelectedPattern={editorSelectedPattern}
          editorSelectedStamp={editorSelectedStamp}
        />
        <OrbitControls 
          ref={controlsRef}
          enabled={!isDraggingDecal}
          enablePan={!isDraggingDecal}
          enableZoom={!isDraggingDecal}
          enableRotate={!isDraggingDecal}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.8}
          zoomSpeed={0.8}
          minDistance={1}
          maxDistance={15}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
