// app/%28routes%29/dashboard/_components/EyeTrackingAnalyzer.tsx
"use client"
import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Camera, Brain, AlertTriangle, CheckCircle, Activity, Zap, VideoOff } from 'lucide-react'
import SaccadicTest from './SaccadicTest'
import { analyzeAlzheimersPatterns, CognitiveAssessment } from '@/app/utils/alzheimersPatterns';

interface Landmark {
  x: number
  y: number
  z: number
}

interface EyeMetrics {
  leftEyeOpenness: number;
  rightEyeOpenness: number;
  averageEAR: number;
  asymmetry: number;
  gazeStability: number;
  isBlink: boolean;
  movement: number;
  confidence: number;
  faceDetected: boolean;
  cognitiveScore: number;
  timestamp: string;
}

// Extend Window interface for MediaPipe
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

export default function EyeTrackingAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [metrics, setMetrics] = useState<EyeMetrics | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [faceMesh, setFaceMesh] = useState<any>(null)
  const [camera, setCamera] = useState<any>(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [testPhase, setTestPhase] = useState<'idle' | 'calibration' | 'saccadic-test' | 'analysis'>('idle')
  const [saccadicData, setSaccadicData] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [cognitiveAssessment, setCognitiveAssessment] = useState<CognitiveAssessment | null>(null);

  // MediaPipe eye landmarks indices
  const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
  const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]

  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        setIsModelLoading(true)
        setError(null)

        // Check if MediaPipe is already loaded
        if (window.FaceMesh) {
          console.log('✅ MediaPipe already loaded')
          createFaceMeshInstance()
          return
        }

        // Load MediaPipe from CDN
        console.log('🔄 Loading MediaPipe from CDN...')
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
        script.onload = () => {
          console.log('✅ MediaPipe FaceMesh loaded from CDN')
          createFaceMeshInstance()
        }
        script.onerror = () => {
          console.error('❌ Failed to load MediaPipe from CDN')
          setError('Failed to load AI model from CDN')
          setIsModelLoading(false)
        }
        document.head.appendChild(script)

      } catch (error) {
        console.error('❌ Error initializing MediaPipe:', error)
        setError('Failed to initialize AI model')
        setIsModelLoading(false)
      }
    }

    const createFaceMeshInstance = () => {
      try {
        // CORRECT: Use window.FaceMesh (loaded from CDN)
        const faceMeshInstance = new window.FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
          }
        })

        faceMeshInstance.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        faceMeshInstance.onResults(onFaceMeshResults)

        setFaceMesh(faceMeshInstance)
        setIsModelLoading(false)
        
        console.log('✅ FaceMesh instance created successfully')
      } catch (error) {
        console.error('❌ Error creating FaceMesh instance:', error)
        setError('Failed to create FaceMesh instance')
        setIsModelLoading(false)
      }
    }

    initializeMediaPipe()
  }, [])

  const onFaceMeshResults = (results: any) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0]
        const newMetrics = calculateEyeMetrics(landmarks)
        
        if (newMetrics) {
        setMetrics(newMetrics)
        
        // Add to history for pattern analysis
        const newHistory = [...history, { ...newMetrics, timestamp: Date.now() }].slice(-60); // Keep 60 data points
        setHistory(newHistory)
        
        // Run Alzheimer's analysis when we have enough data
        if (newHistory.length >= 30) { // After 30 data points
            const assessment = analyzeAlzheimersPatterns(newHistory, saccadicData)
            setCognitiveAssessment(assessment)
            
            // Update cognitive score with real analysis
            setMetrics(prev => prev ? {
            ...prev,
            cognitiveScore: assessment.biomarkers.overallCognitiveScore,
            confidence: assessment.confidence
            } : null)
        }
        }
    } else {
        setMetrics(prev => prev ? { 
        ...prev, 
        confidence: 0.3, 
        faceDetected: false 
        } : null)
    }
    }

  const calculateEyeMetrics = (landmarks: Landmark[]): EyeMetrics | null => {
    try {
      const leftEyeCoords = LEFT_EYE_INDICES.map(i => landmarks[i])
      const rightEyeCoords = RIGHT_EYE_INDICES.map(i => landmarks[i])
      
      const leftEAR = calculateEAR(leftEyeCoords)
      const rightEAR = calculateEAR(rightEyeCoords)
      const averageEAR = (leftEAR + rightEAR) / 2
      const asymmetry = Math.abs(leftEAR - rightEAR)
      
      const leftEyeCenter = calculateEyeCenter(leftEyeCoords)
      const rightEyeCenter = calculateEyeCenter(rightEyeCoords)
      
      let movement = 0
      if (history.length > 0) {
        const lastMetrics = history[history.length - 1]
        movement = calculateMovement(leftEyeCenter, rightEyeCenter, lastMetrics.eyeCenters)
      }
      
      const isBlink = averageEAR < 0.2
      const gazeStability = calculateGazeStability(landmarks)
      
      return {
        leftEyeOpenness: leftEAR,
        rightEyeOpenness: rightEAR,
        averageEAR,
        asymmetry,
        gazeStability,
        isBlink,
        movement,
        confidence: 0.85,
        faceDetected: true,
        cognitiveScore: calculateCognitiveScore(averageEAR, asymmetry, gazeStability, movement),
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error calculating metrics:', error)
      return null
    }
  }

  const calculateEAR = (eyeCoords: Landmark[]): number => {
    try {
      const vertical1 = Math.sqrt(
        Math.pow(eyeCoords[1].x - eyeCoords[5].x, 2) + 
        Math.pow(eyeCoords[1].y - eyeCoords[5].y, 2)
      )
      const vertical2 = Math.sqrt(
        Math.pow(eyeCoords[2].x - eyeCoords[4].x, 2) + 
        Math.pow(eyeCoords[2].y - eyeCoords[4].y, 2)
      )
      const horizontal = Math.sqrt(
        Math.pow(eyeCoords[0].x - eyeCoords[3].x, 2) + 
        Math.pow(eyeCoords[0].y - eyeCoords[3].y, 2)
      )
      
      return horizontal > 0 ? (vertical1 + vertical2) / (2 * horizontal) : 0.3
    } catch (error) {
      return 0.3
    }
  }

  const calculateEyeCenter = (eyeCoords: Landmark[]) => {
    const sum = eyeCoords.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 })
    
    return {
      x: sum.x / eyeCoords.length,
      y: sum.y / eyeCoords.length
    }
  }

  const calculateMovement = (currentLeft: any, currentRight: any, previous: any) => {
    if (!previous) return 0
    
    const leftMovement = Math.sqrt(
      Math.pow(currentLeft.x - previous.left.x, 2) + 
      Math.pow(currentLeft.y - previous.left.y, 2)
    )
    
    const rightMovement = Math.sqrt(
      Math.pow(currentRight.x - previous.right.x, 2) + 
      Math.pow(currentRight.y - previous.right.y, 2)
    )
    
    return (leftMovement + rightMovement) / 2
  }

  const calculateGazeStability = (landmarks: Landmark[]): number => {
    const noseTip = landmarks[1]
    if (history.length > 1) {
      const previous = history[history.length - 1]
      if (previous.noseTip) {
        const movement = Math.sqrt(
          Math.pow(noseTip.x - previous.noseTip.x, 2) + 
          Math.pow(noseTip.y - previous.noseTip.y, 2)
        )
        return Math.max(0, 1 - movement * 20)
      }
    }
    return 0.8
  }

  const calculateCognitiveScore = (ear: number, asymmetry: number, stability: number, movement: number): number => {
    const baseScore = 70
    const earScore = Math.min(100, baseScore + (ear - 0.25) * 100)
    const asymmetryPenalty = Math.max(0, asymmetry * 300)
    const stabilityBonus = stability * 15
    const movementPenalty = movement * 200
    
    return Math.max(0, Math.min(100, earScore - asymmetryPenalty + stabilityBonus - movementPenalty))
  }

  const startStructuredTest = async () => {
    try {
        setError(null)
        
        if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported in this browser')
        return
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: 'user'
        } 
        })
        
        if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        videoRef.current.onloadedmetadata = () => {
            // Load Camera Utils from CDN
            if (!window.Camera) {
            const cameraScript = document.createElement('script')
            cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
            cameraScript.onload = () => {
                initializeCameraAnalysis(mediaStream)
            }
            cameraScript.onerror = () => {
                setError('Failed to load camera utilities')
            }
            document.head.appendChild(cameraScript)
            } else {
            initializeCameraAnalysis(mediaStream)
            }
        }
        }
        
    } catch (error: any) {
        console.error('Error accessing camera:', error)
        setError(`Camera error: ${error.message}`)
    }
    }

    const initializeCameraAnalysis = (mediaStream: MediaStream) => {
    if (videoRef.current && faceMesh) {
        try {
        const cameraInstance = new window.Camera(videoRef.current, {
            onFrame: async () => {
            try {
                await faceMesh.send({ image: videoRef.current })
            } catch (error) {
                console.error('Error processing frame:', error)
            }
            },
            width: 640,
            height: 480
        })
        
        cameraInstance.start()
        setCamera(cameraInstance)
        setStream(mediaStream)
        setIsAnalyzing(true)
        setHistory([])
        setTestPhase('saccadic-test') // Start the structured test
        
        } catch (error) {
        console.error('Error starting camera analysis:', error)
        setError('Failed to start camera analysis')
        }
    }
    }

    // Add this function to handle test completion
    const handleSaccadicTestComplete = (testData: any) => {
    setSaccadicData(testData)
    setTestPhase('analysis')
    
    // Combine saccadic test data with eye tracking data for comprehensive analysis
    const combinedAssessment = analyzeAlzheimersPatterns(history, testData)
    setCognitiveAssessment(combinedAssessment)
    setTestResults({
        saccadicLatency: testData.saccadicLatency,
        accuracy: testData.accuracy,
        timestamp: new Date().toISOString()
    })
    }

  const stopAnalysis = () => {
    if (camera) {
      camera.stop()
      setCamera(null)
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsAnalyzing(false)
    setMetrics(null)
  }

  useEffect(() => {
    return () => {
      if (camera) camera.stop()
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [camera, stream])

  const getCognitiveStatus = (score: number) => {
    if (score >= 80) return { text: 'Optimal', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 60) return { text: 'Normal', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 40) return { text: 'Monitor', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { text: 'Consult Professional', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const status = metrics ? getCognitiveStatus(metrics.cognitiveScore) : null

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Brain className="w-7 h-7 text-purple-600" />
          Bathusi-AI Cognitive Screening
        </CardTitle>
        <CardDescription className="text-lg">
          Early detection through real-time eye movement analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
            {/* Saccadic Test */}
            {testPhase === 'saccadic-test' && (
                <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Saccadic Eye Movement Test
                </h3>
                <SaccadicTest 
                    onTestComplete={handleSaccadicTestComplete}
                    isRunning={testPhase === 'saccadic-test'}
                />
                <p className="text-sm text-gray-600 mt-2 text-center">
                    Follow and click the red dot as it moves around the grid
                </p>
                </div>
            )}

            {/* Camera Feed */}
            <div className="aspect-video bg-gray-900 rounded-xl relative overflow-hidden border-2 border-gray-300">
                <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                />
                
                {isAnalyzing && (
                <>
                    <div className="absolute inset-0 border-4 border-green-500 rounded-xl" />
                    <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 animate-pulse" />
                    Live Analysis Active
                    </div>
                    {metrics && metrics.faceDetected && (
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
                        Face Detected: ✅
                    </div>
                    )}
                </>
                )}
                
                {!isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                    <div className="text-center text-white">
                    <VideoOff className="w-16 h-16 mx-auto mb-3 opacity-60" />
                    <p className="text-lg font-semibold">Camera Ready</p>
                    <p className="text-sm opacity-80 mt-1">Click start to begin cognitive screening</p>
                    </div>
                </div>
                )}
            </div>
        </div>

        <div className="flex gap-3">
          {!isAnalyzing ? (
            <Button 
                onClick={startStructuredTest}
                className="flex-1 gap-3 py-3 text-lg"
                disabled={isModelLoading}
                size="lg"
            >
              {isModelLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Loading AI Model...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Start Cognitive Screening
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={stopAnalysis} 
              variant="outline" 
              className="flex-1 gap-3 py-3 text-lg"
              size="lg"
            >
              Stop Analysis
            </Button>
          )}
        </div>

        {metrics && metrics.faceDetected && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Real-time Cognitive Metrics
            </h3>
            
            <div className={`p-4 rounded-xl ${status?.bg} border-2 ${status?.color.replace('text', 'border')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-80">Cognitive Score</div>
                  <div className="text-3xl font-bold">{Math.round(metrics.cognitiveScore)}/100</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${status?.color}`}>{status?.text}</div>
                  <div className="text-sm opacity-70">Based on eye movement patterns</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.averageEAR.toFixed(3)}</div>
                <div className="text-sm text-gray-600 mt-1">Eye Openness</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.asymmetry.toFixed(4)}</div>
                <div className="text-sm text-gray-600 mt-1">Asymmetry</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-green-600">{(metrics.gazeStability * 100).toFixed(0)}%</div>
                <div className="text-sm text-gray-600 mt-1">Gaze Stability</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="flex justify-center">
                  {metrics.isBlink ? (
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {metrics.isBlink ? 'Blink Detected' : 'Eyes Open'}
                </div>
              </div>
            </div>
          </div>
        )}

        {testResults && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-500" />
                Saccadic Test Results
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-blue-600">{testResults.saccadicLatency.toFixed(0)}ms</div>
                    <div className="text-sm text-gray-600">Saccadic Latency</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-purple-600">{testResults.accuracy.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-green-600">
                    {testResults.saccadicLatency < 250 ? 'Excellent' : 
                    testResults.saccadicLatency < 350 ? 'Normal' : 'Delayed'}
                    </div>
                    <div className="text-sm text-gray-600">Assessment</div>
                </div>
                </div>
            </div>
            )}

        {cognitiveAssessment && (
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Medical Pattern Analysis
                </h3>
                
                <div className={`p-4 rounded-xl border-2 ${
                cognitiveAssessment.alzheimersRisk === 'high' 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : cognitiveAssessment.alzheimersRisk === 'medium'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                <div className="flex items-center justify-between">
                    <div>
                    <div className="text-sm font-medium opacity-80">Alzheimer's Pattern Risk</div>
                    <div className="text-2xl font-bold capitalize">
                        {cognitiveAssessment.alzheimersRisk} Risk
                    </div>
                    </div>
                    <div className="text-right">
                    <div className="text-lg font-semibold">
                        {Math.round(cognitiveAssessment.confidence * 100)}% Confidence
                    </div>
                    <div className="text-sm opacity-70">Based on eye movement biomarkers</div>
                    </div>
                </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3">Cognitive Biomarkers</h4>
                <div className="space-y-3">
                    <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span>Saccade Performance</span>
                        <span>{Math.round(cognitiveAssessment.biomarkers.saccadeImpairment)}% impaired</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${100 - cognitiveAssessment.biomarkers.saccadeImpairment}%` }}
                        ></div>
                    </div>
                    </div>
                    
                    <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span>Pursuit Tracking</span>
                        <span>{Math.round(cognitiveAssessment.biomarkers.pursuitImpairment)}% impaired</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${100 - cognitiveAssessment.biomarkers.pursuitImpairment}%` }}
                        ></div>
                    </div>
                    </div>
                    
                    <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span>Fixation Stability</span>
                        <span>{Math.round(cognitiveAssessment.biomarkers.fixationImpairment)}% impaired</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${100 - cognitiveAssessment.biomarkers.fixationImpairment}%` }}
                        ></div>
                    </div>
                    </div>
                </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    {cognitiveAssessment.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        {rec}
                    </li>
                    ))}
                </ul>
                </div>
            </div>
            )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-amber-800 mb-1">Research Preview</div>
              <div className="text-sm text-amber-700">
                This tool analyzes eye movement patterns which research suggests may correlate with cognitive function. 
                Not for medical diagnosis.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}