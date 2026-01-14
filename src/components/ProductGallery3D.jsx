// components/ProductGallery3D.jsx
import React, { useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Text, Box, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// Mock 3D product models - Replace with your actual product geometries
const ProductModel = ({ productType, scale = 1, position = [0, 0, 0] }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Define different product types with appropriate geometries
  const getProductGeometry = () => {
    switch(productType) {
         case 'motor-die':
        return (
          <group>
            {/* Main motor housing */}
            <Cylinder args={[1.5, 1.5, 2, 32]}>
              <meshStandardMaterial 
                color="#666666" 
                metalness={0.9} 
                roughness={0.1}
                emissive="#333333"
                emissiveIntensity={0.1}
              />
            </Cylinder>
            
            {/* Cooling fins */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              return (
                <Box 
                  key={`fin-${i}`}
                  args={[0.1, 2.2, 0.3]}
                  position={[
                    Math.cos(angle) * 1.6,
                    0,
                    Math.sin(angle) * 1.6
                  ]}
                  rotation={[0, -angle, 0]}
                >
                  <meshStandardMaterial 
                    color="#888888" 
                    metalness={0.8} 
                    roughness={0.3}
                  />
                </Box>
              );
            })}
            
            {/* Mounting flanges */}
            <Box args={[0.4, 0.15, 0.4]} position={[1.9, 0.8, 0]}>
              <meshStandardMaterial color="#777777" metalness={0.7} />
            </Box>
            <Box args={[0.4, 0.15, 0.4]} position={[-1.9, 0.8, 0]}>
              <meshStandardMaterial color="#777777" metalness={0.7} />
            </Box>
            <Box args={[0.4, 0.15, 0.4]} position={[0, 0.8, 1.9]}>
              <meshStandardMaterial color="#777777" metalness={0.7} />
            </Box>
            <Box args={[0.4, 0.15, 0.4]} position={[0, 0.8, -1.9]}>
              <meshStandardMaterial color="#777777" metalness={0.7} />
            </Box>
            
            {/* Stator slots */}
            <Cylinder args={[1.2, 1.2, 2.1, 32]}>
              <meshStandardMaterial 
                color="#333333" 
                metalness={0.9} 
                roughness={0.1}
                side={THREE.BackSide}
              />
            </Cylinder>
            
            {/* Connection ports */}
            <Box args={[0.8, 0.6, 0.4]} position={[0, 1.2, 1.8]}>
              <meshStandardMaterial color="#555555" metalness={0.8} />
            </Box>
            
            {/* End caps */}
            <Cylinder args={[1.55, 1.55, 0.2, 32]} position={[0, 1.1, 0]}>
              <meshStandardMaterial color="#777777" metalness={0.8} />
            </Cylinder>
            <Cylinder args={[1.55, 1.55, 0.2, 32]} position={[0, -1.1, 0]}>
              <meshStandardMaterial color="#777777" metalness={0.8} />
            </Cylinder>
          </group>
        );
         case 'manifold':
      return (
        <group>
          <Box args={[2, 0.5, 0.8]}>
            <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.3} />
          </Box>
          {/* Exhaust ports */}
          <Cylinder args={[0.15, 0.15, 0.6, 16]} position={[-0.8, 0, 0.3]}>
            <meshStandardMaterial color="#444444" metalness={0.8} />
          </Cylinder>
          <Cylinder args={[0.15, 0.15, 0.6, 16]} position={[-0.4, 0, 0.3]}>
            <meshStandardMaterial color="#444444" metalness={0.8} />
          </Cylinder>
          <Cylinder args={[0.15, 0.15, 0.6, 16]} position={[0, 0, 0.3]}>
            <meshStandardMaterial color="#444444" metalness={0.8} />
          </Cylinder>
          {/* Collector */}
          <Cylinder args={[0.25, 0.25, 1.5, 16]} position={[0.8, 0, -0.2]} rotation={[0, Math.PI/2, 0]}>
            <meshStandardMaterial color="#666666" metalness={0.8} />
          </Cylinder>
        </group>
      );
    
    case 'bearing-housing':
      return (
        <group>
          <Cylinder args={[1.2, 1.2, 1, 32]}>
            <meshStandardMaterial color="#777777" metalness={0.7} roughness={0.4} />
          </Cylinder>
          {/* Mounting flanges */}
          <Box args={[0.4, 0.1, 0.4]} position={[0.8, 0.5, 0]}>
            <meshStandardMaterial color="#777777" metalness={0.7} />
          </Box>
          <Box args={[0.4, 0.1, 0.4]} position={[-0.8, 0.5, 0]}>
            <meshStandardMaterial color="#777777" metalness={0.7} />
          </Box>
          <Box args={[0.4, 0.1, 0.4]} position={[0, 0.5, 0.8]}>
            <meshStandardMaterial color="#777777" metalness={0.7} />
          </Box>
          <Box args={[0.4, 0.1, 0.4]} position={[0, 0.5, -0.8]}>
            <meshStandardMaterial color="#777777" metalness={0.7} />
          </Box>
          {/* Bearing bore */}
          <Cylinder args={[0.6, 0.6, 1.2, 32]}>
            <meshStandardMaterial color="#999999" metalness={0.9} roughness={0.1} />
          </Cylinder>
        </group>
      );
    
    case 'impeller':
      return (
        <group>
          <Cylinder args={[0.3, 0.3, 0.5, 32]}>
            <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.2} />
          </Cylinder>
          {/* Impeller blades */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <Box 
                key={i}
                args={[0.1, 1.2, 0.05]}
                position={[Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8]}
                rotation={[0, -angle, Math.PI/6]}
              >
                <meshStandardMaterial color="#bbbbbb" metalness={0.8} />
              </Box>
            );
          })}
        </group>
      );
    
    case 'hydraulic-block':
      return (
        <group>
          <Box args={[1.5, 0.8, 1.2]}>
            <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
          </Box>
          {/* Port connections */}
          <Cylinder args={[0.12, 0.12, 0.4, 16]} position={[0.6, 0.4, 0.4]}>
            <meshStandardMaterial color="#555555" metalness={0.9} />
          </Cylinder>
          <Cylinder args={[0.12, 0.12, 0.4, 16]} position={[0.6, 0.4, -0.4]}>
            <meshStandardMaterial color="#555555" metalness={0.9} />
          </Cylinder>
          <Cylinder args={[0.12, 0.12, 0.4, 16]} position={[-0.6, 0.4, 0.4]}>
            <meshStandardMaterial color="#555555" metalness={0.9} />
          </Cylinder>
          <Cylinder args={[0.12, 0.12, 0.4, 16]} position={[-0.6, 0.4, -0.4]}>
            <meshStandardMaterial color="#555555" metalness={0.9} />
          </Cylinder>
        </group>
      );
      case 'engine-block':
        return (
          <group>
            <Box args={[2, 1.5, 1.2]}>
              <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
            </Box>
            {/* Cylinder holes */}
            <Cylinder args={[0.2, 0.2, 1.6, 16]} position={[-0.6, 0, 0]}>
              <meshStandardMaterial color="#333333" metalness={0.8} />
            </Cylinder>
            <Cylinder args={[0.2, 0.2, 1.6, 16]} position={[0.6, 0, 0]}>
              <meshStandardMaterial color="#333333" metalness={0.8} />
            </Cylinder>
          </group>
        );
      
      case 'pump-housing':
        return (
          <group>
            <Cylinder args={[1, 0.8, 1.5, 32]}>
              <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.3} />
            </Cylinder>
            {/* Inlet/outlet ports */}
            <Cylinder args={[0.3, 0.3, 0.8, 16]} position={[0.8, 0, 0]} rotation={[0, 0, Math.PI/2]}>
              <meshStandardMaterial color="#777777" metalness={0.7} />
            </Cylinder>
            <Cylinder args={[0.3, 0.3, 0.8, 16]} position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI/2]}>
              <meshStandardMaterial color="#777777" metalness={0.7} />
            </Cylinder>
          </group>
        );
      
      case 'valve-body':
        return (
          <group>
            <Sphere args={[0.8, 32, 32]}>
              <meshStandardMaterial color="#666666" metalness={0.9} roughness={0.1} />
            </Sphere>
            <Cylinder args={[0.4, 0.3, 1.2, 16]} position={[0, 0.6, 0]}>
              <meshStandardMaterial color="#555555" metalness={0.8} />
            </Cylinder>
            <Cylinder args={[0.4, 0.3, 1.2, 16]} position={[0, -0.6, 0]}>
              <meshStandardMaterial color="#555555" metalness={0.8} />
            </Cylinder>
          </group>
        );
      
      case 'gear-housing':
        return (
          <Box args={[1.8, 0.8, 1.8]}>
            <meshStandardMaterial color="#999999" metalness={0.7} roughness={0.4} />
          </Box>
        );
      
      case 'bracket':
        return (
          <group>
            <Box args={[1, 0.2, 0.5]}>
              <meshStandardMaterial color="#777777" metalness={0.6} />
            </Box>
            {/* Mounting flanges */}
            <Box args={[0.3, 0.6, 0.3]} position={[-0.35, -0.2, 0]}>
              <meshStandardMaterial color="#777777" metalness={0.6} />
            </Box>
            <Box args={[0.3, 0.6, 0.3]} position={[0.35, -0.2, 0]}>
              <meshStandardMaterial color="#777777" metalness={0.6} />
            </Box>
          </group>
        );
      
      default:
        return (
          <Box args={[1, 1, 1]}>
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
          </Box>
        );
    }
  };

  return (
    <group ref={meshRef} scale={scale} position={position}>
      {getProductGeometry()}
    </group>
  );
};

