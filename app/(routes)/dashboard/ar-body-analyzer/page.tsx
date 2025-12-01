// app/(routes)/dashboard/ar-body-analyzer/page.tsx
"use client"
import React, { useState, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, Heart, Activity, AlertCircle, Search, X,
  Microscope, Download, RotateCcw, Layers,
  Thermometer, Shield
} from 'lucide-react'

interface BodyPartData {
  name: string
  position: number[]
  size: number[]
  color: string
  systems: string[]
  layers?: {
    [key: string]: { color: string; visible: boolean }
  }
  commonIssues: string[]
  vitalSigns?: {
    [key: string]: { normal: string; current: string | null }
  }
  biology?: {
    description: string
    facts: string[]
    chemicalProcesses?: string[]
  }
}

// Body parts data with proper typing
const bodyPartsData: Record<string, BodyPartData> = {
  head: {
    name: "Head & Brain",
    position: [0, 1.6, 0],
    size: [0.4, 0.45, 0.4],
    color: "#FFB6C1",
    systems: ["Nervous", "Sensory", "Endocrine"],
    layers: {
      skeletal: { color: "#F5F5DC", visible: true },
      muscular: { color: "#FF6B6B", visible: false },
      nervous: { color: "#FFD700", visible: false },
      vascular: { color: "#DC143C", visible: false }
    },
    commonIssues: ["Headaches", "Migraines", "Concussion", "Stroke"],
    vitalSigns: {
      temperature: { normal: "36-37°C", current: null },
      pressure: { normal: "10-20 mmHg (ICP)", current: null }
    },
    biology: {
      description: "The command center of the body, processing 70,000 thoughts daily.",
      facts: [
        "Contains ~86 billion neurons",
        "Uses 20% of body's oxygen",
        "Generates 12-25 watts of electricity"
      ]
    }
  },
  chest: {
    name: "Chest & Thorax",
    position: [0, 0.6, 0],
    size: [0.6, 0.7, 0.35],
    color: "#FF6B6B",
    systems: ["Cardiovascular", "Respiratory", "Immune"],
    layers: {
      skeletal: { color: "#F5F5DC", visible: true },
      muscular: { color: "#FF6B6B", visible: false },
      cardiovascular: { color: "#DC143C", visible: false },
      respiratory: { color: "#87CEEB", visible: false }
    },
    commonIssues: ["Angina", "Heart Attack", "Arrhythmia", "Pneumonia"],
    vitalSigns: {
      heartRate: { normal: "60-100 bpm", current: null },
      bloodPressure: { normal: "120/80 mmHg", current: null }
    },
    biology: {
      description: "Houses the cardiopulmonary system.",
      facts: [
        "Heart beats ~100,000 times daily",
        "Lungs contain ~300 million alveoli",
        "Processes 2,000 gallons of blood daily"
      ]
    }
  },
  abdomen: {
    name: "Abdomen & Core",
    position: [0, -0.2, 0],
    size: [0.55, 0.6, 0.32],
    color: "#98D8C8",
    systems: ["Digestive", "Urinary", "Endocrine"],
    layers: {
      skeletal: { color: "#F5F5DC", visible: true },
      muscular: { color: "#FF6B6B", visible: false },
      digestive: { color: "#98D8C8", visible: false }
    },
    commonIssues: ["Appendicitis", "IBS", "GERD", "Gallstones"],
    biology: {
      description: "The metabolic powerhouse.",
      facts: [
        "Stomach pH ranges from 1.5-3.5",
        "Small intestine is ~22 feet long",
        "Liver performs 500+ functions"
      ]
    }
  },
  leftArm: {
    name: "Left Arm",
    position: [-0.75, 0.4, 0],
    size: [0.18, 0.9, 0.18],
    color: "#FFE4B5",
    systems: ["Musculoskeletal", "Nervous", "Vascular"],
    commonIssues: ["Referred cardiac pain", "Nerve compression", "Tendinitis"]
  },
  rightArm: {
    name: "Right Arm",
    position: [0.75, 0.4, 0],
    size: [0.18, 0.9, 0.18],
    color: "#FFE4B5",
    systems: ["Musculoskeletal", "Nervous", "Vascular"],
    commonIssues: ["Carpal tunnel", "Tennis elbow", "Rotator cuff injury"]
  },
  leftLeg: {
    name: "Left Leg",
    position: [-0.3, -1.3, 0],
    size: [0.2, 1.1, 0.2],
    color: "#D4A76A",
    systems: ["Musculoskeletal", "Vascular", "Nervous"],
    commonIssues: ["DVT", "Sciatica", "Claudication"]
  },
  rightLeg: {
    name: "Right Leg",
    position: [0.3, -1.3, 0],
    size: [0.2, 1.1, 0.2],
    color: "#D4A76A",
    systems: ["Musculoskeletal", "Vascular", "Nervous"],
    commonIssues: ["ACL tear", "Meniscus injury", "Varicose veins"]
  }
}

