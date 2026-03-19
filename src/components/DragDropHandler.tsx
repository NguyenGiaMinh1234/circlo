import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { findPartAtPoint, MeshPart } from '@/utils/intelligentMeshSegmentation';

interface DragDropHandlerProps {
  meshRef: THREE.Mesh | null;
  allMeshes: THREE.Mesh[];
  parts: MeshPart[];
  productType?: string;
  selectedPart?: string | null;
  onPartDrop: (part: string, data: {
    type: 'color' | 'pattern' | 'logo' | 'stamp';
    value: string;
    uv?: { u: number; v: number };
    meshUuid?: string;
    worldPoint?: { x: number; y: number; z: number };
    worldNormal?: { x: number; y: number; z: number };
  }) => void;
}

export default function DragDropHandler({ meshRef, allMeshes, parts, productType, selectedPart, onPartDrop }: DragDropHandlerProps) {
  const { camera, gl } = useThree();
  const isDraggingRef = useRef(false);

  const meshScopedPartUuids = new Set(parts.filter((part) => !!part.meshUuid).map((part) => part.meshUuid as string));
  const designMeshUuids = new Set(
    (allMeshes.length > 0 ? allMeshes : meshRef ? [meshRef] : []).map((mesh) => mesh.uuid)
  );

  const normalizeMeshName = (name?: string | null): string => {
    return (name ?? '').trim().toLowerCase();
  };

  const getDropValueFromUriList = (value: string): string => {
    const firstValidLine = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith('#'));

    return firstValidLine ?? value.trim();
  };

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
    const rawUriList = dt.getData('text/uri-list');
    const rawValue =
      dt.getData('value') ||
      dt.getData('application/x-design-value') ||
      dt.getData('text/plain') ||
      rawUriList;

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

    const value = rawUriList
      ? getDropValueFromUriList(rawValue)
      : rawValue?.trim();
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

  const getPickableMeshes = (): THREE.Mesh[] => {
    const seed = allMeshes.length > 0
      ? allMeshes
      : meshRef
        ? [meshRef]
        : [];

    if (seed.length === 0) return [];

    const meshes: THREE.Mesh[] = [];
    const seen = new Set<string>();

    seed.forEach((mesh) => {
      if (seen.has(mesh.uuid)) return;
      if (!mesh.visible) return;
      if (!mesh.geometry?.attributes?.position) return;

      seen.add(mesh.uuid);
      meshes.push(mesh);
    });

    return meshes;
  };

  const resolveOwningMesh = (hitMesh: THREE.Mesh): THREE.Mesh => {
    if (designMeshUuids.size === 0 && meshScopedPartUuids.size === 0) return hitMesh;

    let current: THREE.Object3D | null = hitMesh;
    while (current) {
      if (
        current instanceof THREE.Mesh &&
        (designMeshUuids.has(current.uuid) || meshScopedPartUuids.has(current.uuid))
      ) {
        return current;
      }
      current = current.parent;
    }

    return hitMesh;
  };

  const resolvePartForHit = (hitMesh: THREE.Mesh, localPoint: THREE.Vector3): MeshPart | null => {
    const hasScopedParts = parts.some((part) => !!part.meshUuid);
    const exactScopedParts = hasScopedParts
      ? parts.filter((part) => part.meshUuid === hitMesh.uuid)
      : [];

    if (hasScopedParts && exactScopedParts.length > 0) {
      if (exactScopedParts.length === 1) return exactScopedParts[0];

      const byBounds = findPartAtPoint(localPoint, exactScopedParts);
      if (byBounds) return byBounds;

      return exactScopedParts[0];
    }

    if (hasScopedParts && exactScopedParts.length === 0) {
      return null;
    }

    const meshName = normalizeMeshName(hitMesh.name);
    const scopedParts = parts;

    const byExactMesh = scopedParts.find((part) => part.meshUuid === hitMesh.uuid);
    if (byExactMesh && scopedParts.length === 1) {
      return byExactMesh;
    }

    if (meshName) {
      const byNameAndMesh = scopedParts.find((part) => {
        return normalizeMeshName(part.name) === meshName && (!part.meshUuid || part.meshUuid === hitMesh.uuid);
      });
      if (byNameAndMesh) return byNameAndMesh;
    }

    const byBounds = findPartAtPoint(localPoint, scopedParts);
    if (byBounds) return byBounds;

    let nearest: MeshPart | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    scopedParts.forEach((part) => {
      const distance = part.center.distanceToSquared(localPoint);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = part;
      }
    });
    if (nearest) return nearest;

    if (meshName) {
      const byName = parts.find((part) => normalizeMeshName(part.name) === meshName);
      if (byName) return byName;
    }

    return parts.find((part) => part.meshUuid === hitMesh.uuid) ?? null;
  };

  const isWalletSpineMesh = (mesh: THREE.Mesh): boolean => {
    const n = (mesh.name || '').toLowerCase();
    return n.includes('pcube5');
  };

  const isWalletSpinePart = (part: MeshPart): boolean => {
    const n = (part.name || '').toLowerCase();
    return n.includes('gáy') || n.includes('gay') || n.includes('pcube5');
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
      const candidateMeshes = getPickableMeshes();
      const intersects = raycaster.intersectObjects(candidateMeshes, true)
        .filter((intersection) => intersection.object instanceof THREE.Mesh);

      if (intersects.length > 0) {
        type ResolvedHit = {
          rawHitMesh: THREE.Mesh;
          hitMesh: THREE.Mesh;
          projectedHit: THREE.Intersection<THREE.Object3D>;
          part: MeshPart | null;
        };

        const resolvedHits: ResolvedHit[] = intersects.map((intersection) => {
          const rawHitMesh = intersection.object as THREE.Mesh;
          const hitMesh = resolveOwningMesh(rawHitMesh);
          const projectedHit =
            rawHitMesh.uuid === hitMesh.uuid
              ? intersection
              : raycaster.intersectObject(hitMesh, false)[0] || intersection;

          const localPoint = hitMesh.worldToLocal(projectedHit.point.clone());
          const part = resolvePartForHit(hitMesh, localPoint);

          return {
            rawHitMesh,
            hitMesh,
            projectedHit,
            part,
          };
        });

        let chosen = resolvedHits[0];

        if (selectedPart) {
          const selectedNormalized = normalizeMeshName(selectedPart);
          const exactlySelected = resolvedHits.find((entry) => {
            return entry.part && normalizeMeshName(entry.part.name) === selectedNormalized;
          });
          if (exactlySelected) {
            chosen = exactlySelected;
          } else if (productType === 'wallet') {
            const selectedIsSpine =
              selectedNormalized.includes('gáy') ||
              selectedNormalized.includes('gay') ||
              selectedNormalized.includes('pcube5');

            if (!selectedIsSpine) {
              const nonSpine = resolvedHits.find((entry) => {
                if (!entry.part) return false;
                return !isWalletSpineMesh(entry.hitMesh) && !isWalletSpinePart(entry.part);
              });

              if (nonSpine) {
                chosen = nonSpine;
              }
            }
          }
        } else if (productType === 'wallet') {
          const selectedNormalized = (selectedPart || '').toLowerCase();
          const selectedIsSpine =
            selectedNormalized.includes('gáy') ||
            selectedNormalized.includes('gay') ||
            selectedNormalized.includes('pcube5');

          if (!selectedIsSpine) {
            const nonSpine = resolvedHits.find((entry) => {
              if (!entry.part) return false;
              return !isWalletSpineMesh(entry.hitMesh) && !isWalletSpinePart(entry.part);
            });

            if (nonSpine) {
              chosen = nonSpine;
            }
          }
        }

        const rawHitMesh = chosen.rawHitMesh;
        const hitMesh = chosen.hitMesh;
        const projectedHit = chosen.projectedHit;
        const point = projectedHit.point;
        const part = chosen.part;
        
        if (part) {
          let worldNormal = new THREE.Vector3(0, 0, 1);
          if (projectedHit.face?.normal) {
             const normalMatrix = new THREE.Matrix3().getNormalMatrix(hitMesh.matrixWorld);
             worldNormal = projectedHit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
          }

          if (worldNormal && raycaster.ray.direction.dot(worldNormal) > 0) {
            worldNormal.negate();
          }

          const surfacePoint = worldNormal
            ? point.clone().addScaledVector(worldNormal, 0.002)
            : point;
          
          onPartDrop(part.name, {
            type: payload.type,
            value: payload.value,
            uv: projectedHit.uv ? { u: projectedHit.uv.x, v: projectedHit.uv.y } : undefined,
            meshUuid: hitMesh.uuid,
            worldPoint: { x: surfacePoint.x, y: surfacePoint.y, z: surfacePoint.z },
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
      canvas.addEventListener('dragenter', handleDragOver);
      canvas.addEventListener('drop', handleDrop);

      return () => {
        canvas.removeEventListener('dragover', handleDragOver);
        canvas.removeEventListener('dragenter', handleDragOver);
        canvas.removeEventListener('drop', handleDrop);
      };
    }
  }, [camera, gl, meshRef, allMeshes, parts, productType, selectedPart, onPartDrop]);

  return null;
}

