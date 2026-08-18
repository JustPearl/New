import { Canvas, useFrame } from '@react-three/fiber'
import { Sky, Environment, OrbitControls, PerspectiveCamera, Cloud } from '@react-three/drei'
import { Suspense, useState, useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'

// Rain particle system
function Rain() {
  const rainRef = useRef<THREE.Points>(null)
  const rainCount = 15000
  
  const rainGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(rainCount * 3)
    const velocities = new Float32Array(rainCount)
    
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100 // x
      positions[i * 3 + 1] = Math.random() * 50 // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100 // z
      velocities[i] = 0.5 + Math.random() * 0.5 // speed
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1))
    return geometry
  }, [])
  
  const rainMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: '#aaaaaa',
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
  }, [])
  
  useFrame((state, delta) => {
    if (!rainRef.current) return
    
    const positions = rainRef.current.geometry.attributes.position.array as Float32Array
    const velocities = rainRef.current.geometry.attributes.velocity.array as Float32Array
    
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3 + 1] -= velocities[i] * delta * 50 // Fall down
      
      // Reset raindrop when it hits the ground
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 50
        positions[i * 3] = (Math.random() - 0.5) * 100
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100
      }
      
      // Add some wind effect
      positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.01
    }
    
    rainRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return <points ref={rainRef} geometry={rainGeometry} material={rainMaterial} />
}

// Tropical palm tree component
interface PalmTreeProps {
  position: [number, number, number]
  scale?: number
}

// Wind animation for palm trees
function WindyPalmTree({ position, scale = 1 }: PalmTreeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const leavesRefs = useRef<(THREE.Mesh | null)[]>([])
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    // Gentle swaying motion
    const time = state.clock.elapsedTime
    const windStrength = 0.05
    
    groupRef.current.rotation.z = Math.sin(time * 2) * windStrength
    groupRef.current.rotation.x = Math.cos(time * 1.5) * windStrength * 0.5
    
    // Animate leaves
    leavesRefs.current.forEach((leaf, i) => {
      if (leaf) {
        leaf.rotation.z = Math.sin(time * 3 + i) * 0.1
        leaf.rotation.x = Math.cos(time * 2.5 + i * 0.5) * 0.05
      }
    })
  })
  
  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 5, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* Leaves */}
      {[...Array(8)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (leavesRefs.current[i] = el)}
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
  weather: 'sunny' | 'rainy' | 'cloudy'
}

function SniperScene({ scoped, hitTargets, weather }: SniperSceneProps) {
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

      {/* Sky and Environment - adjust based on weather */}
      <Sky 
        sunPosition={[100, 50, 100]}
        turbidity={weather === 'rainy' ? 15 : 8}
        rayleigh={weather === 'rainy' ? 3 : 6}
        mieCoefficient={weather === 'rainy' ? 0.01 : 0.005}
        mieDirectionalG={0.7}
      />
      <Environment preset={weather === 'rainy' ? 'night' : 'sunset'} />

      {/* Lighting - adjust for weather */}
      <ambientLight intensity={weather === 'rainy' ? 0.3 : 0.5} />
      <directionalLight 
        position={[50, 50, 50]} 
        intensity={weather === 'rainy' ? 0.8 : 1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Weather effects */}
      {weather === 'rainy' && <Rain />}
      
      {/* Clouds for cloudy/rainy weather */}
      {(weather === 'cloudy' || weather === 'rainy') && (
        <>
          <Cloud position={[-20, 15, -20]} speed={0.2} opacity={0.7} />
          <Cloud position={[0, 12, -30]} speed={0.3} opacity={0.8} />
          <Cloud position={[20, 18, -25]} speed={0.25} opacity={0.7} />
          <Cloud position={[-10, 10, -40]} speed={0.15} opacity={0.9} />
          <Cloud position={[15, 14, -35]} speed={0.2} opacity={0.85} />
        </>
      )}

      {/* Ground - sandy beach */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color={weather === 'rainy' ? '#C9B037' : '#F4D03F'} 
          roughness={weather === 'rainy' ? 0.95 : 0.9} 
        />
      </mesh>

      {/* Ocean in background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -30]}>
        <planeGeometry args={[200, 100]} />
        <meshStandardMaterial 
          color={weather === 'rainy' ? '#005580' : '#0077BE'} 
          roughness={0.3} 
        />
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

      {/* Palm trees around the range - use windy version for weather effects */}
      <WindyPalmTree position={[-8, 0, -5]} scale={1.2} />
      <WindyPalmTree position={[8, 0, -5]} scale={1.1} />
      <WindyPalmTree position={[-10, 0, 5]} scale={0.9} />
      <WindyPalmTree position={[10, 0, 5]} scale={1.0} />
      <WindyPalmTree position={[-6, 0, -15]} scale={1.3} />
      <WindyPalmTree position={[6, 0, -15]} scale={1.1} />

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
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'cloudy'>('sunny')

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

  const cycleWeather = () => {
    setWeather(prev => {
      if (prev === 'sunny') return 'cloudy'
      if (prev === 'cloudy') return 'rainy'
      return 'sunny'
    })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleShoot()
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        handleScopeToggle()
      }
      if (e.code === 'KeyW') {
        cycleWeather()
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
          <p>☀️ Press W to change weather (Sunny → Cloudy → Rainy)</p>
          <p style={{ marginTop: '8px', fontWeight: 'bold' }}>
            Current Weather: {weather === 'sunny' ? '☀️ Sunny' : weather === 'cloudy' ? '☁️ Cloudy' : '🌧️ Rainy'}
          </p>
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
            weather={weather}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App
