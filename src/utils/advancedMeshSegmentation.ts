import * as THREE from "three";

export interface MeshSegment {
  name: string;
  vertexIndices: number[];
  center: THREE.Vector3;
  color: THREE.Color;
  averageNormal: THREE.Vector3;
  bounds: THREE.Box3;
}

/**
 * Advanced mesh segmentation using vertex colors, position clustering, and normal analysis
 */
export class AdvancedMeshSegmenter {
  private geometry: THREE.BufferGeometry;
  private productType: string;
  
  constructor(geometry: THREE.BufferGeometry, productType: string) {
    this.geometry = geometry;
    this.productType = productType;
    
    if (!this.geometry.boundingBox) {
      this.geometry.computeBoundingBox();
    }
    if (!this.geometry.attributes.normal) {
      this.geometry.computeVertexNormals();
    }
  }
  
  /**
   * Main segmentation function that combines multiple techniques
   */
  segment(): MeshSegment[] {
    console.log('\n🔬 === ADVANCED MESH SEGMENTATION ===');
    console.log('Product type:', this.productType);
    
    // Always use spatial clustering for better control
    console.log('→ Using spatial + normal analysis for precise segmentation');
    const spatialSegments = this.segmentBySpatialClustering();
    return this.mapSegmentsToProductParts(spatialSegments);
  }
  
  /**
   * Segment by vertex colors (most accurate if available)
   */
  private segmentByVertexColors(): MeshSegment[] {
    const colors = this.geometry.attributes.color;
    if (!colors) {
      console.log('⚠️  No vertex colors found');
      return [];
    }
    
    console.log('📊 Analyzing vertex colors...');
    const segments: Map<string, number[]> = new Map();
    const positions = this.geometry.attributes.position;
    
    for (let i = 0; i < colors.count; i++) {
      const r = Math.round(colors.getX(i) * 255);
      const g = Math.round(colors.getY(i) * 255);
      const b = Math.round(colors.getZ(i) * 255);
      const colorKey = `${r},${g},${b}`;
      
      if (!segments.has(colorKey)) {
        segments.set(colorKey, []);
      }
      segments.get(colorKey)!.push(i);
    }
    
    console.log(`✓ Found ${segments.size} unique color regions`);
    
    return Array.from(segments.entries()).map(([colorKey, indices], index) => {
      const [r, g, b] = colorKey.split(',').map(Number);
      return this.createSegmentFromIndices(indices, index, new THREE.Color(r / 255, g / 255, b / 255));
    });
  }
  
  /**
   * Segment by spatial position + normal direction
   */
  private segmentBySpatialClustering(): MeshSegment[] {
    const targetSegments = this.getTargetSegmentCount();
    console.log(`🎯 Target segments: ${targetSegments}`);
    
    const positions = this.geometry.attributes.position;
    const normals = this.geometry.attributes.normal;
    const bbox = this.geometry.boundingBox!;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    // Use strategic divisions based on product type
    const divisions = this.getStrategicDivisions();
    console.log('Strategic divisions:', divisions);
    
    const segments: MeshSegment[] = [];
    const vertexAssignments = new Map<number, number>();
    
    // Create initial regions based on spatial position
    const regions: { indices: number[], center: THREE.Vector3, normal: THREE.Vector3 }[] = [];
    
    for (let x = 0; x < divisions.x; x++) {
      for (let y = 0; y < divisions.y; y++) {
        for (let z = 0; z < divisions.z; z++) {
          const minX = bbox.min.x + (size.x / divisions.x) * x;
          const maxX = bbox.min.x + (size.x / divisions.x) * (x + 1);
          const minY = bbox.min.y + (size.y / divisions.y) * y;
          const maxY = bbox.min.y + (size.y / divisions.y) * (y + 1);
          const minZ = bbox.min.z + (size.z / divisions.z) * z;
          const maxZ = bbox.min.z + (size.z / divisions.z) * (z + 1);
          
          const indices: number[] = [];
          const avgNormal = new THREE.Vector3();
          const avgPos = new THREE.Vector3();
          
          for (let i = 0; i < positions.count; i++) {
            const px = positions.getX(i);
            const py = positions.getY(i);
            const pz = positions.getZ(i);
            
            if (px >= minX && px < maxX && py >= minY && py < maxY && pz >= minZ && pz < maxZ) {
              indices.push(i);
              avgPos.add(new THREE.Vector3(px, py, pz));
              avgNormal.add(new THREE.Vector3(
                normals.getX(i),
                normals.getY(i),
                normals.getZ(i)
              ));
            }
          }
          
          if (indices.length > 0) {
            avgPos.divideScalar(indices.length);
            avgNormal.normalize();
            regions.push({ indices, center: avgPos, normal: avgNormal });
          }
        }
      }
    }
    
    console.log(`✓ Created ${regions.length} spatial regions`);
    
    // Merge similar regions based on connectivity and normal similarity
    const mergedSegments = this.mergeRegionsByConnectivity(regions);
    
    return mergedSegments.map((seg, idx) => 
      this.createSegmentFromIndices(seg.indices, idx, new THREE.Color(1, 1, 1))
    );
  }
  
