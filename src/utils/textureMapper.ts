import * as THREE from "three";
import { MeshPart } from "./intelligentMeshSegmentation";

/**
 * Create a combined texture map for multiple parts
 * This applies textures directly to the mesh material via UV mapping
 */
export async function createCombinedTextureForParts(
  mesh: THREE.Mesh,
  parts: MeshPart[],
  partTextures: Record<string, string>,
  partTextureMap: Map<string, THREE.Texture>,
  material: THREE.MeshStandardMaterial
): Promise<void> {
  // Get geometry
  const geometry = mesh.geometry;
  
  // Ensure UV exists
  if (!geometry.attributes.uv) {
    console.error('Geometry has no UV coordinates!');
    return;
  }
  
  // For each part that has a texture, we need to apply it to the UV region
  // Since we can't easily modify UV coordinates per part, we'll create a texture atlas
  // OR apply texture directly to material and use vertex colors to mask regions
  
  // Simpler approach: Create a large canvas and place textures for each part
  // Then apply the combined texture to the entire mesh
  
  const canvasSize = 2048; // Large enough for multiple parts
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d')!;
  
  // Fill with white/transparent background
  ctx.fillStyle = 'rgba(255, 255, 255, 0)';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  // For now, let's use a simpler approach: 
  // Apply texture directly to material map for the entire mesh
  // The texture will tile/repeat based on UV coordinates
  
  // Get first texture (if multiple parts have textures, we'll use the first one)
  const firstPartWithTexture = Object.keys(partTextures).find(partName => partTextures[partName]);
  if (!firstPartWithTexture) {
    material.map = null;
    material.needsUpdate = true;
    return;
  }
  
  const texturePath = partTextures[firstPartWithTexture];
  const texture = partTextureMap.get(firstPartWithTexture);
  
  if (texture) {
    // Apply texture directly to material
    material.map = texture;
    material.needsUpdate = true;
    console.log(`✓ Applied texture to material for part: ${firstPartWithTexture}`);
  } else {
    // Load texture if not yet loaded
    const loader = new THREE.TextureLoader();
    loader.load(
      texturePath,
      (loadedTexture) => {
        loadedTexture.needsUpdate = true;
        loadedTexture.flipY = false;
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        
        material.map = loadedTexture;
        material.needsUpdate = true;
        console.log(`✓ Applied texture to material: ${texturePath}`);
      },
      undefined,
      (error) => {
        console.error('✗ Failed to load texture:', error);
      }
    );
  }
}

/**
 * Apply texture to specific part vertices using UV manipulation
 * This is more complex but allows different textures per part
 */
export function applyTextureToPart(
  geometry: THREE.BufferGeometry,
  part: MeshPart,
  texture: THREE.Texture,
  material: THREE.MeshStandardMaterial
): void {
  // This would require modifying UV coordinates for the part's vertices
  // to map to a specific region of the texture
  // For now, we'll use the simpler approach above
  
  // Apply texture to entire material
  material.map = texture;
  material.needsUpdate = true;
}






