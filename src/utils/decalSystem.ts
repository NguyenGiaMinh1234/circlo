import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import type { MeshPart } from "./intelligentMeshSegmentation";

export interface Decal {
  id: string;
  texture: THREE.Texture;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  size: THREE.Vector3;
  rotation: number;
  partName: string;
  color?: string;
  flipX?: boolean;
  flipY?: boolean;
  targetMesh?: THREE.Mesh;
  renderOrder?: number;
}

/**
 * Decal System for applying single images/patterns that can be moved
 */
export class DecalSystem {
  private decals: Decal[] = [];
  private mesh: THREE.Mesh;
  private decalMeshes: THREE.Mesh[] = [];
  
  constructor(mesh: THREE.Mesh) {
    this.mesh = mesh;
  }

  getDecalMeshes(): THREE.Mesh[] {
    return [...this.decalMeshes];
  }

  private buildPartSubGeometry(part: MeshPart, targetMesh: THREE.Mesh): THREE.BufferGeometry {
    const geometry = targetMesh.geometry;
    const posAttr = geometry.attributes.position;
    const normalAttr = geometry.attributes.normal;
    const uvAttr = geometry.attributes.uv;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const inPart = part.vertexIndices;
    const pushVertex = (vi: number) => {
      positions.push(posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi));
      if (normalAttr) {
        normals.push(normalAttr.getX(vi), normalAttr.getY(vi), normalAttr.getZ(vi));
      }
      if (uvAttr) {
        uvs.push(uvAttr.getX(vi), uvAttr.getY(vi));
      }
    };

    const includeTri = (a: number, b: number, c: number) => {
      const inCount = (inPart.has(a) ? 1 : 0) + (inPart.has(b) ? 1 : 0) + (inPart.has(c) ? 1 : 0);
      if (inCount < 2) return;
      if (a >= posAttr.count || b >= posAttr.count || c >= posAttr.count) return;
      pushVertex(a);
      pushVertex(b);
      pushVertex(c);
    };

    if (geometry.index) {
      const indexAttr = geometry.index;
      for (let i = 0; i < indexAttr.count; i += 3) {
        includeTri(indexAttr.getX(i), indexAttr.getX(i + 1), indexAttr.getX(i + 2));
      }
    } else {
      for (let i = 0; i + 2 < posAttr.count; i += 3) {
        includeTri(i, i + 1, i + 2);
      }
    }