  /**
   * Merge regions that are spatially connected and have similar normals
   */
  private mergeRegionsByConnectivity(
    regions: { indices: number[], center: THREE.Vector3, normal: THREE.Vector3 }[]
  ): { indices: number[], center: THREE.Vector3, normal: THREE.Vector3 }[] {
    const merged: typeof regions = [];
    const used = new Set<number>();
    
    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;
      
      const current = regions[i];
      const group = { ...current, indices: [...current.indices] };
      used.add(i);
      
      // Find neighbors to merge
      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;
        
        const neighbor = regions[j];
        const distance = current.center.distanceTo(neighbor.center);
        const normalSimilarity = current.normal.dot(neighbor.normal);
        
        // Merge if close and similar direction
        if (distance < 0.5 && normalSimilarity > 0.8) {
          group.indices.push(...neighbor.indices);
          used.add(j);
        }
      }
      
      merged.push(group);
    }
    
    console.log(`✓ Merged into ${merged.length} connected segments`);
    return merged;
  }
  
  /**
   * Create segment object from vertex indices
   */
  private createSegmentFromIndices(
    indices: number[],
    index: number,
    color: THREE.Color
  ): MeshSegment {
    const positions = this.geometry.attributes.position;
    const normals = this.geometry.attributes.normal;
    
    const center = new THREE.Vector3();
    const avgNormal = new THREE.Vector3();
    const bounds = new THREE.Box3();
    
    indices.forEach(i => {
      const pos = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      center.add(pos);
      bounds.expandByPoint(pos);
      
      avgNormal.add(new THREE.Vector3(
        normals.getX(i),
        normals.getY(i),
        normals.getZ(i)
      ));
    });
    
    center.divideScalar(indices.length);
    avgNormal.normalize();
    
    return {
      name: `Segment_${index}`,
      vertexIndices: indices,
      center,
      color,
      averageNormal: avgNormal,
      bounds
    };
  }
  
  /**
   * Map generic segments to product-specific part names
   */
  private mapSegmentsToProductParts(segments: MeshSegment[]): MeshSegment[] {
    console.log(`\n🏷️  Mapping ${segments.length} segments to product parts...`);
    
    // Sort segments by position for consistent naming
    segments.sort((a, b) => {
      // Primary: Y position (top to bottom)
      if (Math.abs(a.center.y - b.center.y) > 0.1) {
        return b.center.y - a.center.y;
      }
      // Secondary: X position (left to right)
      if (Math.abs(a.center.x - b.center.x) > 0.1) {
        return a.center.x - b.center.x;
      }
      // Tertiary: Z position (front to back)
      return b.center.z - a.center.z;
    });
    
    const partNames = this.getProductPartNames();
    const bbox = this.geometry.boundingBox!;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    segments.forEach((segment, index) => {
      const relativePos = {
        x: (segment.center.x - bbox.min.x) / size.x,
        y: (segment.center.y - bbox.min.y) / size.y,
        z: (segment.center.z - bbox.min.z) / size.z
      };
      
      segment.name = this.assignPartName(relativePos, segment, index, partNames);
    });
    
    // Group segments with same name
    const groupedSegments = this.groupSegmentsByName(segments);
    
    console.log('\n✓ Final part mapping:');
    groupedSegments.forEach((seg, i) => {
      console.log(`  ${i + 1}. ${seg.name} (${seg.vertexIndices.length} vertices)`);
    });
    
    return groupedSegments;
  }
  
  /**
   * Group segments that have the same part name - merge all vertices into one segment
   */
  private groupSegmentsByName(segments: MeshSegment[]): MeshSegment[] {
    const grouped = new Map<string, MeshSegment>();
    
    segments.forEach(segment => {
      if (!grouped.has(segment.name)) {
        // Create new grouped segment
        grouped.set(segment.name, {
          name: segment.name,
          vertexIndices: [...segment.vertexIndices],
          center: segment.center.clone(),
          color: segment.color.clone(),
          averageNormal: segment.averageNormal.clone(),
          bounds: segment.bounds.clone()
        });
      } else {
        // Merge with existing segment
        const existing = grouped.get(segment.name)!;
        
        // Add all vertex indices (remove duplicates)
        const uniqueIndices = new Set([...existing.vertexIndices, ...segment.vertexIndices]);
        existing.vertexIndices = Array.from(uniqueIndices);
        
        // Expand bounds to include this segment
        existing.bounds.union(segment.bounds);
        
        // Recalculate center as average of all vertices
        const positions = this.geometry.attributes.position;
        const center = new THREE.Vector3();
        existing.vertexIndices.forEach(idx => {
          center.add(new THREE.Vector3(
            positions.getX(idx),
            positions.getY(idx),
            positions.getZ(idx)
          ));
        });
        center.divideScalar(existing.vertexIndices.length);
        existing.center = center;
      }
    });
    
    const result = Array.from(grouped.values());
    console.log(`✓ Grouped into ${result.length} unique parts`);
    
    return result;
  }
  
  /**
   * Assign part name based on position and product type
   */
  private assignPartName(
    relativePos: { x: number, y: number, z: number },
    segment: MeshSegment,
    index: number,
    partNames: string[]
  ): string {
    const { x, y, z } = relativePos;
    
    switch (this.productType) {
      case 'teddy':
        return this.assignTeddyPartName(x, y, z, segment);
      case 'tshirt':
        return this.assignTShirtPartName(x, y, z, segment);
      case 'backpack':
        return this.assignBackpackPartName(x, y, z, segment);
      case 'tote':
        return this.assignTotePartName(x, y, z, segment);
      default:
        return partNames[Math.min(index, partNames.length - 1)];
    }
  }
  
  private assignTeddyPartName(x: number, y: number, z: number, segment: MeshSegment): string {
    const size = new THREE.Vector3();
    segment.bounds.getSize(size);
    const vertexCount = segment.vertexIndices.length;
    
    // Top region (ears and eyes)
    if (y > 0.75) {
      if (x < 0.35 && vertexCount < 5000) return 'Tai trái';
      if (x > 0.65 && vertexCount < 5000) return 'Tai phải';
      if (x < 0.4 && size.x < 0.15 && size.y < 0.15) return 'Mắt trái';
      if (x > 0.6 && size.x < 0.15 && size.y < 0.15) return 'Mắt phải';
      return 'Đầu';
    }
    
    // Head region
    if (y > 0.55) {
      if (x < 0.35 && size.x < 0.15) return 'Mắt trái';
      if (x > 0.65 && size.x < 0.15) return 'Mắt phải';
      return 'Đầu';
    }
    
    // Upper body (arms and chest)
    if (y > 0.35) {
      if (x < 0.3) return 'Tay trái';
      if (x > 0.7) return 'Tay phải';
      return 'Toàn thân';
    }
    
    // Lower body
    if (y > 0.15) {
      return 'Toàn thân';
    }
    
    // Legs
    if (x < 0.4) return 'Chân trái';
    if (x > 0.6) return 'Chân phải';
    return 'Toàn thân';
  }
  
  private assignTShirtPartName(x: number, y: number, z: number, segment: MeshSegment): string {
    // Collar
    if (y > 0.85) return 'Cổ áo';
    
    // Sleeves
    if (x < 0.2) return 'Tay trái';
    if (x > 0.8) return 'Tay phải';
    
    // Bottom hem
    if (y < 0.15) return 'Viền dưới thân áo';
    
    // Sleeve hems
    if (y > 0.3 && y < 0.6 && (x < 0.15 || x > 0.85)) {
      return 'Viền áo ở tay áo';
    }
    
    // Body
    return 'Thân áo';
  }
  
  private assignBackpackPartName(x: number, y: number, z: number, segment: MeshSegment): string {
    // Straps at top
    if (y > 0.7) {
      if (x < 0.4) return 'Quai đeo trái';
      if (x > 0.6) return 'Quai đeo phải';
    }
    
    return 'Thân balo';
  }
  
  private assignTotePartName(x: number, y: number, z: number, segment: MeshSegment): string {
    // Handles at top
    if (y > 0.8) return 'Quai túi';
    
    return 'Thân túi';
  }
  
  /**
   * Get strategic divisions for each product type
   */
  private getStrategicDivisions(): { x: number, y: number, z: number } {
    switch (this.productType) {
      case 'teddy':
        return { x: 7, y: 8, z: 4 }; // More divisions for detailed parts
      case 'tshirt':
        return { x: 5, y: 5, z: 2 };
      case 'backpack':
        return { x: 3, y: 4, z: 2 };
      case 'tote':
        return { x: 2, y: 4, z: 2 };
      default:
        return { x: 3, y: 4, z: 2 };
    }
  }
  
  /**
   * Get target number of segments for product
   */
  private getTargetSegmentCount(): number {
    switch (this.productType) {
      case 'teddy':
        return 10; // tay trái, tay phải, toàn thân, chân trái, chân phải, đầu, tai trái, tai phải, mắt trái, mắt phải
      case 'tshirt':
        return 6; // Viền áo ở tay áo, viền dưới thân áo, thân áo, cổ áo, tay trái, tay phải
      case 'backpack':
        return 3; // quai đeo trái, quai đeo phải, thân balo
      case 'tote':
        return 2; // quai túi, thân túi
      default:
        return 5;
    }
  }
  
  /**
   * Get part names for product type
   */
  private getProductPartNames(): string[] {
    switch (this.productType) {
      case 'teddy':
        return ['Tay trái', 'Tay phải', 'Toàn thân', 'Chân trái', 'Chân phải', 
                'Đầu', 'Tai trái', 'Tai phải', 'Mắt trái', 'Mắt phải'];
      case 'tshirt':
        return ['Viền áo ở tay áo', 'Viền dưới thân áo', 'Thân áo', 'Cổ áo', 'Tay trái', 'Tay phải'];
      case 'backpack':
        return ['Quai đeo trái', 'Quai đeo phải', 'Thân balo'];
      case 'tote':
        return ['Quai túi', 'Thân túi'];
      default:
        return ['Part 1', 'Part 2', 'Part 3'];
    }
  }
}

/**
 * Helper function to apply color to segment
 */
export function applyColorToSegment(
  geometry: THREE.BufferGeometry,
  segment: MeshSegment,
  color: THREE.Color
): void {
  let colors = geometry.attributes.color;
  
  if (!colors) {
    const colorArray = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < colorArray.length; i += 3) {
      colorArray[i] = 1;
      colorArray[i + 1] = 1;
      colorArray[i + 2] = 1;
    }
    colors = new THREE.BufferAttribute(colorArray, 3);
    geometry.setAttribute('color', colors);
  }
  
  segment.vertexIndices.forEach(index => {
    colors.setXYZ(index, color.r, color.g, color.b);
  });
  
  colors.needsUpdate = true;
  segment.color = color.clone();
}

/**
 * Find segment at point
 */
export function findSegmentAtPoint(
  point: THREE.Vector3,
  segments: MeshSegment[]
): MeshSegment | null {
  for (const segment of segments) {
    if (segment.bounds.containsPoint(point)) {
      return segment;
    }
  }
  return null;
}
