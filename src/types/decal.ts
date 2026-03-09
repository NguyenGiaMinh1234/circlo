export type DecalType = 'logo' | 'stamp' | 'pattern' | 'paint';

export interface DecalInstance {
  id: string;
  type: DecalType;
  value: string; // URL/path to texture asset
  partName: string;
  meshUuid?: string;

  // Placement in world space
  position?: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number };

  // Appearance
  size: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  color: string; // hex, used as tint
}
