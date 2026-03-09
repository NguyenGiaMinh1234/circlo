import * as THREE from "three";
import { MeshPart } from "./intelligentMeshSegmentation";
import { generateUVs } from "./meshUtils";

export interface PartTexture {
  partName: string;
  texture: THREE.Texture;
  position: THREE.Vector3;
  size: number;
  rotation: number;
  uvPosition?: { u: number; v: number }; // UV position for moving logo
}

/**
 * System to apply textures directly to mesh material (printed on surface, not decal)
 */
export class PartTextureSystem {
  private mesh: THREE.Mesh;
  private masterCanvas: HTMLCanvasElement | null = null;
  private partCanvasData: Map<string, { 
    image: HTMLImageElement | null; 
    bounds: { minU: number; minV: number; maxU: number; maxV: number } | null; 
    size: number;
    uvPosition?: { u: number; v: number }; // Current UV position for logo
    rotation?: number; // Rotation in radians
    flipX?: boolean; // Flip horizontally
    flipY?: boolean; // Flip vertically
    part: MeshPart | null;
    targetMesh?: THREE.Mesh; // Mesh that this texture belongs to
  }> = new Map();
  private mainMaterial: THREE.MeshStandardMaterial | null = null;
  private meshCanvases: Map<THREE.Mesh, HTMLCanvasElement> = new Map(); // Canvas per mesh
  private meshBaseCanvases: Map<THREE.Mesh, HTMLCanvasElement> = new Map(); // Cached base (vertex colors -> canvas)
  private partMaskCanvases: Map<string, HTMLCanvasElement> = new Map(); // Cached UV mask per part+mesh
  private scratchCanvas: HTMLCanvasElement | null = null; // Reused scratch canvas for compositing
  private baseDirtyMeshUuids: Set<string> = new Set();
  private readonly debug = false;
  
  constructor(mesh: THREE.Mesh) {
    this.mesh = mesh;
    // Get main material
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (material instanceof THREE.MeshStandardMaterial) {
      this.mainMaterial = material;
    }
  }
  
  /**
   * Get or create canvas for a specific mesh
   */
  private getMeshCanvas(targetMesh: THREE.Mesh): HTMLCanvasElement {
    if (!this.meshCanvases.has(targetMesh)) {
      const canvas = document.createElement('canvas');
      // Reduce canvas size for better performance (1024 instead of 2048)
      canvas.width = 1024;
      canvas.height = 1024;
      
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      this.meshCanvases.set(targetMesh, canvas);
    }
    return this.meshCanvases.get(targetMesh)!;
  }

  /**
   * Mark base layer as dirty so the next redraw will recompute vertex-color base.
   * Call this after vertex colors change.
   */
  markBaseLayerDirty(targetMesh?: THREE.Mesh): void {
    if (targetMesh) {
      this.baseDirtyMeshUuids.add(targetMesh.uuid);
    } else {
      this.baseDirtyMeshUuids.add(this.mesh.uuid);
    }
  }

