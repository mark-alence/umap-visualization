/**
 * 3D Point Cloud visualization using React Three Fiber
 */
import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CLUSTER_COLORS } from '../utils/dataGenerators';

function Points({ data, labels, colors = CLUSTER_COLORS, pointSize = 0.08, autoRotate = true }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(null);

  // Create geometry and colors
  const { positions, colorArray } = useMemo(() => {
    const positions = new Float32Array(data.length * 3);
    const colorArray = new Float32Array(data.length * 3);

    for (let i = 0; i < data.length; i++) {
      positions[i * 3] = data[i][0];
      positions[i * 3 + 1] = data[i][1];
      positions[i * 3 + 2] = data[i][2];

      const label = labels ? labels[i] : 0;
      const color = new THREE.Color(colors[label % colors.length]);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    return { positions, colorArray };
  }, [data, labels, colors]);

  // Gentle rotation
  useFrame((state) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={data.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={data.length}
          array={colorArray}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={pointSize}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

function Axes({ size = 3 }) {
  return (
    <group>
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), size, 0x3b82f6]} />
      <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), size, 0x22c55e]} />
      <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), size, 0xef4444]} />
    </group>
  );
}

export function PointCloud3D({
  data,
  labels = null,
  width = 400,
  height = 400,
  colors = CLUSTER_COLORS,
  pointSize = 0.08,
  showAxes = true,
  autoRotate = true,
  className = '',
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-900/50 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <span className="text-slate-400">No data</span>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 rounded-lg overflow-hidden ${className}`} style={{ width, height }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[6, 4, 6]} fov={50} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <Points
          data={data}
          labels={labels}
          colors={colors}
          pointSize={pointSize}
          autoRotate={autoRotate}
        />

        {showAxes && <Axes />}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
        />

        {/* Grid helper */}
        <gridHelper args={[10, 10, '#1e293b', '#0f172a']} rotation={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}

export default PointCloud3D;
