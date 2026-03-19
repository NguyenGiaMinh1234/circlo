import { Canvas } from "@react-three/fiber";
import { Bounds, ContactShadows, OrbitControls, useBounds, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function PreviewModel({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);
  const group = useRef<THREE.Group>(null);
  const bounds = useBounds();

  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (!group.current) return;
    bounds.refresh(group.current).fit();
  }, [bounds, modelPath]);

  return (
    <group ref={group}>
      <primitive object={cloned} />
    </group>
  );
}

export function ProductPreview3D({ modelPath }: { modelPath: string }) {
  return (
    <div className="h-full w-full">
      <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 0.9, 2.2], fov: 45 }}>
        <color attach="background" args={["#ffffff"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 2]} intensity={0.9} castShadow />

        <Suspense fallback={null}>
          <Bounds fit clip margin={1.2}>
            <PreviewModel modelPath={modelPath} />
          </Bounds>
          <ContactShadows position={[0, -0.9, 0]} opacity={0.35} blur={2.2} far={2.5} />
        </Suspense>

        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/ao-thun.glb");
useGLTF.preload("/models/tui-tote.glb");
useGLTF.preload("/models/balo.glb");
useGLTF.preload("/models/Vi2.glb");
