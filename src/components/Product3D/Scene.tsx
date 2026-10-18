"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import {
  Box3,
  type Group,
  MathUtils,
  type Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Texture,
  Vector3,
} from "three";
import { BLEED, MODELS, PRODUCTS_3D, type Product3DId } from "./config";
import { type MotionMode, pointer, trackPointer } from "@/components/Motion/motion";

const FOV = 30;
const CAMERA_Z = 5;
/** Ракурс 3/4 в покое */
const BASE_YAW = -0.35;
const MAX_YAW = 0.45;
const MAX_PITCH = 0.2;
const BOB_PERIOD = 5;
const BOB_HEIGHT = 0.035;
const SWAY = 0.035;
/** Скорость, с которой поворот догоняет курсор */
const DAMPING = 4;

type SceneProps = {
  product: Product3DId;
  mode: MotionMode;
  active: boolean;
  onReady: () => void;
};

export default function Scene({ product, mode, active, onReady }: SceneProps) {
  const animated = mode !== "static";

  return (
    <Canvas
      flat
      dpr={[1, 2]}
      frameloop={animated && active ? "always" : "demand"}
      camera={{ fov: FOV, position: [0, 0, CAMERA_Z] }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      // R3F ставит обёртке pointer-events: auto — канвас с запасом перекрывал бы ховер под собой.
      // Курсор сцена читает с window, свои события ей не нужны
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={1.6} />
      <directionalLight position={[-3, 4, 5]} intensity={1.4} />
      <Suspense fallback={null}>
        <Model product={product} mode={mode} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

function prepareTexture(texture: Texture | Texture[]) {
  for (const t of Array.isArray(texture) ? texture : [texture]) {
    // UV в glTF идут от верхнего левого угла
    t.flipY = false;
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
  }
}

type ModelProps = Omit<SceneProps, "active">;

function Model({ product, mode, onReady }: ModelProps) {
  const { model: kind, texture: textureUrl, phase } = PRODUCTS_3D[product];
  const model = MODELS[kind];
  const { scene } = useGLTF(model.url);
  const map = useTexture(textureUrl, prepareTexture);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const group = useRef<Group>(null);

  const { object, size } = useMemo(() => {
    const material = new MeshStandardMaterial({ map, roughness: 0.85, metalness: 0 });
    const root = scene.clone(true);
    root.rotation.set(...model.rotation);
    root.traverse((child) => {
      if ((child as Mesh).isMesh) (child as Mesh).material = material;
    });
    root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root);
    root.position.sub(box.getCenter(new Vector3()));
    return { object: root, size: box.getSize(new Vector3()) };
  }, [scene, map, model.rotation]);

  // Вписываем модель в слот: canvas больше слота на BLEED с каждой стороны
  const scale = useMemo(() => {
    const viewHeight = 2 * CAMERA_Z * Math.tan(MathUtils.degToRad(FOV / 2));
    const slotHeight = viewHeight / (1 + 2 * BLEED);
    const slotWidth = slotHeight * aspect;
    // При повороте видимая ширина растёт до диагонали основания
    const width = Math.hypot(size.x, size.z);
    return Math.min(slotHeight / size.y, slotWidth / width);
  }, [aspect, size]);

  useEffect(() => {
    if (mode !== "follow") return;
    return trackPointer();
  }, [mode]);

  useEffect(onReady, [onReady]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    if (mode === "static") {
      g.position.y = 0;
      g.rotation.set(0, BASE_YAW, 0);
      return;
    }

    const t = state.clock.elapsedTime + phase;
    const wave = (t / BOB_PERIOD) * Math.PI * 2;
    g.position.y = Math.sin(wave) * BOB_HEIGHT;
    g.rotation.z = Math.sin(wave + 1) * SWAY;

    let yaw = BASE_YAW + Math.sin(wave * 0.5) * 0.12;
    let pitch = 0;
    if (mode === "follow" && pointer.active) {
      const rect = state.gl.domElement.getBoundingClientRect();
      const dx = (pointer.x - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      const dy = (pointer.y - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
      yaw = BASE_YAW + MathUtils.clamp(dx, -1, 1) * MAX_YAW;
      pitch = MathUtils.clamp(dy, -1, 1) * MAX_PITCH;
    }
    g.rotation.y = MathUtils.damp(g.rotation.y, yaw, DAMPING, delta);
    g.rotation.x = MathUtils.damp(g.rotation.x, pitch, DAMPING, delta);
  });

  return (
    <group ref={group} rotation={[0, BASE_YAW, 0]}>
      {/* Масштаб — снаружи, иначе смещение к центру модели тоже бы масштабировалось */}
      <group scale={scale}>
        <primitive object={object} />
      </group>
    </group>
  );
}

// Модели и все этикетки качаем сразу с модулем сцены, а не когда очередь дойдёт до слота
useGLTF.preload(MODELS.bag.url);
useGLTF.preload(MODELS.box.url);
useTexture.preload(Object.values(PRODUCTS_3D).map((p) => p.texture));
