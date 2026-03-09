import * as THREE from "three";

export interface RegionInfo {
  name: string;
  box: THREE.Box3;
  center: THREE.Vector3;
  color: THREE.Color;
  vertexIndices: number[];
}

/**
 * Generate semantic names for regions based on product type and position
 */
export function generateSemanticName(
  productType: string,
  regionIndex: number,
  position: THREE.Vector3,
  totalRegions: { x: number; y: number; z: number },
  localIndex: { x: number; y: number; z: number }
): string {
  const { x, y, z } = localIndex;
  
  if (productType === 'teddy') {
    // Gấu bông - 3x5x2 = 30 regions
    if (y === 4) {
      // Top row
      if (x === 0) return 'Tai trái';
      if (x === 2) return 'Tai phải';
      return 'Đầu phía trên';
    } else if (y === 3) {
      // Head
      return 'Đầu';
    } else if (y === 2) {
      // Middle body
      if (x === 0) return 'Tay trái trên';
      if (x === 2) return 'Tay phải trên';
      return 'Ngực';
    } else if (y === 1) {
      // Lower body
      if (x === 0) return 'Tay trái dưới';
      if (x === 2) return 'Tay phải dưới';
      return 'Bụng';
    } else {
      // Bottom
      if (x === 0) return 'Chân trái';
      if (x === 2) return 'Chân phải';
      return 'Chân giữa';
    }
  } else if (productType === 'tshirt') {
    // Áo thun - 3x4x2 = 24 regions
    if (y === 3) {
      return 'Cổ áo';
    } else if (y === 2) {
      if (x === 0) return 'Tay áo trái trên';
      if (x === 2) return 'Tay áo phải trên';
      if (z === 0) return 'Ngực áo';
      return 'Lưng áo trên';
    } else if (y === 1) {
      if (x === 0) return 'Tay áo trái dưới';
      if (x === 2) return 'Tay áo phải dưới';
      if (z === 0) return 'Thân áo trước';
      return 'Thân áo sau';
    } else {
      if (z === 0) return 'Viền áo trước';
      return 'Viền áo sau';
    }
  } else if (productType === 'tote') {
    // Túi tote - 2x3x2 = 12 regions
    if (y === 2) {
      return 'Quai túi';
    } else if (y === 1) {
      if (z === 0) return 'Mặt trước túi trên';
      return 'Mặt sau túi trên';
    } else {
      if (z === 0) return 'Mặt trước túi dưới';
      return 'Mặt sau túi dưới';
    }
  } else if (productType === 'backpack') {
    // Balo - 2x4x2 = 16 regions
    if (y === 3) {
      return 'Quai balo';
    } else if (y === 2) {
      if (z === 0) return 'Túi trước trên';
      return 'Lưng balo trên';
    } else if (y === 1) {
      if (z === 0) return 'Túi trước giữa';
      return 'Lưng balo giữa';
    } else {
      if (z === 0) return 'Đáy túi trước';
      return 'Đáy balo';
    }
  }
  
  return `Bộ phận ${regionIndex + 1}`;
}

/**
 * Create regions with vertex assignment
 */
export function createRegionsWithVertices(
  geometry: THREE.BufferGeometry,
  productType: string,
  divisions: { x: number; y: number; z: number }
): RegionInfo[] {
  const regions: RegionInfo[] = [];
  
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }
  
  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);
  
  const step = new THREE.Vector3(
    size.x / divisions.x,
    size.y / divisions.y,
    size.z / divisions.z
  );
  
  const positions = geometry.attributes.position;
  let regionIndex = 0;
  
  for (let ix = 0; ix < divisions.x; ix++) {
    for (let iy = 0; iy < divisions.y; iy++) {
      for (let iz = 0; iz < divisions.z; iz++) {
        const min = new THREE.Vector3(
          bbox.min.x + step.x * ix,
          bbox.min.y + step.y * iy,
          bbox.min.z + step.z * iz
        );
        
        const max = new THREE.Vector3(
          min.x + step.x,
          min.y + step.y,
          min.z + step.z
        );
        
        const box = new THREE.Box3(min, max);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // Find vertices in this region
        const vertexIndices: number[] = [];
        const tempVertex = new THREE.Vector3();
        
        for (let i = 0; i < positions.count; i++) {
          tempVertex.set(
            positions.getX(i),
            positions.getY(i),
            positions.getZ(i)
          );
          
          if (box.containsPoint(tempVertex)) {
            vertexIndices.push(i);
          }
        }
        
        if (vertexIndices.length > 0) {
          const name = generateSemanticName(
            productType,
            regionIndex,
            center,
            divisions,
            { x: ix, y: iy, z: iz }
          );
          
          regions.push({
            name,
            box,
            center,
            color: new THREE.Color(0xffffff),
            vertexIndices
          });
          
          regionIndex++;
        }
      }
    }
  }
  
  console.log(`Created ${regions.length} regions with vertices`);
  return regions;
}

/**
 * Apply color to specific region using vertex colors
 */
export function applyColorToRegion(
  geometry: THREE.BufferGeometry,
  region: RegionInfo,
  color: THREE.Color
): void {
  let colors = geometry.attributes.color;
  
  if (!colors) {
    // Create color attribute if doesn't exist
    const colorArray = new Float32Array(geometry.attributes.position.count * 3);
    // Initialize with white
    for (let i = 0; i < colorArray.length; i += 3) {
      colorArray[i] = 1;
      colorArray[i + 1] = 1;
      colorArray[i + 2] = 1;
    }
    colors = new THREE.BufferAttribute(colorArray, 3);
    geometry.setAttribute('color', colors);
  }
  
  // Apply color to vertices in this region
  region.vertexIndices.forEach(index => {
    colors.setXYZ(index, color.r, color.g, color.b);
  });
  
  colors.needsUpdate = true;
  region.color = color.clone();
}

/**
 * Apply texture to region (using UV manipulation)
 */
export function applyTextureToRegion(
  geometry: THREE.BufferGeometry,
  region: RegionInfo,
  textureCanvas: HTMLCanvasElement
): void {
  // This is complex - for now we'll handle via material
  console.log('Texture application to region:', region.name);
}

/**
 * Find which region contains a point
 */
export function findRegionAtPoint(
  point: THREE.Vector3,
  regions: RegionInfo[]
): RegionInfo | null {
  for (const region of regions) {
    if (region.box.containsPoint(point)) {
      return region;
    }
  }
  return null;
}

/**
 * Get divisions based on product type
 */
export function getDivisionsForProduct(productType: string): { x: number; y: number; z: number } {
  switch (productType) {
    case 'teddy':
      return { x: 3, y: 5, z: 2 };
    case 'tshirt':
      return { x: 3, y: 4, z: 2 };
    case 'tote':
      return { x: 2, y: 3, z: 2 };
    case 'backpack':
      return { x: 2, y: 4, z: 2 };
    default:
      return { x: 3, y: 4, z: 2 };
  }
}
