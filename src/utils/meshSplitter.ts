import * as THREE from "three";

export interface MeshPart {
  name: string;
  mesh: THREE.Mesh;
  originalMaterial: THREE.Material;
  position: THREE.Vector3;
  boundingBox: THREE.Box3;
}

/**
 * Generate meaningful part names based on position
 */
export function generatePartName(
  baseName: string,
  position: THREE.Vector3,
  boundingBox: THREE.Box3,
  index: number
): string {
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  
  // Determine position descriptors
  let horizontalPos = '';
  let verticalPos = '';
  let depthPos = '';
  
  // Horizontal (X axis)
  if (position.x < center.x - size.x * 0.2) {
    horizontalPos = 'trái';
  } else if (position.x > center.x + size.x * 0.2) {
    horizontalPos = 'phải';
  } else {
    horizontalPos = 'giữa';
  }
  
  // Vertical (Y axis)
  if (position.y > center.y + size.y * 0.3) {
    verticalPos = 'trên';
  } else if (position.y < center.y - size.y * 0.3) {
    verticalPos = 'dưới';
  } else {
    verticalPos = 'giữa';
  }
  
  // Depth (Z axis)
  if (position.z > center.z + size.z * 0.2) {
    depthPos = 'trước';
  } else if (position.z < center.z - size.z * 0.2) {
    depthPos = 'sau';
  }
  
  // Build descriptive name
  const parts = [baseName];
  
  if (verticalPos === 'trên') parts.push('phần trên');
  if (verticalPos === 'dưới') parts.push('phần dưới');
  
  if (horizontalPos === 'trái') parts.push('bên trái');
  if (horizontalPos === 'phải') parts.push('bên phải');
  
  if (depthPos === 'trước') parts.push('phía trước');
  if (depthPos === 'sau') parts.push('phía sau');
  
  if (parts.length === 1) {
    parts.push(`phần ${index + 1}`);
  }
  
  return parts.join(' ');
}

/**
 * Split mesh into separate parts based on spatial regions
 */
export function splitMeshIntoParts(
  originalMesh: THREE.Mesh,
  divisions: { x: number; y: number; z: number } = { x: 3, y: 4, z: 2 }
): MeshPart[] {
  const parts: MeshPart[] = [];
  
  // Compute bounding box
  if (!originalMesh.geometry.boundingBox) {
    originalMesh.geometry.computeBoundingBox();
  }
  
  const boundingBox = originalMesh.geometry.boundingBox!;
  const meshCenter = new THREE.Vector3();
  boundingBox.getCenter(meshCenter);
  
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  
  const positions = originalMesh.geometry.attributes.position;
  const indices = originalMesh.geometry.index;
  
  if (!indices) {
    console.warn('Mesh has no indices, cannot split');
    return parts;
  }
  
  // Calculate step size for divisions
  const step = new THREE.Vector3(
    size.x / divisions.x,
    size.y / divisions.y,
    size.z / divisions.z
  );
  
  // Create a part for each division
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
        
        const regionBox = new THREE.Box3(min, max);
        const regionCenter = new THREE.Vector3();
        regionBox.getCenter(regionCenter);
        
        // Find all triangles in this region
        const regionIndices: number[] = [];
        const vertexMap = new Map<number, number>();
        const newVertices: number[] = [];
        
        for (let i = 0; i < indices.count; i += 3) {
          const i1 = indices.getX(i);
          const i2 = indices.getX(i + 1);
          const i3 = indices.getX(i + 2);
          
          const v1 = new THREE.Vector3(
            positions.getX(i1),
            positions.getY(i1),
            positions.getZ(i1)
          );
          const v2 = new THREE.Vector3(
            positions.getX(i2),
            positions.getY(i2),
            positions.getZ(i2)
          );
          const v3 = new THREE.Vector3(
            positions.getX(i3),
            positions.getY(i3),
            positions.getZ(i3)
          );
          
          // Check if triangle center is in this region
          const triangleCenter = new THREE.Vector3()
            .add(v1).add(v2).add(v3)
            .divideScalar(3);
          
          if (regionBox.containsPoint(triangleCenter)) {
            // Add this triangle to the region
            [i1, i2, i3].forEach(idx => {
              if (!vertexMap.has(idx)) {
                vertexMap.set(idx, newVertices.length / 3);
                newVertices.push(
                  positions.getX(idx),
                  positions.getY(idx),
                  positions.getZ(idx)
                );
              }
              regionIndices.push(vertexMap.get(idx)!);
            });
          }
        }
        
        // Create mesh part if has vertices
        if (newVertices.length > 0) {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(newVertices), 3)
          );
          geometry.setIndex(regionIndices);
          geometry.computeVertexNormals();
          
          // Generate UV coordinates
          generateUVsForGeometry(geometry);
          
          const material = (originalMesh.material as THREE.Material).clone();
          const mesh = new THREE.Mesh(geometry, material);
          
          // Copy transform from original
          mesh.position.copy(originalMesh.position);
          mesh.rotation.copy(originalMesh.rotation);
          mesh.scale.copy(originalMesh.scale);
          
          const partName = generatePartName(
            originalMesh.name || 'bộ phận',
            regionCenter,
            boundingBox,
            parts.length
          );
          
          mesh.name = partName;
          
          parts.push({
            name: partName,
            mesh,
            originalMaterial: material,
            position: regionCenter,
            boundingBox: regionBox
          });
        }
      }
    }
  }
  
  console.log(`✓ Split into ${parts.length} parts:`, parts.map(p => p.name));
  return parts;
}

