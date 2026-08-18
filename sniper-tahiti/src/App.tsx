import { Canvas } from '@react-three/fiber'
import { Sky, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useState, useRef, useEffect } from 'react'
import * as THREE from 'three'

// Tropical palm tree component
interface PalmTreeProps {
  position: [number, number, number]
  scale?: number
}

function PalmTree({ position, scale = 1 }: PalmTreeProps) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 5, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* Leaves */}
      {[...Array(8)].map((_, i) => (
        <mesh
          key={i}
          position={[Math.sin(i * Math.PI / 4) * 0.3, 5, Math.cos(i * Math.PI / 4) * 0.3]}
          rotation={[0.5, i * Math.PI / 4, 0]}
        >
          <boxGeometry args={[0.1, 2, 0.3]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
      ))}
    </group>
  )
}

// Target stand with paper target
interface TargetProps {
  position: [number, number, number]
  isHit: boolean
}

function Target({ position, isHit }: TargetProps) {
  return (
    <group position={position}>
      {/* Stand base */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 1, 0.1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      {/* Target paper */}
      <mesh position={[0, 1.2, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial 
          color={isHit ? "#ff0000" : "#ffffff"} 
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Bullseye rings */}
      {!isHit && (
        <>
          <mesh position={[0, 1.2, 0.01]}>
            <ringGeometry args={[0.25, 0.3, 32]} />
            <meshBasicMaterial color="#ff0000" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1.2, 0.01]}>
            <ringGeometry args={[0.15, 0.2, 32]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1.2, 0.01]}>
            <ringGeometry args={[0.05, 0.1, 32]} />
            <meshBasicMaterial color="#ff0000" side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  )
}

// Sniper rifle scope view overlay
function ScopeOverlay({ crosshairVisible }: { crosshairVisible: boolean }) {
  if (!crosshairVisible) return null
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10
    }}>
      {/* Circular scope view */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        border: '8px solid #1a1a1a',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden'
      }}>
        {/* Crosshair */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '2px',
          height: '100%',
          backgroundColor: '#000'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '2px',
          backgroundColor: '#000'
        }} />
        {/* Center dot */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: '#000'
        }} />
      </div>
    </div>
  )
}

// Main Sniper Scene
interface SniperSceneProps {
  scoped: boolean
  hitTargets: boolean[]
}

function SniperScene({ scoped, hitTargets }: SniperSceneProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([0, 1.6, 8])
  
  useEffect(() => {
    if (scoped) {
      setCameraPos([0, 1.6, 0.5])
    } else {
      setCameraPos([0, 1.6, 8])
    }
  }, [scoped])

  return (
    <>
      <PerspectiveCamera 
        ref={cameraRef}
        makeDefault 
        position={cameraPos as [number, number, number]}
        fov={scoped ? 30 : 75}
      />
      
      {/* Controls - disabled when scoped */}
      <OrbitControls 
        enabled={!scoped}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={15}
      />

      {/* Sky and Environment */}
      <Sky 
        sunPosition={[100, 50, 100]}
        turbidity={8}
        rayleigh={6}
        mieCoefficient={0.005}
        mieDirectionalG={0.7}
      />
      <Environment preset="sunset" />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[50, 50, 50]} 
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Ground - sandy beach */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#F4D03F" roughness={0.9} />
      </mesh>

      {/* Ocean in background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -30]}>
        <planeGeometry args={[200, 100]} />
        <meshStandardMaterial color="#0077BE" roughness={0.3} />
      </mesh>

      {/* Mountains in distance */}
      {[-30, -20, -10, 0, 10, 20, 30].map((x, i) => (
        <mesh 
          key={i} 
          position={[x, 5, -50]} 
          rotation={[0, 0, 0]}
        >
          <coneGeometry args={[8 + Math.random() * 5, 15 + Math.random() * 10, 4]} />
          <meshStandardMaterial color="#2E8B57" />
        </mesh>
      ))}

      {/* Palm trees around the range */}
      <PalmTree position={[-8, 0, -5]} scale={1.2} />
      <PalmTree position={[8, 0, -5]} scale={1.1} />
      <PalmTree position={[-10, 0, 5]} scale={0.9} />
      <PalmTree position={[10, 0, 5]} scale={1.0} />
      <PalmTree position={[-6, 0, -15]} scale={1.3} />
      <PalmTree position={[6, 0, -15]} scale={1.1} />

      {/* Shooting range barriers */}
      <mesh position={[-5, 0.75, -10]} castShadow>
        <boxGeometry args={[0.2, 1.5, 3]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[5, 0.75, -10]} castShadow>
        <boxGeometry args={[0.2, 1.5, 3]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 1.5, -10]} castShadow>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Targets */}
      <Target position={[-3, 0, -10]} isHit={hitTargets[0]} />
      <Target position={[0, 0, -10]} isHit={hitTargets[1]} />
      <Target position={[3, 0, -10]} isHit={hitTargets[2]} />

      {/* Sniper rifle model (simplified) */}
      {!scoped && (
        <group position={[0.5, 1.4, 7]}>
          {/* Rifle body */}
          <mesh rotation={[0, Math.PI, 0]} castShadow>
            <boxGeometry args={[0.08, 0.1, 0.6]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Barrel */}
          <mesh position={[0, 0.05, -0.4]} rotation={[0, Math.PI, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 16]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Scope */}
          <mesh position={[0, 0.12, -0.1]} rotation={[0, Math.PI, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.25, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Stock */}
          <mesh position={[0, 0, 0.35]} rotation={[0, Math.PI, 0]} castShadow>
            <boxGeometry args={[0.06, 0.08, 0.3]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
        </group>
      )}
    </>
  )
}

// Main App Component
function App() {
  const [scoped, setScoped] = useState(false)
  const [hitTargets, setHitTargets] = useState([false, false, false])
  const [score, setScore] = useState(0)

  const handleScopeToggle = () => {
    setScoped(!scoped)
  }

  const handleShoot = () => {
    // Simple hit detection based on camera direction
    // In a real game, you'd use raycasting
    const newHitTargets = [...hitTargets]
    const randomTarget = Math.floor(Math.random() * 3)
    if (!newHitTargets[randomTarget]) {
      newHitTargets[randomTarget] = true
      setHitTargets(newHitTargets)
      setScore(score + 100)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleShoot()
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        handleScopeToggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scoped, hitTargets, score])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        zIndex: 20,
        fontFamily: 'Arial, sans-serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>🏝️ Tahiti Sniper Range</h1>
        <p style={{ margin: '10px 0' }}>Score: {score}</p>
        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          <p>🎯 Hit targets to score points!</p>
          <p>🔍 Hold SHIFT or click to scope in/out</p>
          <p>💥 Press SPACE or click to shoot</p>
        </div>
      </div>

      {/* Shoot button for mobile/click */}
      <button
        onClick={handleShoot}
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          padding: '20px 40px',
          fontSize: '1.2rem',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          zIndex: 20,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold'
        }}
      >
        🔫 FIRE
      </button>

      {/* Scope toggle button */}
      <button
        onClick={handleScopeToggle}
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '30px',
          padding: '15px 30px',
          fontSize: '1rem',
          backgroundColor: scoped ? '#4CAF50' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          zIndex: 20,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold'
        }}
      >
        {scoped ? '👁️ Unscope' : '🔍 Scope In'}
      </button>

      {/* Scope overlay */}
      <ScopeOverlay crosshairVisible={scoped} />

      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 1.6, 8], fov: 75 }}>
        <Suspense fallback={null}>
          <SniperScene 
            scoped={scoped} 
            hitTargets={hitTargets}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App
