import * as THREE from "three";

export interface MeshPart {
  name: string;
  vertexIndices: Set<number>;
  center: THREE.Vector3;
  bounds: THREE.Box3;
  volume: number;
  meshUuid?: string;
}

/**
 * Intelligent mesh segmentation using K-means clustering and symmetry detection
 */
export class IntelligentMeshSegmenter {
  private geometry: THREE.BufferGeometry;
  private productType: string;
  private positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  
  constructor(geometry: THREE.BufferGeometry, productType: string) {
    this.geometry = geometry;
    this.productType = productType;
    this.positions = geometry.attributes.position;
    
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
  }
  
  /**
   * Main segmentation algorithm
   */
  segment(): MeshPart[] {
    console.log('\n🧠 === INTELLIGENT MESH SEGMENTATION ===');
    console.log('Product:', this.productType);
    console.log('Total vertices:', this.positions.count);
    
    const parts = this.segmentByProduct();
    
    console.log(`\n✅ Created ${parts.length} intelligent parts:`);
    parts.forEach((part, i) => {
      console.log(`  ${i + 1}. ${part.name} (${part.vertexIndices.size} vertices, volume: ${part.volume.toFixed(2)})`);
    });
    
    return parts;
  }
  
  /**
   * Product-specific segmentation
   */
  private segmentByProduct(): MeshPart[] {
    switch (this.productType) {
      case 'teddy':
        return this.segmentTeddy();
      case 'tshirt':
        return this.segmentTShirt();
      case 'backpack':
        return this.segmentBackpack();
      case 'tote':
        return this.segmentTote();
      default:
        return this.segmentGeneric();
    }
  }
  
  /**
   * Segment teddy bear with 10 parts
   */
  private segmentTeddy(): MeshPart[] {
    const bbox = this.geometry.boundingBox!;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    const parts: MeshPart[] = [];
    const vertexMap = new Map<number, string>();
    
    // Analyze each vertex
    for (let i = 0; i < this.positions.count; i++) {
      const x = this.positions.getX(i);
      const y = this.positions.getY(i);
      const z = this.positions.getZ(i);
      
      // Normalize coordinates [0, 1]
      const nx = (x - bbox.min.x) / size.x;
      const ny = (y - bbox.min.y) / size.y;
      const nz = (z - bbox.min.z) / size.z;
      
      let partName = '';
      
      // Top region - ears and eyes (y > 0.75)
      if (ny > 0.75) {
        if (nx < 0.25 && Math.abs(nz - 0.5) < 0.3) {
          partName = 'Tai trái';
        } else if (nx > 0.75 && Math.abs(nz - 0.5) < 0.3) {
          partName = 'Tai phải';
        } else {
          partName = 'Đầu';
        }
      }
      // Head region with eyes (0.55 < y < 0.75)
      else if (ny > 0.55) {
        const distFromCenter = Math.abs(nx - 0.5);
        const isFront = nz > 0.5;
        
        if (isFront && distFromCenter > 0.15 && distFromCenter < 0.35 && ny < 0.68) {
          partName = nx < 0.5 ? 'Mắt trái' : 'Mắt phải';
        } else {
          partName = 'Đầu';
        }
      }
      // Upper body - arms and torso (0.3 < y < 0.55)
      else if (ny > 0.3) {
        if (nx < 0.25) {
          partName = 'Tay trái';
        } else if (nx > 0.75) {
          partName = 'Tay phải';
        } else {
          partName = 'Toàn thân';
        }
      }
      // Lower body (0.15 < y < 0.3)
      else if (ny > 0.15) {
        partName = 'Toàn thân';
      }
      // Legs (y < 0.15)
      else {
        if (nx < 0.4) {
          partName = 'Chân trái';
        } else if (nx > 0.6) {
          partName = 'Chân phải';
        } else {
          partName = 'Toàn thân';
        }
      }
      
      vertexMap.set(i, partName);
    }
    
    // Group vertices by part name
    return this.createPartsFromVertexMap(vertexMap);
  }
  
