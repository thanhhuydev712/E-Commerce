"use client";
import {
  Component,
  Suspense,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  Group,
  MathUtils,
  PerspectiveCamera,
  Vector3,
} from "three";
import type { Build, Slot } from "@/src/features/pc-builder/lib/compatibility";
type Vec = [number, number, number];
type CameraView = "perspective" | "front" | "side";
const cameraPositions: Record<CameraView, Vec> = {
  perspective: [2.5, 0.85, 6.8],
  front: [0, 0.12, 7],
  side: [7, 0.4, 0.1],
};

// The theme swatches are pastel. Saturated emitters keep their hue on an HDR-lit scene.
function ledColor(accent: string) {
  return (
    (
      {
        "#6ee7b7": "#10dba0",
        "#c4b5fd": "#9850f5",
        "#67e8f9": "#08bfeb",
      } as Record<string, string>
    )[accent] ?? accent
  );
}

function FanHalo({ color }: { color: string }) {
  const uniforms = useMemo(
    () => ({ tint: { value: new Color(color) } }),
    [color],
  );
  return (
    <mesh position={[0, 0, 0.085]}>
      <planeGeometry args={[0.72, 0.72]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
        vertexShader={`varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
        fragmentShader={`uniform vec3 tint; varying vec2 vUv;
          void main() {
            float radius = length(vUv - 0.5);
            float halo = exp(-pow((radius - 0.329) / 0.055, 2.0));
            gl_FragColor = vec4(tint, halo * 0.21);
            #include <colorspace_fragment>
          }`}
      />
    </mesh>
  );
}

function Led({
  position,
  size,
  powered,
  accent,
}: {
  position: Vec;
  size: Vec;
  powered: boolean;
  accent: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial
        color={powered ? ledColor(accent) : "#58656f"}
        toneMapped={false}
      />
    </mesh>
  );
}

function Screw({ position }: { position: Vec }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.019, 0.019, 0.012, 8]} />
        <meshStandardMaterial
          color="#99a3ab"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
      <Box
        position={[0, 0, 0.008]}
        size={[0.023, 0.004, 0.003]}
        color="#151b21"
      />
    </group>
  );
}

// Small, static tube geometries: no texture request or per-frame cable work.
function Cable({
  points,
  color = "#242d38",
  radius = 0.018,
}: {
  points: Vec[];
  color?: string;
  radius?: number;
}) {
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((point) => new Vector3(...point))),
    [points],
  );
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 28, radius, 6, false]} />
      <meshStandardMaterial color={color} roughness={0.75} metalness={0.15} />
    </mesh>
  );
}

function Box({
  position = [0, 0, 0],
  size,
  color = "#252e39",
  metal = 0.65,
  roughness = 0.35,
  radius = 0,
}: {
  position?: Vec;
  size: Vec;
  color?: string;
  metal?: number;
  roughness?: number;
  radius?: number;
}) {
  const material = (
    <meshStandardMaterial
      color={color}
      metalness={metal}
      roughness={roughness}
    />
  );
  if (radius > 0) {
    return (
      <RoundedBox
        position={position}
        args={size}
        radius={Math.min(radius, Math.min(...size) * 0.4)}
        smoothness={2}
        bevelSegments={1}
        castShadow
        receiveShadow
      >
        {material}
      </RoundedBox>
    );
  }
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      {material}
    </mesh>
  );
}
function Fan({
  position,
  powered,
  animate = true,
  color = "#42f4b8",
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: Vec;
  powered: boolean;
  animate?: boolean;
  color?: string;
  rotation?: Vec;
  scale?: number;
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
    <group position={position} rotation={rotation} scale={scale}>
      <Box
        size={[0.61, 0.61, 0.07]}
        color="#151c26"
        roughness={0.48}
        radius={0.025}
      />
      <mesh position={[0, 0, 0.042]}>
        <torusGeometry args={[0.253, 0.023, 8, 48]} />
        <meshStandardMaterial
          color="#46525d"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 0, 0.068]}>
        <torusGeometry args={[0.237, 0.011, 8, 48]} />
        <meshBasicMaterial
          color={powered ? ledColor(color) : "#465563"}
          toneMapped={false}
        />
      </mesh>
      {powered && <FanHalo color={ledColor(color)} />}
      <group ref={blades}>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 7]}>
            <mesh
              position={[0.075, 0.105, 0.055]}
              rotation={[0, 0, -0.65]}
              scale={[0.065, 0.14, 0.012]}
            >
              <sphereGeometry args={[1, 10, 6]} />
              <meshStandardMaterial
                color="#283441"
                metalness={0.45}
                roughness={0.5}
              />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.063, 0.063, 0.04, 20]} />
        <meshStandardMaterial
          color="#a5b5bf"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
      {[-0.26, 0.26].flatMap((x) =>
        [-0.26, 0.26].map((y) => (
          <Screw key={`${x}-${y}`} position={[x, y, 0.047]} />
        )),
      )}
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
    psu: [-1.1, -0.15, 1.1],
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
  accent,
}: {
  build: Build;
  exploded: boolean;
  powered: boolean;
  panelOpen: boolean;
  reduceMotion: boolean;
  accent: string;
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
            radius={0.018}
          />
          <Box
            position={[0, 1.45, 0]}
            size={[1.7, 0.07, 1.2]}
            radius={0.018}
            color="#202934"
          />
          <Box
            position={[0, 0, -0.58]}
            size={[1.7, 2.9, 0.05]}
            color="#19232e"
            radius={0.012}
          />
          {[-0.82, 0.82].flatMap((x) =>
            [-0.55, 0.55].map((z) => (
              <Box
                key={`${x}${z}`}
                position={[x, 0, z]}
                size={[0.055, 2.9, 0.055]}
                color="#394550"
                radius={0.014}
              />
            )),
          )}
          {/* Open intake rails leave the fans visible through the chassis. */}
          {[-0.44, 0.44].map((z) => (
            <Box
              key={z}
              position={[0.87, 0, z]}
              size={[0.09, 2.86, 0.1]}
              color="#151d26"
              radius={0.02}
            />
          ))}
          {[-0.72, 0.05, 0.82].map((y) => (
            <Fan
              key={y}
              position={[0.85, y, 0]}
              rotation={[0, Math.PI / 2, 0]}
              scale={1.12}
              powered={powered}
              animate={!reduceMotion}
              color={accent}
            />
          ))}
          <Box
            position={[0, -1.05, 0]}
            size={[1.64, 0.05, 1.15]}
            color="#343e49"
            radius={0.012}
          />
          <Box
            position={[0, -1.27, 0.51]}
            size={[1.61, 0.36, 0.045]}
            color="#1c252f"
            radius={0.012}
          />
          <Led
            position={[0.18, -1.075, 0.56]}
            size={[1.06, 0.018, 0.018]}
            powered={powered}
            accent={accent}
          />
          {/* Cable grommets, roof vents, rear expansion covers and fasteners. */}
          {[0.72, 0.06, -0.62].map((y) => (
            <Box
              key={y}
              position={[0.57, y, -0.54]}
              size={[0.12, 0.28, 0.02]}
              color="#090f16"
              roughness={0.95}
            />
          ))}
          {Array.from({ length: 15 }, (_, i) => (
            <Box
              key={i}
              position={[-0.64 + i * 0.087, 1.492, -0.06]}
              size={[0.027, 0.005, 0.71]}
              color="#10161e"
            />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <group key={i}>
              <Box
                position={[-0.795, -0.14 - i * 0.12, -0.12]}
                size={[0.035, 0.08, 0.62]}
                color="#49535f"
              />
              <Box
                position={[-0.795, -0.14 - i * 0.12, 0.21]}
                size={[0.039, 0.04, 0.03]}
                color="#161e27"
              />
            </group>
          ))}
          {[-0.74, 0.74].flatMap((x) =>
            [-1.36, 1.36].map((y) => (
              <Screw key={`${x}-${y}`} position={[x, y, 0.593]} />
            )),
          )}
          <Box
            position={[0.55, 1.493, 0.35]}
            size={[0.15, 0.012, 0.055]}
            color="#101821"
          />
          <Led
            position={[0.74, 1.493, 0.35]}
            size={[0.045, 0.012, 0.045]}
            powered={powered}
            accent={accent}
          />
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
                color="#68879b"
                metalness={0.05}
                roughness={0.045}
                transparent
                opacity={0.15}
                clearcoat={1}
                reflectivity={0.7}
                envMapIntensity={0.65}
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
            color="#152b2c"
            metal={0.3}
            roughness={0.7}
          />
          {/* Printed traces are recessed visually behind the mounted hardware. */}
          {Array.from({ length: 7 }, (_, i) => (
            <group key={i}>
              <Box
                position={[-0.58 + i * 0.12, -0.31, -0.419]}
                size={[0.005, 0.62, 0.003]}
                color="#35615c"
                metal={0.5}
              />
              <Box
                position={[-0.35, -0.56 + i * 0.055, -0.419]}
                size={[0.74, 0.005, 0.003]}
                color="#35615c"
                metal={0.5}
              />
            </group>
          ))}
          <Box
            position={[-0.64, 0.44, -0.33]}
            size={[0.18, 0.78, 0.18]}
            color="#313d49"
          />
          <Box
            position={[-0.25, 0.94, -0.34]}
            size={[0.58, 0.15, 0.16]}
            color="#414b54"
          />
          {Array.from({ length: 6 }, (_, i) => (
            <Box
              key={i}
              position={[-0.71 + i * 0.026, 0.44, -0.23]}
              size={[0.01, 0.7, 0.035]}
              color="#78858c"
            />
          ))}
          {[-0.65, 0.35].flatMap((x) =>
            [-0.48, 0.91].map((y) => (
              <Screw key={`${x}-${y}`} position={[x, y, -0.405]} />
            )),
          )}
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
            color="#626e78"
          />
          <Box
            position={[-0.16, -0.25, -0.36]}
            size={[0.72, 0.09, 0.07]}
            color="#a2adb1"
          />
          <Box
            position={[-0.16, -0.245, -0.315]}
            size={[0.61, 0.024, 0.01]}
            color="#111820"
          />
          <Box
            position={[0.13, -0.03, -0.34]}
            size={[0.36, 0.25, 0.1]}
            color="#3e4953"
          />
          <Led
            position={[0.13, 0.085, -0.281]}
            size={[0.3, 0.012, 0.01]}
            powered={powered}
            accent={accent}
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
        <group>
          <Box
            position={[-0.23, 0.48, -0.3]}
            size={[0.32, 0.32, 0.025]}
            color="#274235"
          />
          <Box
            position={[-0.23, 0.48, -0.275]}
            size={[0.285, 0.285, 0.035]}
            color="#c6ccd0"
            roughness={0.23}
          />
          <Box
            position={[-0.23, 0.48, -0.255]}
            size={[0.16, 0.03, 0.002]}
            color="#9faab1"
          />
        </group>,
      )}
      {active(
        "ram",
        <group>
          {[0.21, 0.34].map((x) => (
            <group key={x}>
              <Box
                position={[x, 0.55, -0.17]}
                size={[0.055, 0.62, 0.3]}
                color="#3b454f"
              />
              <Led
                position={[x, 0.55, -0.008]}
                size={[0.057, 0.59, 0.02]}
                powered={powered}
                accent={accent}
              />
              {Array.from({ length: 5 }, (_, i) => (
                <Box
                  key={i}
                  position={[x + 0.031, 0.31 + i * 0.11, -0.16]}
                  size={[0.007, 0.045, 0.16]}
                  color="#171f29"
                />
              ))}
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
            color="#202a36"
            radius={0.035}
          />
          <Box
            position={[-0.16, -0.1, 0.04]}
            size={[1.25, 0.025, 0.67]}
            color="#465462"
            radius={0.008}
          />
          {Array.from({ length: 18 }, (_, i) => (
            <Box
              key={i}
              position={[-0.73 + i * 0.067, -0.25, 0.365]}
              size={[0.013, 0.16, 0.025]}
              color="#8a959a"
            />
          ))}
          <Box
            position={[-0.16, -0.255, 0.39]}
            size={[1.26, 0.035, 0.027]}
            color="#3d4857"
          />
          <Led
            position={[-0.16, -0.17, 0.386]}
            size={[1.17, 0.016, 0.014]}
            powered={powered}
            accent={accent}
          />
          <Box
            position={[-0.77, -0.25, 0.02]}
            size={[0.035, 0.36, 0.71]}
            color="#838d94"
          />
          {[-0.56, -0.16, 0.24].map((x) => (
            <Fan
              key={x}
              position={[x, -0.42, 0.04]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={0.59}
              powered={powered}
              animate={!reduceMotion}
              color={accent}
            />
          ))}
          <Box
            position={[0.48, -0.25, 0.22]}
            size={[0.07, 0.15, 0.2]}
            color="#161f29"
          />
          {build.psu &&
            Array.from({ length: 5 }, (_, i) => (
              <Cable
                key={i}
                points={[
                  [0.49 + i * 0.022, -0.2, 0.23],
                  [0.61 + i * 0.022, -0.3, 0.37],
                  [0.65 + i * 0.022, -0.69, 0.28],
                  [0.58 + i * 0.022, -0.91, -0.45],
                ]}
                color={i % 2 ? "#75818c" : "#283440"}
                radius={0.009}
              />
            ))}
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
            color="#586671"
          />
          {Array.from({ length: 7 }, (_, i) => (
            <Box
              key={i}
              position={[0.12 + i * 0.043, -0.58, -0.329]}
              size={[0.01, 0.09, 0.008]}
              color="#9ba6ab"
            />
          ))}
          <Screw position={[0.055, -0.58, -0.34]} />
        </group>,
      )}
      {active(
        "psu",
        <group>
          <Box
            position={[-0.31, -1.25, -0.03]}
            size={[0.83, 0.36, 0.85]}
            color="#10171e"
            radius={0.025}
          />
          <Box
            position={[-0.31, -1.25, 0.41]}
            size={[0.5, 0.18, 0.015]}
            color="#566474"
          />
          {Array.from({ length: 7 }, (_, i) => (
            <Box
              key={i}
              position={[-0.64 + i * 0.11, -1.25, 0.421]}
              size={[0.025, 0.24, 0.009]}
              color="#151e28"
            />
          ))}
          {build.mainboard &&
            Array.from({ length: 6 }, (_, i) => (
              <Cable
                key={i}
                points={[
                  [0.12 + i * 0.022, -1.16, -0.18],
                  [0.55 + i * 0.022, -0.83, -0.28],
                  [0.6 + i * 0.022, 0.37, -0.22],
                  [0.47, 0.43 + i * 0.025, -0.31],
                ]}
                radius={0.008}
                color={i % 2 ? "#667683" : "#1c2632"}
              />
            ))}
        </group>,
      )}
      {active(
        "cooler",
        <group>
          <Box
            position={[-0.23, 0.49, -0.05]}
            size={[0.48, 0.59, 0.4]}
            color="#37434f"
            radius={0.025}
          />
          {Array.from({ length: 12 }, (_, i) => (
            <Box
              key={i}
              position={[-0.23, 0.23 + i * 0.045, 0.17]}
              size={[0.48, 0.014, 0.08]}
              color="#b2bdc3"
            />
          ))}
          {[-0.38, -0.08].map((x) => (
            <Cable
              key={x}
              points={[
                [x, 0.2, -0.2],
                [x, 0.13, -0.07],
                [x, 0.24, 0.12],
                [x, 0.7, 0.12],
              ]}
              color="#a6a9a3"
              radius={0.018}
            />
          ))}
          <Fan
            position={[-0.23, 0.49, 0.23]}
            powered={powered}
            animate={!reduceMotion}
            color={accent}
          />
          <Led
            position={[-0.23, 0.8, -0.035]}
            size={[0.38, 0.009, 0.17]}
            powered={powered}
            accent={accent}
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
function Showroom({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, -1.65, 0]} receiveShadow>
        <cylinderGeometry args={[1.35, 1.39, 0.075, 72]} />
        <meshStandardMaterial color="#111a27" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, -1.699, 0]}>
        <cylinderGeometry args={[1.37, 1.37, 0.018, 72]} />
        <meshStandardMaterial color="#080e16" metalness={0.4} roughness={0.7} />
      </mesh>
      <mesh position={[0, -1.652, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.371, 0.004, 6, 72]} />
        <meshBasicMaterial
          color={ledColor(accent)}
          transparent
          opacity={0.3}
          toneMapped={false}
        />
      </mesh>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <Box
            key={`${x}-${z}`}
            position={[x * 0.98, -1.61, z * 0.88]}
            size={[0.11, 0.004, 0.022]}
            color="#3c4a5a"
          />
        )),
      )}
    </group>
  );
}

// A single local cube capture supplies softbox reflections, without an HDR fetch.
const StudioEnvironment = memo(function StudioEnvironment() {
  return (
    <Environment frames={1} resolution={256} environmentIntensity={0.8}>
      <color attach="background" args={["#273141"]} />
      <Lightformer
        form="rect"
        position={[-4, 2, 4]}
        scale={[3, 6]}
        color="#e5edff"
        intensity={2.8}
      />
      <Lightformer
        form="rect"
        position={[0, 5, 0]}
        scale={[6, 4]}
        intensity={3}
      />
      <Lightformer
        form="rect"
        position={[4, 1, -3]}
        scale={[2, 5]}
        color="#9cb5d7"
        intensity={2.4}
      />
      <Lightformer
        form="rect"
        position={[2, 1, 5]}
        scale={[0.8, 5]}
        intensity={2.2}
      />
    </Environment>
  );
});

function framingPoints(exploded: boolean) {
  const [min, max]: [Vec, Vec] = exploded
    ? [
        [-1.85, -1.65, -0.65],
        [1.6, 2.1, 2.65],
      ]
    : [
        [-0.92, -1.6, -0.65],
        [1.04, 1.53, 0.66],
      ];
  const machine = [min[0], max[0]].flatMap((x) =>
    [min[1], max[1]].flatMap((y) =>
      [min[2], max[2]].map((z) => new Vector3(x, y, z)),
    ),
  );
  const platform = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * Math.PI) / 8;
    return new Vector3(Math.cos(angle) * 1.4, -1.72, Math.sin(angle) * 1.4);
  });
  return [...machine, ...platform];
}

// Apply presets to the existing camera/controls without allocating a WebGL context.
function SceneControls({
  resetVersion,
  view,
  exploded,
}: {
  resetVersion: number;
  view: CameraView;
  exploded: boolean;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const { width, height } = useThree((state) => state.size);
  useEffect(() => {
    if (!controls.current || !(camera instanceof PerspectiveCamera)) return;
    const target = new Vector3(0, exploded ? 0.18 : -0.09, exploded ? 0.6 : 0);
    const direction = new Vector3(...cameraPositions[view]).normalize();
    const right = new Vector3().crossVectors(camera.up, direction).normalize();
    const up = new Vector3().crossVectors(direction, right).normalize();
    const tanHalfFov = Math.tan(MathUtils.degToRad(32) / 2);
    const aspect = width / Math.max(height, 1);
    // Fit projected corners, reserving breathing room even on narrow mobile canvases.
    const distance = Math.max(
      ...framingPoints(exploded).map((point) => {
        const local = point.sub(target);
        const depth = local.dot(direction);
        return (
          depth +
          Math.max(
            Math.abs(local.dot(up)) / (tanHalfFov * 0.83),
            Math.abs(local.dot(right)) /
              (tanHalfFov * Math.max(aspect, 0.35) * 0.83),
          )
        );
      }),
    );
    camera.position.copy(target).addScaledVector(direction, distance);
    controls.current.target.copy(target);
    controls.current.maxDistance = Math.max(12, distance * 1.8);
    controls.current.update();
    controls.current.saveState();
    invalidate();
  }, [camera, exploded, height, invalidate, resetVersion, view, width]);
  return (
    <OrbitControls
      ref={controls}
      enableDamping={false}
      enablePan={false}
      minDistance={3.8}
      maxDistance={20}
      maxPolarAngle={Math.PI * 0.6}
      target={[0, -0.09, 0]}
    />
  );
}

export default function PcScene({
  onError,
  cameraReset,
  accent = "#6ee7b7",
  cameraView = "perspective",
  ...props
}: {
  build: Build;
  exploded: boolean;
  powered: boolean;
  panelOpen: boolean;
  reduceMotion: boolean;
  onError: () => void;
  cameraReset: number;
  accent?: string;
  cameraView?: CameraView;
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
        camera={{ position: cameraPositions.perspective, fov: 32 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <hemisphereLight args={["#dceaff", "#16212f", 0.85]} />
        <directionalLight
          position={[3, 5, 4]}
          color="#e5efff"
          intensity={2.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-normalBias={0.025}
        />
        <directionalLight
          position={[-3, 2, 1]}
          color="#a8c8ed"
          intensity={1.25}
        />
        <directionalLight
          position={[1, 3, -3]}
          color="#d6ddeb"
          intensity={1.8}
        />
        <pointLight
          position={[-0.4, 0.6, 0.8]}
          color={ledColor(accent)}
          intensity={
            props.powered && Object.keys(props.build).length > 0 ? 1.4 : 0
          }
          distance={3}
          decay={2}
        />
        <Suspense fallback={null}>
          <StudioEnvironment />
          <Machine {...props} accent={accent} />
        </Suspense>
        <Showroom accent={accent} />
        <SceneControls
          resetVersion={cameraReset}
          view={cameraView}
          exploded={props.exploded}
        />
      </Canvas>
    </SceneBoundary>
  );
}
