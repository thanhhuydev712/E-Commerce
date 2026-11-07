"use client";
import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentRef,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Group, MathUtils } from "three";
import type { Build, Slot } from "@/src/features/pc-builder/lib/compatibility";
type Vec = [number, number, number];
function Box({
  position = [0, 0, 0],
  size,
  color = "#252e39",
  metal = 0.65,
  roughness = 0.35,
}: {
  position?: Vec;
  size: Vec;
  color?: string;
  metal?: number;
  roughness?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={metal}
        roughness={roughness}
      />
    </mesh>
  );
}
function Fan({
  position,
  powered,
  animate = true,
  color = "#42f4b8",
  rotation = [0, 0, 0],
}: {
  position: Vec;
  powered: boolean;
  animate?: boolean;
  color?: string;
  rotation?: Vec;
}) {
  const blades = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [powered, animate, invalidate]);
  useFrame((_, delta) => {
    if (blades.current && powered && animate) {
      blades.current.rotation.z += Math.min(delta, 0.1) * 7;
      invalidate();
    }
  });
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.61, 0.61, 0.07]} color="#111821" />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.245, 0.016, 10, 40]} />
        <meshStandardMaterial
          color={powered ? color : "#465563"}
          emissive={powered ? color : "#000000"}
          emissiveIntensity={powered ? 1.5 : 0}
        />
      </mesh>
      <group ref={blades}>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 7]}>
            <mesh position={[0.09, 0.08, 0.055]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[0.11, 0.27, 0.018]} />
              <meshStandardMaterial color="#34424c" metalness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.063, 0.063, 0.04, 20]} />
        <meshStandardMaterial color="#81959b" />
      </mesh>
    </group>
  );
}
function AnimatedPart({
  slot,
  exploded,
  reduceMotion,
  children,
}: {
  slot: Slot;
  exploded: boolean;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  const initialized = useRef(false);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [exploded, reduceMotion, invalidate]);
  const offsets: Record<Slot, Vec> = {
    cpu: [-0.9, 0.4, 1.7],
    mainboard: [-0.7, 0.1, 1.1],
    ram: [0.7, 0.3, 1.5],
    gpu: [-0.7, -0.3, 1.6],
    ssd: [0.9, -0.3, 1.3],
    psu: [-0.7, -0.8, 0.8],
    case: [0, 0, 0],
    cooler: [0, 0.8, 2],
  };
  useFrame((_, delta) => {
    if (!ref.current) return;
    const target = exploded ? offsets[slot] : [0, 0, 0];
    if (!initialized.current) {
      ref.current.position.set(
        ...(reduceMotion ? (target as Vec) : offsets[slot]),
      );
      initialized.current = true;
    }
    const t = reduceMotion ? 1 : 1 - Math.exp(-delta * 5);
    ref.current.position.x = MathUtils.lerp(
      ref.current.position.x,
      target[0],
      t,
    );
    ref.current.position.y = MathUtils.lerp(
      ref.current.position.y,
      target[1],
      t,
    );
    ref.current.position.z = MathUtils.lerp(
      ref.current.position.z,
      target[2],
      t,
    );
    if (
      Math.abs(ref.current.position.x - target[0]) +
        Math.abs(ref.current.position.y - target[1]) +
        Math.abs(ref.current.position.z - target[2]) >
      0.001
    )
      invalidate();
  });
  return <group ref={ref}>{children}</group>;
}
function Machine({
  build,
  exploded,
  powered,
  panelOpen,
  reduceMotion,
}: {
  build: Build;
  exploded: boolean;
  powered: boolean;
  panelOpen: boolean;
  reduceMotion: boolean;
}) {
  const active = (slot: Slot, children: ReactNode) =>
    build[slot] ? (
      <AnimatedPart
        key={`${slot}-${build[slot]}`}
        slot={slot}
        exploded={exploded}
        reduceMotion={reduceMotion}
      >
        {children}
      </AnimatedPart>
    ) : null;
  return (
    <group position={[0, -0.02, 0]}>
      {build.case && (
        <group>
          <Box
            position={[0, -1.45, 0]}
            size={[1.7, 0.08, 1.2]}
            color="#242e38"
          />
          <Box position={[0, 1.45, 0]} size={[1.7, 0.07, 1.2]} />
          <Box
            position={[0, 0, -0.58]}
            size={[1.7, 2.9, 0.05]}
            color="#19232e"
          />
          {[-0.82, 0.82].flatMap((x) =>
            [-0.55, 0.55].map((z) => (
              <Box
                key={`${x}${z}`}
                position={[x, 0, z]}
                size={[0.055, 2.9, 0.055]}
                color="#65707b"
              />
            )),
          )}
          <Box
            position={[0.83, 0, 0]}
            size={[0.04, 2.9, 1.15]}
            color="#121923"
          />
          {[-0.92, 0, 0.92].map((y) => (
            <Fan
              key={y}
              position={[0.865, y, 0]}
              rotation={[0, Math.PI / 2, 0]}
              powered={powered}
              animate={!reduceMotion}
            />
          ))}
          <Box position={[0, -1.05, 0]} size={[1.64, 0.03, 1.15]} />
          {[-0.62, 0.62].map((x) => (
            <Box
              key={x}
              position={[x, -1.52, 0]}
              size={[0.17, 0.12, 0.85]}
              color="#11161b"
            />
          ))}
          {!panelOpen && !exploded && (
            <mesh position={[0, 0, 0.59]}>
              <boxGeometry args={[1.62, 2.83, 0.025]} />
              <meshPhysicalMaterial
                color="#a5d9df"
                metalness={0.1}
                roughness={0.1}
                transparent
                opacity={0.14}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      )}
      {active(
        "mainboard",
        <group>
          <Box
            position={[-0.15, 0.22, -0.44]}
            size={[1.17, 1.57, 0.035]}
            color="#1e3637"
          />
          {[-0.65, -0.5, -0.35].map((x) => (
            <Box
              key={x}
              position={[x, 0.73, -0.39]}
              size={[0.09, 0.4, 0.08]}
              color="#5b656b"
            />
          ))}
          <Box
            position={[-0.23, 0.48, -0.35]}
            size={[0.36, 0.38, 0.05]}
            color="#929ca0"
          />
          <Box
            position={[-0.16, -0.25, -0.36]}
            size={[0.72, 0.09, 0.07]}
            color="#88959b"
          />
          {[0, 1, 2, 3].map((i) => (
            <Box
              key={i}
              position={[0.17 + i * 0.065, 0.54, -0.38]}
              size={[0.035, 0.65, 0.07]}
              color="#0d1418"
            />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <Box
              key={i}
              position={[
                -0.61 + (i % 4) * 0.24,
                -0.46 + Math.floor(i / 4) * 0.19,
                -0.39,
              ]}
              size={[0.1, 0.08, 0.025]}
              color="#b4b6a6"
            />
          ))}
        </group>,
      )}
      {active(
        "cpu",
        <Box
          position={[-0.23, 0.48, -0.28]}
          size={[0.31, 0.31, 0.06]}
          color="#c6ccd0"
          roughness={0.2}
        />,
      )}
      {active(
        "ram",
        <group>
          {[0.21, 0.34].map((x, i) => (
            <group key={x}>
              <Box
                position={[x, 0.55, -0.17]}
                size={[0.055, 0.62, 0.3]}
                color="#3b4147"
              />
              <mesh position={[x, 0.88, -0.17]}>
                <boxGeometry args={[0.057, 0.025, 0.3]} />
                <meshStandardMaterial
                  color={i ? "#a78bfa" : "#4be9be"}
                  emissive={powered ? (i ? "#a78bfa" : "#4be9be") : "#000"}
                  emissiveIntensity={1.5}
                />
              </mesh>
            </group>
          ))}
        </group>,
      )}
      {active(
        "gpu",
        <group>
          <Box
            position={[-0.16, -0.26, 0.04]}
            size={[1.24, 0.27, 0.65]}
            color="#2c3540"
          />
          <Box
            position={[-0.16, -0.1, 0.04]}
            size={[1.25, 0.025, 0.67]}
            color="#67737b"
          />
          {[-0.48, 0.15].map((x) => (
            <Fan
              key={x}
              position={[x, -0.28, 0.395]}
              powered={powered}
              animate={!reduceMotion}
              color="#a596ff"
            />
          ))}
          <Box
            position={[0.48, -0.25, 0.22]}
            size={[0.07, 0.15, 0.2]}
            color="#b8a66c"
          />
        </group>,
      )}
      {active(
        "ssd",
        <group>
          <Box
            position={[0.25, -0.58, -0.37]}
            size={[0.43, 0.14, 0.04]}
            color="#151e24"
          />
          <Box
            position={[0.25, -0.58, -0.34]}
            size={[0.29, 0.09, 0.015]}
            color="#acb8bb"
          />
        </group>,
      )}
      {active(
        "psu",
        <group>
          <Box
            position={[-0.31, -1.25, -0.03]}
            size={[0.83, 0.36, 0.85]}
            color="#10171e"
          />
          <Box
            position={[-0.31, -1.25, 0.41]}
            size={[0.5, 0.18, 0.015]}
            color="#566474"
          />
        </group>,
      )}
      {active(
        "cooler",
        <group>
          <Box
            position={[-0.23, 0.49, -0.05]}
            size={[0.48, 0.59, 0.4]}
            color="#9ba5ab"
          />
          {Array.from({ length: 12 }, (_, i) => (
            <Box
              key={i}
              position={[-0.23, 0.23 + i * 0.045, 0.17]}
              size={[0.48, 0.014, 0.08]}
              color="#c5cbd0"
            />
          ))}
          <Fan
            position={[-0.23, 0.49, 0.23]}
            powered={powered}
            animate={!reduceMotion}
          />
        </group>,
      )}
    </group>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? (
      <div className="rf-scene-fallback flex h-full items-center justify-center flex-col text-[11px] text-center p-6.25 gap-3.75">
        Cảnh 3D không khả dụng. Chuyển sang 2D để tiếp tục.
      </div>
    ) : (
      this.props.children
    );
  }
}
// Reset controls thay vì đổi key Canvas: không cấp lại WebGL context khi đổi góc nhìn.
function SceneControls({ resetVersion }: { resetVersion: number }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  useEffect(() => {
    controls.current?.reset();
  }, [resetVersion]);
  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      minDistance={3.8}
      maxDistance={9}
      maxPolarAngle={Math.PI * 0.6}
      target={[0, 0, 0]}
    />
  );
}

export default function PcScene({
  onError,
  cameraReset,
  ...props
}: {
  build: Build;
  exploded: boolean;
  powered: boolean;
  panelOpen: boolean;
  reduceMotion: boolean;
  onError: () => void;
  cameraReset: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // Gắn trước paint của canvas, không chờ cây scene bất đồng bộ hoàn tất.
  // Mất context ngay lúc mở 3D cũng phải về 2D, giữ nguyên editor.
  useLayoutEffect(() => {
    const element = canvas.current;
    const handleLoss = (event: Event) => {
      event.preventDefault();
      onError();
    };
    element?.addEventListener("webglcontextlost", handleLoss);
    return () => element?.removeEventListener("webglcontextlost", handleLoss);
  }, [onError]);
  return (
    <SceneBoundary onError={onError}>
      <Canvas
        ref={canvas}
        frameloop="demand"
        shadows="percentage"
        camera={{ position: [4, 2.1, 5], fov: 39 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.4} />
        <hemisphereLight args={["#d6e5ff", "#15221d", 2]} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={3}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-2, 1, 2]} color="#55eec0" intensity={6} />
        <pointLight position={[2, 0, -2]} color="#a890ff" intensity={5} />
        <Suspense fallback={null}>
          <Machine {...props} />
        </Suspense>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.6, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.25} />
        </mesh>
        <SceneControls resetVersion={cameraReset} />
      </Canvas>
    </SceneBoundary>
  );
}