  private getMeshBaseCanvas(targetMesh: THREE.Mesh): HTMLCanvasElement {
    if (!this.meshBaseCanvases.has(targetMesh)) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      this.meshBaseCanvases.set(targetMesh, canvas);
      this.baseDirtyMeshUuids.add(targetMesh.uuid);
    }
    return this.meshBaseCanvases.get(targetMesh)!;
  }

  private getScratchCanvas(): HTMLCanvasElement {
    if (!this.scratchCanvas) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      this.scratchCanvas = canvas;
    }
    return this.scratchCanvas;
  }

  /**
   * Build a precise UV mask for a part by rasterizing the triangles that belong to it.
   * This prevents logos/patterns from leaking into other parts whose UV bounds overlap.
   */
  private getPartMaskCanvas(part: MeshPart, targetMesh: THREE.Mesh): HTMLCanvasElement {
    const key = `${targetMesh.uuid}:${part.name}:v2`;
    const cached = this.partMaskCanvases.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.imageSmoothingEnabled = true;

    const geometry = targetMesh.geometry;
    const uvAttribute = geometry.attributes.uv;
    if (!uvAttribute) {
      this.partMaskCanvases.set(key, canvas);
      return canvas;
    }

    const inPart = part.vertexIndices;
    const w = canvas.width;
    const h = canvas.height;

    const drawTri = (a: number, b: number, c: number) => {
      const inCount = (inPart.has(a) ? 1 : 0) + (inPart.has(b) ? 1 : 0) + (inPart.has(c) ? 1 : 0);
      if (inCount < 2) return;
      if (a >= uvAttribute.count || b >= uvAttribute.count || c >= uvAttribute.count) return;

      const ua = uvAttribute.getX(a);
      const va = uvAttribute.getY(a);
      const ub = uvAttribute.getX(b);
      const vb = uvAttribute.getY(b);
      const uc = uvAttribute.getX(c);
      const vc = uvAttribute.getY(c);

      const xa = ua * w;
      const ya = (1 - va) * h;
      const xb = ub * w;
      const yb = (1 - vb) * h;
      const xc = uc * w;
      const yc = (1 - vc) * h;

      ctx.beginPath();
      ctx.moveTo(xa, ya);
      ctx.lineTo(xb, yb);
      ctx.lineTo(xc, yc);
      ctx.closePath();
      ctx.fill();
    };

    if (geometry.index) {
      const indexAttr = geometry.index;
      for (let i = 0; i < indexAttr.count; i += 3) {
        drawTri(indexAttr.getX(i), indexAttr.getX(i + 1), indexAttr.getX(i + 2));
      }
    } else {
      const positionAttr = geometry.attributes.position;
      for (let i = 0; i + 2 < positionAttr.count; i += 3) {
        drawTri(i, i + 1, i + 2);
      }
    }

    this.partMaskCanvases.set(key, canvas);
    return canvas;
  }

  /**
   * Apply texture to specific part by painting on canvas and applying to material
   */
  applyTextureToPart(
    part: MeshPart,
    texturePath: string,
    size: number = 0.5,
    uvPosition?: { u: number; v: number },
    targetMesh?: THREE.Mesh
  ): void {
    // Use target mesh if provided, otherwise use default mesh
    const meshToUse = targetMesh || this.mesh;
    // Remove existing texture for this part
    this.removeTextureFromPart(part.name);

    // Ensure UV coordinates exist
    const geometry = meshToUse.geometry;
    if (!geometry.attributes.uv) {
      console.warn(`⚠️ Geometry has no UV coordinates, generating them...`);
      generateUVs(geometry);
    }

    // Decode URL-encoded path (e.g., %20 -> space)
    const decodedPath = decodeURIComponent(texturePath);
    if (this.debug) {
      console.log(`🔄 Loading texture for "${part.name}": ${decodedPath}`);
    }
    
    // Calculate position and size on canvas based on part UV bounds
    const partUVBounds = this.calculatePartUVBounds(part, meshToUse);
    if (!partUVBounds) {
      console.warn(`⚠️ Could not calculate UV bounds for "${part.name}"`);
      return;
    }
    
    // Calculate initial UV position (center of part)
    const uvCenter = {
      u: (partUVBounds.minU + partUVBounds.maxU) / 2,
      v: (partUVBounds.minV + partUVBounds.maxV) / 2
    };
    
    // Store part data (will be drawn when image loads)
    this.partCanvasData.set(part.name, {
      image: null,
      bounds: partUVBounds,
      size: size,
      uvPosition: uvPosition ? { 
        u: Math.max(partUVBounds.minU, Math.min(partUVBounds.maxU, uvPosition.u)),
        v: Math.max(partUVBounds.minV, Math.min(partUVBounds.maxV, uvPosition.v))
      } : uvCenter,
      rotation: 0, // Default no rotation
      flipX: false,
      flipY: false,
      part: part,
      targetMesh: meshToUse
    });
    
    // Load image and draw only on part's UV region
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Store loaded image
      const partData = this.partCanvasData.get(part.name);
      if (partData) {
        partData.image = img;
        this.redrawMeshCanvas(meshToUse);
      }
      if (this.debug) {
        console.log(`✓ Loaded image for "${part.name}"`);
      }
    };
    img.onerror = (error) => {
      console.error(`✗ Failed to load image for "${part.name}":`, error);
      console.error(`  Tried path: ${decodedPath}`);
    };
    img.src = decodedPath;
  }

  /**
   * Get or create master canvas (shared by all parts)
   */
  private getMasterCanvas(): HTMLCanvasElement {
    if (!this.masterCanvas) {
      this.masterCanvas = document.createElement('canvas');
      this.masterCanvas.width = 2048;
      this.masterCanvas.height = 2048;
      
      // Initialize with transparent background
      const ctx = this.masterCanvas.getContext('2d')!;
      ctx.clearRect(0, 0, this.masterCanvas.width, this.masterCanvas.height);
      
      // Fill with white (to preserve base colors when texture is applied)
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillRect(0, 0, this.masterCanvas.width, this.masterCanvas.height);
    }
    return this.masterCanvas;
  }

  /**
   * Calculate UV bounds for a part based on its vertex indices
   */
  private calculatePartUVBounds(part: MeshPart, mesh: THREE.Mesh = this.mesh): { minU: number; minV: number; maxU: number; maxV: number } | null {
    const geometry = mesh.geometry;
    if (!geometry.attributes.uv) {
      console.warn('⚠️ Geometry has no UV coordinates');
      return null;
    }
    
    const uvAttribute = geometry.attributes.uv;
    
    let minU = Infinity;
    let minV = Infinity;
    let maxU = -Infinity;
    let maxV = -Infinity;
    
    // Use vertex indices from part to get UV bounds directly
    let foundUV = false;
    
    part.vertexIndices.forEach(vertexIndex => {
      if (vertexIndex < uvAttribute.count) {
        const u = uvAttribute.getX(vertexIndex);
        const v = uvAttribute.getY(vertexIndex);
        
        minU = Math.min(minU, u);
        minV = Math.min(minV, v);
        maxU = Math.max(maxU, u);
        maxV = Math.max(maxV, v);
        foundUV = true;
      }
    });
    
    if (!foundUV || (minU === Infinity)) {
      console.warn(`⚠️ Could not find UV bounds for "${part.name}", using fallback`);
      // Fallback: use center of UV space
      return { minU: 0.4, minV: 0.4, maxU: 0.6, maxV: 0.6 };
    }
    
    // Expand bounds slightly for better visibility
    const uRange = maxU - minU;
    const vRange = maxV - minV;
    const padding = 0.1; // 10% padding
    
    return {
      minU: Math.max(0, minU - uRange * padding),
      minV: Math.max(0, minV - vRange * padding),
      maxU: Math.min(1, maxU + uRange * padding),
      maxV: Math.min(1, maxV + vRange * padding)
    };
  }

  /**
   * Redraw canvas for a specific mesh with logos only in their respective part UV regions
   * Uses pixel-based masking to ensure logos only appear on selected part vertices
   */
  private redrawMeshCanvas(targetMesh: THREE.Mesh): void {
    const material = Array.isArray(targetMesh.material) ? targetMesh.material[0] : targetMesh.material;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;
    
    const meshCanvas = this.getMeshCanvas(targetMesh);
    const ctx = meshCanvas.getContext('2d')!;

    // Draw cached base layer (vertex colors) first. Recompute only when dirty.
    const baseCanvas = this.getMeshBaseCanvas(targetMesh);
    if (this.baseDirtyMeshUuids.has(targetMesh.uuid)) {
      const baseCtx = baseCanvas.getContext('2d')!;
      baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);

      const geometry = targetMesh.geometry;
      const colorAttribute = geometry.attributes.color;
      const uvAttribute = geometry.attributes.uv;

      if (colorAttribute && uvAttribute) {
        const imageData = baseCtx.createImageData(baseCanvas.width, baseCanvas.height);
        imageData.data.fill(255);
        const positions = geometry.attributes.position;

        for (let i = 0; i < positions.count && i < uvAttribute.count; i++) {
          const u = uvAttribute.getX(i);
          const v = uvAttribute.getY(i);
          const r = colorAttribute.getX(i);
          const g = colorAttribute.getY(i);
          const b = colorAttribute.getZ(i);

          const x = Math.floor(u * baseCanvas.width);
          const y = Math.floor((1 - v) * baseCanvas.height);

          if (x >= 0 && x < baseCanvas.width && y >= 0 && y < baseCanvas.height) {
            const idx = (y * baseCanvas.width + x) * 4;
            imageData.data[idx] = r * 255;
            imageData.data[idx + 1] = g * 255;
            imageData.data[idx + 2] = b * 255;
            imageData.data[idx + 3] = 255;
          }
        }
        baseCtx.putImageData(imageData, 0, 0);
      } else {
        baseCtx.fillStyle = 'rgba(255, 255, 255, 1)';
        baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
      }

      this.baseDirtyMeshUuids.delete(targetMesh.uuid);
    }

    ctx.clearRect(0, 0, meshCanvas.width, meshCanvas.height);
    ctx.drawImage(baseCanvas, 0, 0);

    const geometry = targetMesh.geometry;
    const uvAttribute = geometry.attributes.uv;
    if (!uvAttribute) {
      console.warn('⚠️ No UV coordinates for masking');
      return;
    }

    // Draw each part's image using a triangle-accurate UV mask (prevents bleeding)
    const scratch = this.getScratchCanvas();
    const scratchCtx = scratch.getContext('2d')!;
    this.partCanvasData.forEach((partData, partName) => {
      if (!partData.image || !partData.bounds) return;
      if (partData.targetMesh !== targetMesh) return;
      if (!partData.part) return;

      const bounds = partData.bounds;
      const uvX = partData.uvPosition?.u ?? (bounds.minU + bounds.maxU) / 2;
      const uvY = partData.uvPosition?.v ?? (bounds.minV + bounds.maxV) / 2;

      const uvWidth = (bounds.maxU - bounds.minU);
      const uvHeight = (bounds.maxV - bounds.minV);
      const logoWidth = uvWidth * meshCanvas.width * partData.size;
      const logoHeight = uvHeight * meshCanvas.height * partData.size;

      const canvasX = uvX * meshCanvas.width;
      const canvasY = (1 - uvY) * meshCanvas.height;

      const rotation = partData.rotation || 0;
      const flipX = partData.flipX || false;
      const flipY = partData.flipY || false;

      const clipX = Math.max(0, Math.floor(bounds.minU * meshCanvas.width));
      const clipY = Math.max(0, Math.floor((1 - bounds.maxV) * meshCanvas.height));
      const clipW = Math.min(meshCanvas.width - clipX, Math.ceil((bounds.maxU - bounds.minU) * meshCanvas.width));
      const clipH = Math.min(meshCanvas.height - clipY, Math.ceil((bounds.maxV - bounds.minV) * meshCanvas.height));

      scratchCtx.clearRect(0, 0, scratch.width, scratch.height);
      scratchCtx.save();
      scratchCtx.beginPath();
      scratchCtx.rect(clipX, clipY, clipW, clipH);
      scratchCtx.clip();

      scratchCtx.translate(canvasX, canvasY);
      if (rotation !== 0) scratchCtx.rotate(rotation);
      scratchCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      scratchCtx.globalCompositeOperation = 'source-over';
      scratchCtx.drawImage(partData.image, -logoWidth / 2, -logoHeight / 2, logoWidth, logoHeight);
      scratchCtx.restore();

      const maskCanvas = this.getPartMaskCanvas(partData.part, targetMesh);
      scratchCtx.globalCompositeOperation = 'destination-in';
      scratchCtx.drawImage(maskCanvas, 0, 0);
      scratchCtx.globalCompositeOperation = 'source-over';

      ctx.drawImage(scratch, 0, 0);

      if (this.debug) {
        console.log(`✓ Drew masked image for "${partName}" using UV triangle mask`);
      }
    });
    
    // Apply texture to material of this mesh
    // Enable vertex colors AND texture map - blend them together
    // This allows colors to show through texture
    material.vertexColors = true;
    
    if (material.map instanceof THREE.CanvasTexture) {
      material.map.needsUpdate = true;
    } else {
      const meshTexture = new THREE.CanvasTexture(meshCanvas);
      meshTexture.needsUpdate = true;
      meshTexture.flipY = false;
      // Use ClampToEdge to prevent repeating - only show 1 logo
      meshTexture.wrapS = THREE.ClampToEdgeWrapping;
      meshTexture.wrapT = THREE.ClampToEdgeWrapping;
      material.map = meshTexture;
    }
    // Set blending mode to multiply or overlay so colors show through
    material.map!.format = THREE.RGBAFormat;
    material.needsUpdate = true;
    
    if (this.debug) {
      console.log('✓ Redrew mesh canvas with pixel-based masking');
    }
  }
  
  /**
   * Redraw master canvas (legacy method for backward compatibility)
   */
  private redrawMasterCanvas(): void {
    // Redraw all mesh canvases
    this.meshCanvases.forEach((canvas, mesh) => {
      this.redrawMeshCanvas(mesh);
    });
  }
  
  /**
   * Get master canvas (legacy method)
   */
  private getLegacyMasterCanvas(): HTMLCanvasElement {
    return this.getMeshCanvas(this.mesh);
  }
  

  /**
   * Update texture size for a part
   */
  updateTextureSize(partName: string, newSize: number): void {
    const partData = this.partCanvasData.get(partName);
    if (partData) {
      partData.size = newSize;
      // Redraw canvas for the target mesh
      if (partData.targetMesh) {
        this.redrawMeshCanvas(partData.targetMesh);
      } else {
        this.redrawMasterCanvas();
      }
      console.log(`✓ Updated texture size for "${partName}" to ${newSize}`);
    }
  }
  
  // Debounce texture movement updates
  private moveTextureUVTimeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Move logo/texture to new UV position (for dragging)
   */
  moveTextureUV(partName: string, newUV: { u: number; v: number }, targetMesh?: THREE.Mesh): void {
    const partData = this.partCanvasData.get(partName);
    if (partData && partData.bounds) {
      // Clamp UV position to part bounds
      partData.uvPosition = {
        u: Math.max(partData.bounds.minU, Math.min(partData.bounds.maxU, newUV.u)),
        v: Math.max(partData.bounds.minV, Math.min(partData.bounds.maxV, newUV.v))
      };
      
      // Debounce redraw to avoid too frequent updates
      if (this.moveTextureUVTimeout) {
        clearTimeout(this.moveTextureUVTimeout);
      }
      
      this.moveTextureUVTimeout = setTimeout(() => {
        const meshToRedraw = targetMesh || partData.targetMesh;
        if (meshToRedraw) {
          this.redrawMeshCanvas(meshToRedraw);
        } else {
          this.redrawMasterCanvas();
        }
      }, 50); // Debounce 50ms
    }
  }
  
  /**
   * Get UV position of texture for a part
   */
  getTextureUV(partName: string): { u: number; v: number } | null {
    const partData = this.partCanvasData.get(partName);
    return partData?.uvPosition || null;
  }

  /**
   * Set rotation for texture (in radians)
   */
  setTextureRotation(partName: string, rotation: number): void {
    const partData = this.partCanvasData.get(partName);
    if (partData) {
      partData.rotation = rotation;
      // Redraw canvas for the target mesh
      if (partData.targetMesh) {
        this.redrawMeshCanvas(partData.targetMesh);
      } else {
        this.redrawMasterCanvas();
      }
      console.log(`✓ Set rotation for "${partName}" to ${rotation} radians`);
    }
  }

  /**
   * Set flip for texture
   */
  setTextureFlip(partName: string, flipX: boolean, flipY: boolean): void {
    const partData = this.partCanvasData.get(partName);
    if (partData) {
      partData.flipX = flipX;
      partData.flipY = flipY;
      // Redraw canvas for the target mesh
      if (partData.targetMesh) {
        this.redrawMeshCanvas(partData.targetMesh);
      } else {
        this.redrawMasterCanvas();
      }
      console.log(`✓ Set flip for "${partName}": X=${flipX}, Y=${flipY}`);
    }
  }

  /**
   * Get texture properties (rotation, flip, size)
   */
  getTextureProperties(partName: string): { rotation: number; flipX: boolean; flipY: boolean; size: number } | null {
    const partData = this.partCanvasData.get(partName);
    if (partData) {
      return {
        rotation: partData.rotation || 0,
        flipX: partData.flipX || false,
        flipY: partData.flipY || false,
        size: partData.size
      };
    }
    return null;
  }

  /**
   * Remove texture from part
   */
  removeTextureFromPart(partName: string): void {
    const existing = this.partCanvasData.get(partName);
    if (existing) {
      this.partCanvasData.delete(partName);
      if (existing.targetMesh) {
        this.redrawMeshCanvas(existing.targetMesh);
      } else {
        this.redrawMasterCanvas();
      }
      if (this.debug) {
        console.log(`✓ Removed texture from "${partName}"`);
      }
    }
  }

  /**
   * Clear all textures
   */
  clearAll(): void {
    this.partCanvasData.clear();
    this.partMaskCanvases.clear();
    
    // Reset master canvas
    if (this.masterCanvas) {
      const ctx = this.masterCanvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillRect(0, 0, this.masterCanvas.width, this.masterCanvas.height);
    }
    
    if (this.mainMaterial) {
      this.mainMaterial.map = null;
      this.mainMaterial.needsUpdate = true;
    }
    
    console.log('✓ Cleared all part textures');
  }
}