    const sub = new THREE.BufferGeometry();
    sub.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    if (normals.length > 0) sub.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    if (uvs.length > 0) sub.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    sub.computeBoundingSphere();
    return sub;
  }

  private createDecalGeometry(
    targetMesh: THREE.Mesh,
    position: THREE.Vector3,
    normal: THREE.Vector3,
    size: THREE.Vector3,
    rotation: number,
    clipPart?: MeshPart
  ): THREE.BufferGeometry {
    const base = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(base, normal.clone().normalize());
    if (rotation !== 0) {
      const qRot = new THREE.Quaternion().setFromAxisAngle(normal.clone().normalize(), rotation);
      q.multiply(qRot);
    }
    const orientation = new THREE.Euler().setFromQuaternion(q);

    if (clipPart) {
      const subGeom = this.buildPartSubGeometry(clipPart, targetMesh);
      const temp = new THREE.Mesh(subGeom, new THREE.MeshBasicMaterial());
      temp.matrixWorld.copy(targetMesh.matrixWorld);
      temp.matrixAutoUpdate = false;
      temp.updateMatrixWorld(true);

      const geom = new DecalGeometry(temp, position, orientation, size);
      temp.geometry.dispose();
      (temp.material as THREE.Material).dispose();
      return geom;
    }

    return new DecalGeometry(targetMesh, position, orientation, size);
  }
  
  /**
   * Add a decal at a specific position
   */
  addDecal(
    textureOrPattern: THREE.Texture | string,
    position: THREE.Vector3,
    normal: THREE.Vector3,
    partName: string,
    size: number = 0.3,
    options?: {
      id?: string;
      rotation?: number;
      color?: string;
      flipX?: boolean;
      flipY?: boolean;
      targetMesh?: THREE.Mesh;
      clipPart?: MeshPart;
      renderOrder?: number;
    }
  ): string {
    const decalId = options?.id ?? `decal_${Date.now()}_${Math.random()}`;
    
    let texture: THREE.Texture;
    if (typeof textureOrPattern === 'string') {
      // Check if it's an image URL/path (not a pattern name)
      // In Vite, imported images return resolved URLs like '/src/assets/...' or '/assets/...'
      const isImagePath = textureOrPattern.startsWith('/') || 
                         textureOrPattern.startsWith('http') || 
                         textureOrPattern.startsWith('data:image') || 
                         textureOrPattern.includes('.jpg') || 
                         textureOrPattern.includes('.png') || 
                         textureOrPattern.includes('.jpeg') || 
                         textureOrPattern.includes('.svg') ||
                         textureOrPattern.includes('assets/');
      
      if (isImagePath) {
        // Load image texture - Vite imports return resolved URLs
        const loader = new THREE.TextureLoader();
        console.log(`📷 Loading texture from: ${textureOrPattern}`);
        
        texture = loader.load(
          textureOrPattern,
          (loadedTexture) => {
            loadedTexture.needsUpdate = true;
            loadedTexture.flipY = false;
            console.log(`✓ Texture loaded successfully: ${textureOrPattern}`);
          },
          undefined,
          (error) => {
            console.error(`✗ Failed to load texture: ${textureOrPattern}`, error);
            // On error, try to update the decal mesh with placeholder
            const decal = this.decals.find(d => d.id === decalId);
            if (decal) {
              decal.texture = this.createPlaceholderTexture();
              const decalMesh = this.decalMeshes.find(m => {
                const userData = (m as any).userData;
                return userData && userData.decalId === decalId;
              });
              if (decalMesh && decalMesh.material instanceof THREE.MeshBasicMaterial) {
                decalMesh.material.map = decal.texture;
                decalMesh.material.needsUpdate = true;
              }
            }
          }
        );
        texture.flipY = false;
      } else {
        // Create texture from pattern name
        texture = this.createPatternTexture(textureOrPattern);
      }
    } else {
      texture = textureOrPattern;
    }
    
    const decal: Decal = {
      id: decalId,
      texture,
      position: position.clone(),
      normal: normal.clone(),
      size: new THREE.Vector3(size, size, size),
      rotation: options?.rotation ?? 0,
      partName,
      color: options?.color,
      flipX: options?.flipX,
      flipY: options?.flipY,
      targetMesh: options?.targetMesh ?? this.mesh,
      renderOrder: options?.renderOrder,
    };

    this.applyTextureTransform(texture, decal.flipX, decal.flipY);
    
    this.decals.push(decal);
    const decalMesh = this.createDecalMesh(decal, decal.targetMesh ?? this.mesh, options?.clipPart);
    // Store decal ID in mesh userData for later updates
    (decalMesh as any).userData = { decalId };
    
    console.log(`✓ Added decal ${decalId} to ${partName}`);
    return decalId;
  }
  
  /**
   * Create a placeholder texture while loading
   */
  private createPlaceholderTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  /**
   * Create a mesh for the decal
   */
  private createDecalMesh(decal: Decal, targetMesh: THREE.Mesh, clipPart?: MeshPart): THREE.Mesh {
    const geometry = this.createDecalGeometry(
      targetMesh,
      decal.position,
      decal.normal,
      decal.size,
      decal.rotation,
      clipPart
    );
    
    const material = new THREE.MeshBasicMaterial({
      map: decal.texture,
      color: decal.color ? new THREE.Color(decal.color) : new THREE.Color(0xffffff),
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.quaternion.identity();

    mesh.visible = true;
    mesh.renderOrder = typeof decal.renderOrder === "number" ? decal.renderOrder : 900 + this.decals.length;
    
    targetMesh.parent?.add(mesh);
    if (!targetMesh.parent) {
      this.mesh.parent?.add(mesh);
    }
    this.decalMeshes.push(mesh);
    
    return mesh;
  }

  private rebuildDecalMesh(index: number): void {
    const decal = this.decals[index];
    const currentMesh = this.decalMeshes[index];
    if (!decal || !currentMesh) return;

    currentMesh.geometry.dispose();
    (currentMesh.material as THREE.Material).dispose();
    currentMesh.parent?.remove(currentMesh);

    const replacement = this.createDecalMesh(decal, decal.targetMesh ?? this.mesh);
    (replacement as any).userData = { decalId: decal.id };
    replacement.renderOrder = currentMesh.renderOrder;
    this.decalMeshes[index] = replacement;
  }

  private applyTextureTransform(texture: THREE.Texture, flipX?: boolean, flipY?: boolean): void {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    const fx = flipX ? -1 : 1;
    const fy = flipY ? -1 : 1;
    texture.repeat.set(fx, fy);
    texture.offset.set(flipX ? 1 : 0, flipY ? 1 : 0);
    texture.needsUpdate = true;
  }
  
  /**
   * Create texture from pattern name or image URL
   */
  private createPatternTexture(pattern: string): THREE.Texture {
    // Check if it's an image URL/path (not a pattern name)
    if (pattern.startsWith('/') || pattern.startsWith('http') || pattern.startsWith('data:image') || pattern.includes('.jpg') || pattern.includes('.png') || pattern.includes('.jpeg') || pattern.includes('.svg')) {
      // It's an image path/URL - load it
      const loader = new THREE.TextureLoader();
      const texture = loader.load(pattern);
      texture.needsUpdate = true;
      texture.flipY = false; // Fix orientation if needed
      return texture;
    }
    
    // Otherwise, it's a pattern name - create canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    
    // Draw pattern in center
    ctx.fillStyle = '#3b82f6';
    
    if (pattern === 'dots') {
      ctx.beginPath();
      ctx.arc(128, 128, 50, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === 'stars') {
      this.drawStar(ctx, 128, 128, 5, 60, 30);
    } else if (pattern === 'hearts') {
      this.drawHeart(ctx, 128, 128, 50);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number): void {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outer;
      let y = cy + Math.sin(rot) * outer;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * inner;
      y = cy + Math.sin(rot) * inner;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outer);
    ctx.closePath();
    ctx.fill();
  }
  
  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y - size / 2, x - size, y + size / 4);
    ctx.bezierCurveTo(x - size, y + size, x, y + size * 1.5, x, y + size * 1.5);
    ctx.bezierCurveTo(x, y + size * 1.5, x + size, y + size, x + size, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y - size / 2, x, y, x, y + size / 4);
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * Remove a decal
   */
  removeDecal(decalId: string): void {
    const index = this.decals.findIndex(d => d.id === decalId);
    if (index !== -1) {
      // Remove mesh
      const decalMesh = this.decalMeshes[index];
      decalMesh.parent?.remove(decalMesh);
      decalMesh.geometry.dispose();
      (decalMesh.material as THREE.Material).dispose();
      
      this.decals.splice(index, 1);
      this.decalMeshes.splice(index, 1);
      
      console.log(`✓ Removed decal ${decalId}`);
    }
  }
  
  /**
   * Clear all decals
   */
  clearDecals(): void {
    this.decalMeshes.forEach(mesh => {
      mesh.parent?.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.decals = [];
    this.decalMeshes = [];
    console.log('✓ Cleared all decals');
  }
  
  /**
   * Get all decals
   */
  getDecals(): Decal[] {
    return [...this.decals];
  }
  
  /**
   * Move decal to new position
   */
  moveDecal(decalId: string, newPosition: THREE.Vector3, newNormal: THREE.Vector3): void {
    const index = this.decals.findIndex(d => d.id === decalId);
    if (index !== -1) {
      const decal = this.decals[index];
      decal.position.copy(newPosition);
      decal.normal.copy(newNormal);
      const targetMesh = decal.targetMesh ?? this.mesh;
      const mesh = this.decalMeshes[index];
      mesh.geometry.dispose();
      mesh.geometry = this.createDecalGeometry(targetMesh, decal.position, decal.normal, decal.size, decal.rotation);
    }
  }

  /**
   * Update decal properties
   */
  updateDecal(decalId: string, updates: {
    texture?: string | THREE.Texture;
    position?: THREE.Vector3;
    normal?: THREE.Vector3;
    size?: number;
    rotation?: number;
    color?: string;
    flipX?: boolean;
    flipY?: boolean;
    targetMesh?: THREE.Mesh;
    clipPart?: any;
    renderOrder?: number;
  }): void {
    const index = this.decals.findIndex(d => d.id === decalId);
    if (index === -1) return;

    const decal = this.decals[index];
    const mesh = this.decalMeshes[index];

    // Update texture
    if (updates.texture !== undefined) {
      let texture: THREE.Texture;
      if (typeof updates.texture === 'string') {
        const isImagePath = updates.texture.startsWith('/') || 
                           updates.texture.startsWith('http') || 
                           updates.texture.startsWith('data:image') || 
                           updates.texture.includes('.jpg') || 
                           updates.texture.includes('.png') || 
                           updates.texture.includes('.jpeg') ||
                           updates.texture.includes('.svg') ||
                           updates.texture.includes('assets/');
        
        if (isImagePath) {
          const loader = new THREE.TextureLoader();
          texture = loader.load(updates.texture);
          texture.flipY = false;
        } else {
          texture = this.createPatternTexture(updates.texture);
        }
      } else {
        texture = updates.texture;
      }
      decal.texture = texture;
      this.applyTextureTransform(decal.texture, decal.flipX, decal.flipY);
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.map = texture;
        mesh.material.needsUpdate = true;
      }
    }

    let needsRebuild = false;

    // Update position and normal
    if (updates.position) {
      decal.position.copy(updates.position);
      needsRebuild = true;
    }
    if (updates.normal) {
      decal.normal.copy(updates.normal);
      needsRebuild = true;
    }

    // Update size
    if (updates.size !== undefined) {
      decal.size.set(updates.size, updates.size, updates.size);
      needsRebuild = true;
    }

    // Update rotation
    if (updates.rotation !== undefined) {
      decal.rotation = updates.rotation;
      needsRebuild = true;
    }

    // Update color
    if (updates.color) {
      decal.color = updates.color;
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.color.set(updates.color);
        mesh.material.needsUpdate = true;
      }
    }

    if (updates.flipX !== undefined) decal.flipX = updates.flipX;
    if (updates.flipY !== undefined) decal.flipY = updates.flipY;
    if (updates.targetMesh) {
      decal.targetMesh = updates.targetMesh;
      needsRebuild = true;
    }

    if (mesh.material instanceof THREE.MeshBasicMaterial) {
      if (decal.color) {
        mesh.material.color.set(decal.color);
      }
      if (decal.texture) {
        this.applyTextureTransform(decal.texture, decal.flipX, decal.flipY);
        mesh.material.map = decal.texture;
      }
      mesh.material.needsUpdate = true;
    }

    if (needsRebuild) {
      const targetMesh = decal.targetMesh ?? this.mesh;
      mesh.geometry.dispose();
      mesh.geometry = this.createDecalGeometry(
        targetMesh,
        decal.position,
        decal.normal,
        decal.size,
        decal.rotation,
        updates.clipPart
      );
    }

    // Update render order
    if (updates.renderOrder !== undefined) {
      const activeMesh = this.decalMeshes[index];
      activeMesh.renderOrder = updates.renderOrder;
    }
  }
}