function generateUVsForGeometry(geometry: THREE.BufferGeometry): void {
  const positions = geometry.attributes.position;
  const uvs = new Float32Array(positions.count * 2);
  
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    const absZ = Math.abs(z);
    
    let u = 0, v = 0;
    
    if (absX >= absY && absX >= absZ) {
      u = (y + 1) * 0.5;
      v = (z + 1) * 0.5;
    } else if (absY >= absX && absY >= absZ) {
      u = (x + 1) * 0.5;
      v = (z + 1) * 0.5;
    } else {
      u = (x + 1) * 0.5;
      v = (y + 1) * 0.5;
    }
    
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }
  
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/**
 * Apply smart naming based on product type
 */
export function enhancePartNames(parts: MeshPart[], productType: string): void {
  if (productType === 'teddy') {
    // Gấu bông parts
    parts.forEach((part, index) => {
      const name = part.name.toLowerCase();
      if (name.includes('trên') && name.includes('trái')) {
        part.name = 'Tai trái';
        part.mesh.name = 'Tai trái';
      } else if (name.includes('trên') && name.includes('phải')) {
        part.name = 'Tai phải';
        part.mesh.name = 'Tai phải';
      } else if (name.includes('trên') && name.includes('giữa')) {
        part.name = 'Đầu';
        part.mesh.name = 'Đầu';
      } else if (name.includes('giữa') && name.includes('trái')) {
        part.name = 'Tay trái';
        part.mesh.name = 'Tay trái';
      } else if (name.includes('giữa') && name.includes('phải')) {
        part.name = 'Tay phải';
        part.mesh.name = 'Tay phải';
      } else if (name.includes('giữa') && name.includes('giữa')) {
        part.name = 'Thân';
        part.mesh.name = 'Thân';
      } else if (name.includes('dưới') && name.includes('trái')) {
        part.name = 'Chân trái';
        part.mesh.name = 'Chân trái';
      } else if (name.includes('dưới') && name.includes('phải')) {
        part.name = 'Chân phải';
        part.mesh.name = 'Chân phải';
      }
    });
  } else if (productType === 'tshirt') {
    // Áo thun parts
    parts.forEach(part => {
      const name = part.name.toLowerCase();
      if (name.includes('trên')) {
        part.name = 'Cổ áo';
        part.mesh.name = 'Cổ áo';
      } else if (name.includes('giữa') && name.includes('trái')) {
        part.name = 'Tay áo trái';
        part.mesh.name = 'Tay áo trái';
      } else if (name.includes('giữa') && name.includes('phải')) {
        part.name = 'Tay áo phải';
        part.mesh.name = 'Tay áo phải';
      } else if (name.includes('giữa')) {
        part.name = 'Thân áo';
        part.mesh.name = 'Thân áo';
      }
    });
  } else if (productType === 'tote') {
    // Túi tote parts
    parts.forEach(part => {
      const name = part.name.toLowerCase();
      if (name.includes('trên')) {
        part.name = 'Quai túi';
        part.mesh.name = 'Quai túi';
      } else if (name.includes('trước')) {
        part.name = 'Mặt trước túi';
        part.mesh.name = 'Mặt trước túi';
      } else if (name.includes('sau')) {
        part.name = 'Mặt sau túi';
        part.mesh.name = 'Mặt sau túi';
      } else {
        part.name = 'Thân túi';
        part.mesh.name = 'Thân túi';
      }
    });
  } else if (productType === 'backpack') {
    // Balo parts
    parts.forEach(part => {
      const name = part.name.toLowerCase();
      if (name.includes('trên')) {
        part.name = 'Quai balo';
        part.mesh.name = 'Quai balo';
      } else if (name.includes('trước')) {
        part.name = 'Túi trước';
        part.mesh.name = 'Túi trước';
      } else if (name.includes('sau')) {
        part.name = 'Lưng balo';
        part.mesh.name = 'Lưng balo';
      } else {
        part.name = 'Thân balo';
        part.mesh.name = 'Thân balo';
      }
    });
  }
}