// Loading fallback
const ModelLoader = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333333" wireframe />
    </mesh>
  );
};

// Main product gallery component
const ProductGallery3D = () => {
  const [selectedProduct, setSelectedProduct] = useState('engine-block');
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'gallery'
  
  const products = [
     {
      id: 'motor-die',
      name: 'Lost Cast Motor Die',
      material: 'High-Speed Steel',
      weight: '45 kg',
      dimensions: 'Ø350×250 mm',
      application: 'Electric Motor Manufacturing',
      category: 'industrial',
      description: 'Precision motor die for casting complex electric motor housings with integrated cooling fins and mounting features',
      specs: {
        tolerance: '±0.1 mm',
        finish: '0.8 μm Ra',
        process: 'Lost Foam Casting',
        pattern: 'White Pattern',
        maxTemp: '1600°C',
        lifeCycle: '50,000 shots',
        complexity: 'High',
        features: '12 cooling fins, 4 mounting points, stator slots'
      }
    },
     {
    id: 'manifold',
    name: 'Exhaust Manifold',
    material: 'Cast Steel',
    weight: '15 kg',
    dimensions: '600x300x200 mm',
    application: 'Automotive',
    description: 'High-temperature resistant exhaust manifold with smooth flow channels'
  },
  {
    id: 'bearing-housing',
    name: 'Bearing Housing',
    material: 'Ductile Iron',
    weight: '25 kg',
    dimensions: 'Ø400x350 mm',
    application: 'Heavy Machinery',
    description: 'Precision-machined bearing housing for industrial applications'
  },
  {
    id: 'impeller',
    name: 'Centrifugal Impeller',
    material: 'Stainless Steel',
    weight: '8 kg',
    dimensions: 'Ø300x150 mm',
    application: 'Pump Manufacturing',
    description: 'Balanced impeller with optimized blade geometry for maximum efficiency'
  },
  {
    id: 'hydraulic-block',
    name: 'Hydraulic Valve Block',
    material: 'Aluminum Alloy',
    weight: '12 kg',
    dimensions: '400x300x250 mm',
    application: 'Hydraulic Systems',
    description: 'Complex internal passages for hydraulic fluid control'
  },
    {
      id: 'engine-block',
      name: 'V6 Engine Block',
      material: 'Cast Iron',
      weight: '85 kg',
      dimensions: '650x450x320 mm',
      application: 'Automotive',
      description: 'Precision-cast engine block with integrated cooling channels'
    },
    {
      id: 'pump-housing',
      name: 'Centrifugal Pump Housing',
      material: 'Stainless Steel',
      weight: '32 kg',
      dimensions: 'Ø450x380 mm',
      application: 'Industrial',
      description: 'Corrosion-resistant pump housing for high-pressure applications'
    },
    {
      id: 'valve-body',
      name: 'Control Valve Body',
      material: 'Bronze Alloy',
      weight: '8.5 kg',
      dimensions: 'Ø300x400 mm',
      application: 'Oil & Gas',
      description: 'Pressure-tight valve body with precision-machined ports'
    },
    {
      id: 'gear-housing',
      name: 'Transmission Gear Housing',
      material: 'Aluminum Alloy',
      weight: '18 kg',
      dimensions: '450x250x300 mm',
      application: 'Automotive',
      description: 'Lightweight gear housing with excellent dimensional stability'
    },
    {
      id: 'bracket',
      name: 'Structural Support Bracket',
      material: 'Ductile Iron',
      weight: '12 kg',
      dimensions: '350x200x150 mm',
      application: 'Construction',
      description: 'High-strength bracket for structural applications'
    }
  ];

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-950 py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Our <span className="text-cyan-400">Cast Products</span>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Explore our precision-cast products with interactive 3D visualization
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Product List */}
          <div className="space-y-4">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-cyan-400">Product Catalog</h3>
              <div className="space-y-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product.id)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${selectedProduct === product.id 
                      ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-500/50' 
                      : 'bg-gray-900/50 border border-gray-700 hover:border-cyan-500/30 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">{product.name}</div>
                        <div className="text-sm text-gray-400">{product.material}</div>
                      </div>
                      <div className="text-xs px-2 py-1 bg-gray-700 rounded">
                        {product.application}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            {selectedProductData && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4">{selectedProductData.name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Material:</span>
                    <span className="font-medium">{selectedProductData.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Weight:</span>
                    <span className="font-medium">{selectedProductData.weight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dimensions:</span>
                    <span className="font-medium">{selectedProductData.dimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Application:</span>
                    <span className="font-medium">{selectedProductData.application}</span>
                  </div>
                </div>
                <p className="mt-4 text-gray-300 text-sm">{selectedProductData.description}</p>
                
                <div className="mt-6 flex space-x-3">
                  <button className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 py-2 rounded-lg font-medium transition-all">
                    Request Quote
                  </button>
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-medium transition-all">
                    Download Specs
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - 3D Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-700 h-[500px] relative">
              <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight 
                  position={[10, 10, 5]} 
                  intensity={1} 
                  castShadow 
                  shadow-mapSize-width={1024}
                  shadow-mapSize-height={1024}
                />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ffff" />
                
                <Suspense fallback={<ModelLoader />}>
                  <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                    <ProductModel productType={selectedProduct} scale={1.2} />
                  </Float>
                  <Environment preset="studio" />
                </Suspense>
                
                <OrbitControls 
                  enableZoom={true}
                  enablePan={true}
                  enableRotate={true}
                  minDistance={3}
                  maxDistance={20}
                  autoRotate
                  autoRotateSpeed={0.5}
                />
              </Canvas>
              
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-gray-600">
                <div className="text-sm text-gray-300">Interactive 3D Model</div>
                <div className="text-xs text-gray-400">Drag to rotate • Scroll to zoom</div>
              </div>
              
              <div className="absolute top-4 right-4 flex space-x-2">
                <button 
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1 rounded text-sm ${viewMode === 'single' ? 'bg-cyan-600' : 'bg-gray-800'}`}
                >
                  Single View
                </button>
                <button 
                  onClick={() => setViewMode('gallery')}
                  className={`px-3 py-1 rounded text-sm ${viewMode === 'gallery' ? 'bg-cyan-600' : 'bg-gray-800'}`}
                >
                  Gallery View
                </button>
              </div>
            </div>

            {/* Gallery View (when selected) */}
            {viewMode === 'gallery' && (
              <div className="mt-6">
                <h4 className="text-xl font-bold mb-4">All Products</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {products.map((product) => (
                    <div 
                      key={product.id}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-cyan-500 cursor-pointer relative group"
                      onClick={() => setSelectedProduct(product.id)}
                    >
                      <div className="w-full h-full bg-gray-900">
                        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
                          <ambientLight intensity={0.3} />
                          <pointLight position={[2, 2, 2]} />
                          <Suspense fallback={null}>
                            <ProductModel productType={product.id} scale={0.6} />
                          </Suspense>
                          <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} />
                        </Canvas>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-center text-xs group-hover:bg-cyan-900/80 transition-colors">
                        {product.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl p-6 border border-cyan-500/20">
            <h4 className="text-lg font-bold mb-3 flex items-center">
              <span className="text-cyan-400 mr-2">🎯</span>
              Precision Casting
            </h4>
            <p className="text-gray-300 text-sm">
              All products manufactured with ±0.5mm tolerance using our proprietary white pattern technology
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/20">
            <h4 className="text-lg font-bold mb-3 flex items-center">
              <span className="text-purple-400 mr-2">⚙️</span>
              Custom Solutions
            </h4>
            <p className="text-gray-300 text-sm">
              Need a custom casting? Our engineering team can develop prototypes in 2-4 weeks
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/20">
            <h4 className="text-lg font-bold mb-3 flex items-center">
              <span className="text-green-400 mr-2">📊</span>
              Quality Assurance
            </h4>
            <p className="text-gray-300 text-sm">
              Every product undergoes rigorous testing including X-ray inspection and dimensional verification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGallery3D;