// 3D Body Part Component
function BodyPart({ part, partKey, isSelected, onClick, isHovered, onHover, activeLayer, pulseIntensity }: any) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [pulse, setPulse] = useState(0)
  
  useFrame((state) => {
    if (meshRef.current) {
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02
      meshRef.current.scale.x = breathingScale
      meshRef.current.scale.y = breathingScale
      
      if (isSelected) {
        setPulse(Math.sin(state.clock.elapsedTime * 4) * 0.5 + 0.5)
      }
      
      if (isHovered) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.05
      } else {
        meshRef.current.rotation.y *= 0.95
      }
    }
  })

  const getColor = () => {
    if (activeLayer && part.layers?.[activeLayer]) {
      return part.layers[activeLayer].color
    }
    return isSelected ? "#4F46E5" : isHovered ? "#6366F1" : part.color
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        position={part.position as any}
        onClick={onClick}
        onPointerEnter={() => onHover(partKey)}
        onPointerLeave={() => onHover(null)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={part.size as any} />
        <meshStandardMaterial 
          color={getColor()}
          emissive={isSelected ? "#4F46E5" : isHovered ? "#6366F1" : "#000000"}
          emissiveIntensity={isSelected ? pulse * 0.5 : isHovered ? 0.2 : 0}
          transparent
          opacity={isHovered ? 0.9 : 1}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {(isHovered || isSelected) && (
        <Html distanceFactor={10} position={[part.position[0], part.position[1] + part.size[1]/2 + 0.2, part.position[2]]}>
          <div className="bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-xl border border-blue-200">
            <div className="font-semibold text-sm">{part.name}</div>
            <div className="text-xs text-gray-600">Click for details</div>
            {isSelected && (
              <div className="text-xs text-blue-600 font-medium mt-1">✓ Selected</div>
            )}
          </div>
        </Html>
      )}
      
      {isSelected && pulseIntensity > 0 && (
        <Html distanceFactor={10} position={[part.position[0], part.position[1], part.position[2] + 0.3]}>
          <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
            <Thermometer className="w-3 h-3" />
            Pain: {pulseIntensity}/10
          </div>
        </Html>
      )}
    </group>
  )
}

// 3D Scene
function Enhanced3DBody({ selectedParts, onPartClick, hoveredPart, onHover, activeLayer, painLevels }: any) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[2, 1, 5]} fov={45} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.3} />
      
      <OrbitControls 
        enablePan={true} 
        maxDistance={10} 
        minDistance={2}
        enableDamping
        dampingFactor={0.05}
      />
      
      <Environment preset="studio" />
      
      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.5}
        scale={10}
        blur={1}
        far={10}
      />
      
      {Object.entries(bodyPartsData).map(([key, part]) => (
        <BodyPart
          key={key}
          part={part}
          partKey={key}
          isSelected={selectedParts.includes(key)}
          isHovered={hoveredPart === key}
          onClick={() => onPartClick(key)}
          onHover={onHover}
          activeLayer={activeLayer}
          pulseIntensity={painLevels[key] || 0}
        />
      ))}
      
      <gridHelper args={[10, 10]} position={[0, -2, 0]} />
    </>
  )
}

// AI Analysis
const analyzeSymptomsWithAI = async (
  selectedParts: string[],
  symptoms: string,
  severity: string,
  painLevels: Record<string, number>,
  duration: string
) => {
  try {
    const response = await fetch('/api/analyze-body', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedParts: selectedParts.map(part => bodyPartsData[part]?.name || part),
        symptoms,
        severity,
        painLevels,
        duration
      })
    })
    
    if (!response.ok) throw new Error('Analysis failed')
    
    const data = await response.json()
    return data.analysis || data
  } catch (error) {
    console.error('AI analysis error:', error)
    return {
      possibleConditions: [],
      recommendations: ["Unable to complete analysis. Please try again."]
    }
  }
}

