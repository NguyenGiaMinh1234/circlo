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
  const { camera, gl } = useThree();
  const isDraggingRef = useRef(false);

  const inferDropTypeFromValue = (value: string): 'color' | 'pattern' | 'logo' | 'stamp' | null => {
    const lower = value.toLowerCase();

    if (lower.startsWith('#')) return 'color';
    if (lower.includes('/logos/') || lower.includes('logo')) return 'logo';
    if (lower.includes('/patterns/') || lower.includes('pattern')) return 'pattern';
    if (lower.includes('/stamps/') || lower.includes('stamp')) return 'stamp';
    if (/\.(png|jpe?g|svg|webp)(\?.*)?$/.test(lower)) return 'logo';

    return null;
  };

  const getDropPayload = (event: DragEvent): { type: 'color' | 'pattern' | 'logo' | 'stamp'; value: string } | null => {
    const dt = event.dataTransfer;
    if (!dt) return null;

    const rawType =
      dt.getData('type') ||
      dt.getData('application/x-design-type') ||
      dt.getData('text/type');

    const rawJson = dt.getData('application/json');
    const rawValue =
      dt.getData('value') ||
      dt.getData('application/x-design-value') ||
      dt.getData('text/plain') ||
      dt.getData('text/uri-list');

    if (rawJson) {
      try {
        const parsed = JSON.parse(rawJson) as { type?: string; value?: string };
        const type = parsed?.type?.trim();
        const value = parsed?.value?.trim();
        if (type && value && ['color', 'pattern', 'logo', 'stamp'].includes(type)) {
          return {
            type: type as 'color' | 'pattern' | 'logo' | 'stamp',
            value,
          };
        }
      } catch {
        // Ignore malformed JSON payload and continue with other formats.
      }
    }

    const value = rawValue?.trim();
    if (!value) return null;

    const inferredType = inferDropTypeFromValue(value);
    const candidateType = rawType?.trim() || inferredType;

    if (!candidateType || !['color', 'pattern', 'logo', 'stamp'].includes(candidateType)) {
      return null;
    }

    return {
      type: candidateType as 'color' | 'pattern' | 'logo' | 'stamp',
      value,
    };
  };

  useEffect(() => {
    if (!meshRef || parts.length === 0) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = false;

      const payload = getDropPayload(e);
      if (!payload) return;

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

        // Fallback for models whose segmentation bounds do not perfectly match drop hit.
        if (!part) {
          part =
            parts.find((p) => p.meshUuid === hitMesh.uuid) ||
            (hitMesh.name ? parts.find((p) => p.name === hitMesh.name) : undefined) ||
            undefined;
        }
        
        if (part) {
          // Ensure type is valid
          const worldNormal = hit.face?.normal
            ? hit.face.normal.clone().transformDirection(hitMesh.matrixWorld).normalize()
            : undefined;
          
          onPartDrop(part.name, {
            type: payload.type,
            value: payload.value,
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

    const canvas = gl.domElement;
    if (canvas) {
      canvas.addEventListener('dragover', handleDragOver);
      canvas.addEventListener('drop', handleDrop);

      return () => {
        canvas.removeEventListener('dragover', handleDragOver);
        canvas.removeEventListener('drop', handleDrop);
      };
    }
  }, [camera, gl, meshRef, allMeshes, parts, onPartDrop]);

  return null;
}

