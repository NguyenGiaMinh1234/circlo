import * as THREE from "three";

/**
 * Generate UV coordinates for meshes that don't have them
 */
export function generateUVs(geometry: THREE.BufferGeometry): void {
  if (!geometry.attributes.uv) {
    console.log('Generating UV coordinates...');
    const positions = geometry.attributes.position;
    const uvs = new Float32Array(positions.count * 2);
    
    // Simple box projection for UV generation
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Project onto dominant axis
      const absX = Math.abs(x);
      const absY = Math.abs(y);
      const absZ = Math.abs(z);
      
      let u = 0, v = 0;
      
      if (absX >= absY && absX >= absZ) {
        // Project onto YZ plane
        u = (y + 1) * 0.5;
        v = (z + 1) * 0.5;
      } else if (absY >= absX && absY >= absZ) {
        // Project onto XZ plane
        u = (x + 1) * 0.5;
        v = (z + 1) * 0.5;
      } else {
        // Project onto XY plane
        u = (x + 1) * 0.5;
        v = (y + 1) * 0.5;
      }
      
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
    }
    
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    console.log('✓ UV coordinates generated');
  }
}

/**
 * Split a large mesh into selectable regions based on spatial partitioning
 */
export function createSelectableRegions(
  mesh: THREE.Mesh,
  regionSize: number = 0.5
): Map<string, THREE.Box3> {
  const regions = new Map<string, THREE.Box3>();
  
  if (!mesh.geometry.boundingBox) {
    mesh.geometry.computeBoundingBox();
  }
  
  const boundingBox = mesh.geometry.boundingBox!;
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  
  const divisions = {
    x: Math.max(2, Math.ceil(size.x / regionSize)),
    y: Math.max(2, Math.ceil(size.y / regionSize)),
    z: Math.max(2, Math.ceil(size.z / regionSize))
  };
  
  const step = new THREE.Vector3(
    size.x / divisions.x,
    size.y / divisions.y,
    size.z / divisions.z
  );
  
  for (let ix = 0; ix < divisions.x; ix++) {
    for (let iy = 0; iy < divisions.y; iy++) {
      for (let iz = 0; iz < divisions.z; iz++) {
        const min = new THREE.Vector3(
          boundingBox.min.x + step.x * ix,
          boundingBox.min.y + step.y * iy,
          boundingBox.min.z + step.z * iz
        );
        
        const max = new THREE.Vector3(
          min.x + step.x,
          min.y + step.y,
          min.z + step.z
        );
        
        const box = new THREE.Box3(min, max);
        const regionName = `region_${ix}_${iy}_${iz}`;
        regions.set(regionName, box);
      }
    }
  }
  
  console.log(`Created ${regions.size} selectable regions`);
  return regions;
}

/**
 * Find which region contains a point
 */
export function findRegionAtPoint(
  point: THREE.Vector3,
  regions: Map<string, THREE.Box3>
): string | null {
  for (const [name, box] of regions.entries()) {
    if (box.containsPoint(point)) {
      return name;
    }
  }
  return null;
}

/**
 * Create a visual helper to show regions
 */
export function createRegionHelpers(
  regions: Map<string, THREE.Box3>,
  selectedRegion: string | null
): THREE.Group {
  const group = new THREE.Group();
  
  for (const [name, box] of regions.entries()) {
    const helper = new THREE.Box3Helper(
      box,
      name === selectedRegion ? 0x3b82f6 : 0x888888
    );
    helper.name = `helper_${name}`;
    (helper as THREE.Box3Helper & { userData: { regionName?: string } }).userData.regionName = name;
    group.add(helper);
  }
  
  return group;
}

/**
 * Apply texture with proper UV mapping
 */
export function applyTextureToMesh(
  mesh: THREE.Mesh,
  texturePath: string,
  textureLoader: THREE.TextureLoader
): void {
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  
  if (!(material instanceof THREE.MeshStandardMaterial)) {
    console.warn('Material is not MeshStandardMaterial');
    return;
  }
  
  // Ensure UV coordinates exist
  generateUVs(mesh.geometry);
  
  if (texturePath.startsWith('data:image') || texturePath.startsWith('http')) {
    textureLoader.load(
      texturePath,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        texture.needsUpdate = true;
        
        material.map = texture;
        material.needsUpdate = true;
        
        console.log('✓ Texture applied successfully');
      },
      undefined,
      (error) => {
        console.error('✗ Failed to load texture:', error);
      }
    );
  }
}

/**
 * Analyze mesh structure and provide detailed information
 */
export function analyzeMesh(mesh: THREE.Mesh): {
  name: string;
  vertexCount: number;
  hasUV: boolean;
  hasNormals: boolean;
  materialCount: number;
  boundingBox: THREE.Box3;
  size: THREE.Vector3;
} {
  const geometry = mesh.geometry;
  
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }
  
  const size = new THREE.Vector3();
  geometry.boundingBox!.getSize(size);
  
  return {
    name: mesh.name || 'unnamed',
    vertexCount: geometry.attributes.position?.count || 0,
    hasUV: !!geometry.attributes.uv,
    hasNormals: !!geometry.attributes.normal,
    materialCount: Array.isArray(mesh.material) ? mesh.material.length : 1,
    boundingBox: geometry.boundingBox!.clone(),
    size
  };
}