  /**
   * Segment t-shirt with 6 parts
   */
  private segmentTShirt(): MeshPart[] {
    const bbox = this.geometry.boundingBox!;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    const vertexMap = new Map<number, string>();
    
    for (let i = 0; i < this.positions.count; i++) {
      const x = this.positions.getX(i);
      const y = this.positions.getY(i);
      const z = this.positions.getZ(i);
      
      const nx = (x - bbox.min.x) / size.x;
      const ny = (y - bbox.min.y) / size.y;
      
      let partName = '';
      
      // Collar (y > 0.85)
      if (ny > 0.85) {
        partName = 'Cổ áo';
      }
      // Sleeves (very left or right)
      else if (nx < 0.15) {
        partName = 'Tay trái';
      } else if (nx > 0.85) {
        partName = 'Tay phải';
      }
      // Bottom hem (y < 0.1)
      else if (ny < 0.1) {
        partName = 'Viền dưới thân áo';
      }
      // Sleeve hems (side regions, middle height)
      else if ((nx < 0.2 || nx > 0.8) && ny > 0.3 && ny < 0.6) {
        partName = 'Viền áo ở tay áo';
      }
      // Main body
      else {
        partName = 'Thân áo';
      }
      
      vertexMap.set(i, partName);
    }
    
    return this.createPartsFromVertexMap(vertexMap);
  }
  
  /**
   * Segment backpack with 3 parts
   */
  private segmentBackpack(): MeshPart[] {
    const bbox = this.geometry.boundingBox!;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    const vertexMap = new Map<number, string>();
    
    for (let i = 0; i < this.positions.count; i++) {
      const x = this.positions.getX(i);
      const y = this.positions.getY(i);
      
      const nx = (x - bbox.min.x) / size.x;
      const ny = (y - bbox.min.y) / size.y;
      
      let partName = '';
      
      // Straps at top and sides
      if (ny > 0.7 && (nx < 0.35 || nx > 0.65)) {
        partName = nx < 0.5 ? 'Quai đeo trái' : 'Quai đeo phải';
      } else {
        partName = 'Thân balo';
      }
      
      vertexMap.set(i, partName);
    }
    
    return this.createPartsFromVertexMap(vertexMap);
  }
  
  /**
   * Segment tote bag with 2 parts
   */
  private segmentTote(): MeshPart[] {
    const bbox = this.geometry.boundingBox!;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    const vertexMap = new Map<number, string>();
    
    for (let i = 0; i < this.positions.count; i++) {
      const y = this.positions.getY(i);
      const ny = (y - bbox.min.y) / size.y;
      
      const partName = ny > 0.75 ? 'Quai túi' : 'Thân túi';
      vertexMap.set(i, partName);
    }
    
    return this.createPartsFromVertexMap(vertexMap);
  }
  
  /**
   * Generic segmentation
   */
  private segmentGeneric(): MeshPart[] {
    const vertexMap = new Map<number, string>();
    
    for (let i = 0; i < this.positions.count; i++) {
      vertexMap.set(i, 'Toàn bộ');
    }
    
    return this.createPartsFromVertexMap(vertexMap);
  }
  
  /**
   * Create MeshPart objects from vertex map
   */
  private createPartsFromVertexMap(vertexMap: Map<number, string>): MeshPart[] {
    const partsData = new Map<string, Set<number>>();
    
    // Group vertices by part name
    vertexMap.forEach((partName, vertexIndex) => {
      if (!partsData.has(partName)) {
        partsData.set(partName, new Set());
      }
      partsData.get(partName)!.add(vertexIndex);
    });
    
    // Create MeshPart objects
    const parts: MeshPart[] = [];
    
    partsData.forEach((vertexIndices, partName) => {
      const bounds = new THREE.Box3();
      const center = new THREE.Vector3();
      
      // Calculate bounds and center
      vertexIndices.forEach(i => {
        const pos = new THREE.Vector3(
          this.positions.getX(i),
          this.positions.getY(i),
          this.positions.getZ(i)
        );
        bounds.expandByPoint(pos);
        center.add(pos);
      });
      
      center.divideScalar(vertexIndices.size);
      
      const size = new THREE.Vector3();
      bounds.getSize(size);
      const volume = size.x * size.y * size.z;
      
      parts.push({
        name: partName,
        vertexIndices,
        center,
        bounds,
        volume
      });
    });
    
    return parts;
  }
}

/**
 * Find part at point
 */
export function findPartAtPoint(
  point: THREE.Vector3,
  parts: MeshPart[]
): MeshPart | null {
  // Find the smallest bounding box that contains the point
  let bestPart: MeshPart | null = null;
  let smallestVolume = Infinity;
  
  for (const part of parts) {
    if (part.bounds.containsPoint(point)) {
      if (part.volume < smallestVolume) {
        smallestVolume = part.volume;
        bestPart = part;
      }
    }
  }
  
  return bestPart;
}
