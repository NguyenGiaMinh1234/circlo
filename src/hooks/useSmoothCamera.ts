import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface SmoothCameraConfig {
  transitionDuration?: number;
  easing?: 'easeInOut' | 'easeOut' | 'linear';
  minDistance?: number;
  maxDistance?: number;
  zoomSpeed?: number;
}

type CameraControls = OrbitControlsImpl | null | undefined;

const easingFunctions: Record<NonNullable<SmoothCameraConfig['easing']>, (t: number) => number> = {
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  linear: (t: number) => t,
};

export function useSmoothCamera(config: SmoothCameraConfig = {}) {
  const {
    transitionDuration = 800,
    easing = 'easeInOut',
    minDistance = 2,
    maxDistance = 15,
    zoomSpeed = 0.8,
  } = config;

  const animationRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  const animateCamera = useCallback((
    camera: THREE.PerspectiveCamera,
    controls: CameraControls,
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    onComplete?: () => void
  ) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startPosition = camera.position.clone();
    const startTarget = controls?.target?.clone() || new THREE.Vector3(0, 0, 0);
    const startTime = performance.now();

    isAnimatingRef.current = true;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / transitionDuration, 1);
      const easedProgress = easingFunctions[easing](progress);

      // Interpolate camera position
      camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
      
      // Interpolate look-at target
      if (controls) {
        controls.target.lerpVectors(startTarget, targetLookAt, easedProgress);
        controls.update();
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [transitionDuration, easing]);

  const smoothZoom = useCallback((
    camera: THREE.PerspectiveCamera,
    controls: CameraControls,
    delta: number,
    onComplete?: () => void
  ) => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    const currentDistance = camera.position.length();
    const targetDistance = Math.max(minDistance, Math.min(maxDistance, currentDistance - delta * zoomSpeed));
    
    const targetPosition = direction.multiplyScalar(-targetDistance);
    
    animateCamera(camera, controls, targetPosition, new THREE.Vector3(0, 0, 0), onComplete);
  }, [minDistance, maxDistance, zoomSpeed, animateCamera]);

  const smoothRotateToView = useCallback((
    camera: THREE.PerspectiveCamera,
    controls: CameraControls,
    view: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'isometric',
    distance: number = 5,
    onComplete?: () => void
  ) => {
    const positions: Record<string, [number, number, number]> = {
      front: [0, 0, distance],
      back: [0, 0, -distance],
      left: [-distance, 0, 0],
      right: [distance, 0, 0],
      top: [0, distance, 0.01],
      bottom: [0, -distance, 0.01],
      isometric: [distance * 0.7, distance * 0.7, distance * 0.7],
    };

    const pos = positions[view] || positions.front;
    const targetPosition = new THREE.Vector3(pos[0], pos[1], pos[2]);

    animateCamera(camera, controls, targetPosition, new THREE.Vector3(0, 0, 0), onComplete);
  }, [animateCamera]);

  const smoothReset = useCallback((
    camera: THREE.PerspectiveCamera,
    controls: CameraControls,
    defaultPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 5),
    onComplete?: () => void
  ) => {
    animateCamera(camera, controls, defaultPosition, new THREE.Vector3(0, 0, 0), onComplete);
  }, [animateCamera]);

  const focusOnPart = useCallback((
    camera: THREE.PerspectiveCamera,
    controls: CameraControls,
    boundingBox: THREE.Box3,
    padding: number = 1.5,
    onComplete?: () => void
  ) => {
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = (maxDim * padding) / Math.tan(fov / 2);
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    const targetPosition = center.clone().sub(direction.multiplyScalar(cameraDistance));

    animateCamera(camera, controls, targetPosition, center, onComplete);
  }, [animateCamera]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  return {
    animateCamera,
    smoothZoom,
    smoothRotateToView,
    smoothReset,
    focusOnPart,
    stopAnimation,
    isAnimating: isAnimatingRef.current,
  };
}