export default function UltimateARBodyAnalyzer() {
  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [symptoms, setSymptoms] = useState("")
  const [severity, setSeverity] = useState("moderate")
  const [duration, setDuration] = useState("")
  const [painLevels, setPainLevels] = useState<Record<string, number>>({})
  const [analysis, setAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("selection")
  const [hoveredPart, setHoveredPart] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<string>("")
  const [viewMode, setViewMode] = useState<"3d" | "anatomy" | "systems">("3d")

  const handlePartClick = (part: string) => {
    setSelectedParts(prev => {
      const isSelected = prev.includes(part)
      if (isSelected) {
        const newPainLevels = { ...painLevels }
        delete newPainLevels[part]
        setPainLevels(newPainLevels)
        return prev.filter(p => p !== part)
      } else {
        setPainLevels(prev => ({ ...prev, [part]: 5 }))
        return [...prev, part]
      }
    })
  }

  const updatePainLevel = (part: string, level: number) => {
    setPainLevels(prev => ({ ...prev, [part]: level }))
  }

  const clearAllSelections = () => {
    setSelectedParts([])
    setPainLevels({})
    setSymptoms("")
    setAnalysis(null)
  }

  const analyzeSymptoms = async () => {
    if (selectedParts.length === 0 && !symptoms.trim()) {
      alert("Please select body parts or describe your symptoms")
      return
    }
    
    setIsAnalyzing(true)
    setActiveTab("results")
    
    try {
      const result = await analyzeSymptomsWithAI(
        selectedParts,
        symptoms,
        severity,
        painLevels,
        duration
      )
      setAnalysis(result)
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      selectedBodyParts: selectedParts.map(part => ({
        name: bodyPartsData[part].name,
        painLevel: painLevels[part] || 0
      })),
      symptoms,
      severity,
      duration,
      analysis
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bathusi-ai-analysis-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Bathusi-AI 3D Body Analyzer
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Interactive anatomical visualization with AI-powered health insights
          </p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 3D Model Section */}
          <div className="xl:col-span-2">
            <Card className="overflow-hidden shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Interactive 3D Model
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={viewMode === "3d" ? "secondary" : "ghost"}
                      onClick={() => setViewMode("3d")}
                      className="text-white"
                    >
                      3D View
                    </Button>
                    <Button 
                      size="sm"
                      variant={viewMode === "anatomy" ? "secondary" : "ghost"} 
                      onClick={() => setViewMode("anatomy")}
                      className="text-white"
                    >
                      Anatomy
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={clearAllSelections}
                      className="text-white"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {viewMode === "anatomy" && (
                  <div className="p-4 bg-gray-50 border-b flex gap-2">
                    <Button
                      size="sm"
                      variant={activeLayer === "" ? "default" : "outline"}
                      onClick={() => setActiveLayer("")}
                    >
                      Normal
                    </Button>
                    <Button
                      size="sm"
                      variant={activeLayer === "skeletal" ? "default" : "outline"}
                      onClick={() => setActiveLayer("skeletal")}
                    >
                      Skeletal
                    </Button>
                    <Button
                      size="sm"
                      variant={activeLayer === "muscular" ? "default" : "outline"}
                      onClick={() => setActiveLayer("muscular")}
                    >
                      Muscular
                    </Button>
                  </div>
                )}
                
                <div className="h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 relative">
                  <Canvas shadows>
                    <Suspense fallback={null}>
                      <Enhanced3DBody 
                        selectedParts={selectedParts} 
                        onPartClick={handlePartClick}
                        hoveredPart={hoveredPart}
                        onHover={setHoveredPart}
                        activeLayer={activeLayer}
                        painLevels={painLevels}
                      />
                    </Suspense>
                  </Canvas>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                    <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                      🖱️ Drag to rotate • Scroll to zoom • Click to select
                    </div>
                    <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                      Selected: {selectedParts.length} parts
                    </div>
                  </div>
                </div>
                
                {selectedParts.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                    <h3 className="font-semibold mb-3">Selected Areas & Pain Intensity</h3>
                    <div className="space-y-3">
                      {selectedParts.map(part => {
                        const partInfo = bodyPartsData[part]
                        return (
                          <div key={part} className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: partInfo.color }}></div>
                                <span className="font-medium">{partInfo.name}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePartClick(part)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">Pain Level:</span>
                              <Slider
                                value={[painLevels[part] || 5]}
                                onValueChange={(value) => updatePainLevel(part, value[0])}
                                min={0}
                                max={10}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-sm font-medium w-8">{painLevels[part] || 5}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Analysis Panel */}
          <div className="xl:col-span-1">
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle>AI Health Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full rounded-none">
                    <TabsTrigger value="selection" className="flex-1">
                      <Search className="w-4 h-4 mr-1" />
                      Symptoms
                    </TabsTrigger>
                    <TabsTrigger value="biology" className="flex-1">
                      <Microscope className="w-4 h-4 mr-1" />
                      Biology
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex-1">
                      <Activity className="w-4 h-4 mr-1" />
                      Results
                    </TabsTrigger>
                  </TabsList>
                  
                  <ScrollArea className="h-[500px]">
                    <TabsContent value="selection" className="p-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Describe Symptoms</label>
                        <Textarea
                          placeholder="Describe what you're experiencing..."
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Severity</label>
                          <select 
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                          >
                            <option value="mild">Mild</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                            <option value="emergency">Emergency</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Duration</label>
                          <Input
                            placeholder="e.g., 2 days"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={analyzeSymptoms}
                        disabled={isAnalyzing || (selectedParts.length === 0 && !symptoms.trim())}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                      >
                        {isAnalyzing ? (
                          <>
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Analyze with AI
                          </>
                        )}
                      </Button>
                      
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Your data is processed securely. This is for educational purposes only.
                        </AlertDescription>
                      </Alert>
                    </TabsContent>
                    
                    <TabsContent value="biology" className="p-4">
                      {selectedParts.length > 0 ? (
                        <div className="space-y-4">
                          {selectedParts.map(part => {
                            const partInfo = bodyPartsData[part]
                            return (
                              <Card key={part} className="border-l-4 border-blue-500">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">{partInfo.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                  {partInfo.biology ? (
                                    <>
                                      <p className="text-gray-600">{partInfo.biology.description}</p>
                                      {partInfo.biology.facts && (
                                        <div>
                                          <h5 className="font-semibold mb-1">Key Facts:</h5>
                                          <ul className="list-disc list-inside text-gray-600 space-y-1">
                                            {partInfo.biology.facts.slice(0, 3).map((fact, i) => (
                                              <li key={i} className="text-xs">{fact}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-gray-600">
                                      {partInfo.name} - Part of the {partInfo.systems.join(", ")} system(s)
                                    </p>
                                  )}
                                  
                                  {partInfo.vitalSigns && (
                                    <div>
                                      <h5 className="font-semibold mb-1">Vital Signs:</h5>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        {Object.entries(partInfo.vitalSigns).map(([key, value]) => (
                                          <div key={key} className="bg-gray-50 p-2 rounded">
                                            <div className="text-gray-500 capitalize">{key}:</div>
                                            <div className="font-medium">{value.normal}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Brain className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600">Select body parts to view biological information</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="results" className="p-4">
                      {analysis ? (
                        <div className="space-y-4">
                          {analysis.possibleConditions?.map((condition: any, i: number) => (
                            <Card key={i} className="border-l-4 border-purple-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">{condition.name}</CardTitle>
                                  <Badge variant={
                                    condition.urgency === 'high' ? 'destructive' :
                                    condition.urgency === 'medium' ? 'default' : 'secondary'
                                  }>
                                    {condition.probability}%
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="text-sm">
                                <p className="text-gray-600 mb-2">{condition.description}</p>
                                {condition.details && condition.details.length > 0 && (
                                  <ul className="text-xs text-gray-500 space-y-1">
                                    {condition.details.slice(0, 3).map((detail: string, j: number) => (
                                      <li key={j}>• {detail}</li>
                                    ))}
                                  </ul>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                          
                          {analysis.recommendations && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Recommendations</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm space-y-2">
                                  {analysis.recommendations.map((rec: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                          
                          <Button onClick={generateReport} className="w-full" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                          </Button>
                          
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              This is educational content only. Always consult healthcare professionals.
                            </AlertDescription>
                          </Alert>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600">
                            {isAnalyzing ? 'Analyzing...' : 'Complete symptom selection to see results'}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card className="mt-4 shadow-lg">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-600">{selectedParts.length}</div>
                    <div className="text-xs text-gray-600">Selected</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedParts.length > 0 
                        ? Math.round(Object.values(painLevels).reduce((a, b) => a + b, 0) / selectedParts.length)
                        : 0}
                    </div>
                    <div className="text-xs text-gray-600">Avg Pain</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis?.possibleConditions?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600">Conditions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}