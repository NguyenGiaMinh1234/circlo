import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { findPartAtPoint, MeshPart } from '@/utils/intelligentMeshSegmentation';

interface DragDropHandlerProps {
  meshRef: THREE.Mesh | null;
  allMeshes: THREE.Mesh[];
  parts: MeshPart[];
  onPartDrop: (part: string, data: {
    type: 'color' | 'pattern' | 'logo' | 'stamp';
    value: string;
    uv?: { u: number; v: number };
    meshUuid?: string;
    worldPoint?: { x: number; y: number; z: number };
    worldNormal?: { x: number; y: number; z: number };
  }) => void;
}

export default function DragDropHandler({ meshRef, allMeshes, parts, onPartDrop }: DragDropHandlerProps) {
  const { camera } = useThree();
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!meshRef || parts.length === 0) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = false;

      // Get drag data
      const dragType = e.dataTransfer?.getData('type');
      const dragValue = e.dataTransfer?.getData('value');

      if (!dragType || !dragValue) return;

      // Calculate pointer position
      const canvas = e.currentTarget as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast to find intersected object
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const candidateMeshes = allMeshes.length > 0 ? allMeshes : [meshRef];
      let intersects = raycaster.intersectObjects(candidateMeshes, false);
      if (intersects.length === 0) {
        intersects = raycaster.intersectObject(meshRef, false);
      }

      if (intersects.length > 0) {
        const hit = intersects[0];
        const hitMesh = hit.object as THREE.Mesh;
        const point = hit.point;
        const localPoint = hitMesh.worldToLocal(point.clone());

        let part: MeshPart | undefined;

        if (candidateMeshes.length > 1 && hitMesh.name) {
          part = parts.find(
            (p) => p.name === hitMesh.name && (!p.meshUuid || p.meshUuid === hitMesh.uuid)
          );
        }

        if (!part) {
          const scopedParts = parts.some((p) => !!p.meshUuid)
            ? parts.filter((p) => !p.meshUuid || p.meshUuid === hitMesh.uuid)
            : parts;
          part = findPartAtPoint(localPoint, scopedParts);
        }
        
        if (part) {
          // Ensure type is valid
          const validType = ['color', 'pattern', 'logo', 'stamp'].includes(dragType) 
            ? dragType as 'color' | 'pattern' | 'logo' | 'stamp'
            : 'pattern'; // fallback

          const worldNormal = hit.face?.normal
            ? hit.face.normal.clone().transformDirection(hitMesh.matrixWorld).normalize()
            : undefined;
          
          onPartDrop(part.name, {
            type: validType,
            value: dragValue,
            uv: hit.uv ? { u: hit.uv.x, v: hit.uv.y } : undefined,
            meshUuid: hitMesh.uuid,
            worldPoint: { x: point.x, y: point.y, z: point.z },
            worldNormal: worldNormal
              ? { x: worldNormal.x, y: worldNormal.y, z: worldNormal.z }
              : undefined,
          });
        }
      }
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('dragover', handleDragOver);
      canvas.addEventListener('drop', handleDrop);

      return () => {
        canvas.removeEventListener('dragover', handleDragOver);
        canvas.removeEventListener('drop', handleDrop);
      };
    }
  }, [camera, meshRef, allMeshes, parts, onPartDrop]);

  return null;
}

