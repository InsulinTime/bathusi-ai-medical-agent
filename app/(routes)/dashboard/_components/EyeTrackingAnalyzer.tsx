// app/%28routes%29/dashboard/_components/EyeTrackingAnalyzer.tsx
"use client"
import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Camera, Brain, AlertTriangle, CheckCircle, Activity, Zap, VideoOff } from 'lucide-react'
import SaccadicTest from './SaccadicTest'
import { analyzeAlzheimersPatterns, CognitiveAssessment } from '@/app/utils/alzheimersPatterns';
import { CognitiveAnalysisAgent, CognitiveAnalysisResult } from '@/app/utils/cognitiveAnalysisAgent'


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
  pupilLeft: { x: number; y: number };
  pupilRight: { x: number; y: number };
  gazeDirection: { x: number; y: number };
  screenGaze: { x: number; y: number; quadrant: string };
  saccadeVelocity: number;
  fixationDuration: number;
  saccadeDetected: boolean;
}

// Correct MediaPipe types
declare global {
  interface Window {
    faceMesh: any;
    FaceMesh: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    FACEMESH_LEFT_EYE?: any;
    FACEMESH_RIGHT_EYE?: any;
  }
}

// Enhanced eye landmarks with more precise indices
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 130, 25, 110, 24, 23, 22, 26, 112];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 359, 255, 339, 254, 253, 252, 256, 341];
const LEFT_IRIS_INDICES = [468, 469, 470, 471, 472];
const RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477];

// Define face mesh connections manually
const FACEMESH_LEFT_EYE = [
  [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133],
  [33, 246], [246, 161], [161, 160], [160, 159], [159, 158], [158, 157], [157, 173], [173, 133]
];

const FACEMESH_RIGHT_EYE = [
  [362, 382], [382, 381], [381, 380], [380, 374], [374, 373], [373, 390], [390, 249], [249, 263],
  [362, 466], [466, 388], [388, 387], [387, 386], [386, 385], [385, 384], [384, 398], [398, 263]
];

// Screen quadrants for gaze analysis
const SCREEN_QUADRANTS = {
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  CENTER: 'center'
};

// Utility function to load scripts
const loadScript = (src: string, name: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      console.log(`✅ ${name} already loaded`)
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.onload = () => {
      console.log(`✅ ${name} loaded successfully`)
      resolve()
    }
    script.onerror = () => {
      console.error(`❌ Failed to load ${name}`)
      reject(new Error(`Failed to load ${name}`))
    }
    document.head.appendChild(script)
  })
}

export default function EyeTrackingAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [metrics, setMetrics] = useState<EyeMetrics | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [faceMesh, setFaceMesh] = useState<any>(null)
  const [camera, setCamera] = useState<any>(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<EyeMetrics[]>([])
  const [testPhase, setTestPhase] = useState<'idle' | 'calibration' | 'saccadic-test' | 'analysis'>('idle')
  const [saccadicData, setSaccadicData] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [cognitiveAssessment, setCognitiveAssessment] = useState<CognitiveAssessment | null>(null);
  const [fps, setFps] = useState(0);
  const [calibrationData, setCalibrationData] = useState<{center: {x: number, y: number}, range: number} | null>(null);
  const [gazePath, setGazePath] = useState<Array<{x: number, y: number, timestamp: number}>>([]);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(0);
  const lastSaccadeTimeRef = useRef(0);

  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        setIsModelLoading(true)
        setError(null)

        // Load MediaPipe from CDN with better error handling
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js', 'MediaPipe FaceMesh')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js', 'MediaPipe Drawing Utils')
        
        // Wait a bit for the scripts to initialize properly
        setTimeout(() => {
          createFaceMeshInstance()
        }, 100)
        
      } catch (error) {
        console.error('❌ Error initializing MediaPipe:', error)
        setError('Failed to initialize AI model: ' + error)
        setIsModelLoading(false)
      }
    }

    const createFaceMeshInstance = () => {
      try {
        // CORRECT: Check available constructors and use the right one
        let faceMeshInstance;
        
        if (window.faceMesh) {
          faceMeshInstance = new window.faceMesh({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            }
          })
        } else if (window.FaceMesh) {
          // Some versions might export it as FaceMesh
          faceMeshInstance = new window.FaceMesh({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            }
          })
        } else {
          // Try to access via the global MediaPipe object
          const mediapipe = (window as any).mediapipe;
          if (mediapipe && mediapipe.faceMesh) {
            faceMeshInstance = new mediapipe.faceMesh({
              locateFile: (file: string) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
              }
            })
          } else {
            throw new Error('FaceMesh constructor not found. Available globals: ' + Object.keys(window).join(', '))
          }
        }

        if (!faceMeshInstance) {
          throw new Error('Failed to create FaceMesh instance')
        }

        faceMeshInstance.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        })

        faceMeshInstance.onResults(onFaceMeshResults)
        setFaceMesh(faceMeshInstance)
        setIsModelLoading(false)
        
        console.log('✅ FaceMesh instance created successfully')
      } catch (error: any) {
        console.error('❌ Error creating FaceMesh instance:', error)
        setError('Failed to create FaceMesh instance: ' + error.message)
        setIsModelLoading(false)
        
        // Alternative approach: try to initialize with different method
        setTimeout(() => tryAlternativeInitialization(), 500)
      }
    }

    const tryAlternativeInitialization = () => {
      try {
        console.log('🔄 Trying alternative initialization...')
        
        // Check if FaceMesh is available in a different way
        const mediapipe = (window as any).mediapipe;
        const facemesh = (window as any).facemesh;
        
        if (mediapipe?.faceMesh) {
          const faceMeshInstance = new mediapipe.faceMesh({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            }
          })
          
          faceMeshInstance.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
          })

          faceMeshInstance.onResults(onFaceMeshResults)
          setFaceMesh(faceMeshInstance)
          setIsModelLoading(false)
          console.log('✅ FaceMesh instance created via alternative method')
          return
        }
        
        // Last resort: check for any global FaceMesh-like objects
        const globalKeys = Object.keys(window);
        const faceMeshKeys = globalKeys.filter(key => 
          key.toLowerCase().includes('face') || 
          key.toLowerCase().includes('mesh')
        );
        
        console.log('🔍 Available FaceMesh-related globals:', faceMeshKeys);
        
        if (faceMeshKeys.length === 0) {
          setError('FaceMesh not available. Please check if MediaPipe loaded correctly.')
          return
        }
        
        // Try the first available face mesh related global
        for (const key of faceMeshKeys) {
          try {
            const Constructor = (window as any)[key];
            if (typeof Constructor === 'function') {
              const instance = new Constructor({
                locateFile: (file: string) => {
                  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
                }
              });
              
              instance.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
              });

              instance.onResults(onFaceMeshResults);
              setFaceMesh(instance);
              setIsModelLoading(false);
              console.log(`✅ FaceMesh instance created via ${key}`);
              return;
            }
          } catch (e) {
            console.log(`❌ Failed to create instance with ${key}:`, e);
          }
        }
        
        setError('Could not initialize FaceMesh with any available method');
      } catch (error: any) {
        console.error('❌ Alternative initialization failed:', error);
        setError('All initialization methods failed: ' + error.message);
      }
    }

    initializeMediaPipe();
  }, [])

  const onFaceMeshResults = (results: any) => {
    // Update FPS counter
    frameCountRef.current++
    const now = performance.now()
    if (now - lastFpsUpdateRef.current >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)))
      frameCountRef.current = 0
      lastFpsUpdateRef.current = now
    }

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0]
      const newMetrics = calculateEnhancedEyeMetrics(landmarks)
      
      if (newMetrics) {
        setMetrics(newMetrics)
        
        // Add to history for pattern analysis
        const newHistory = [...history, newMetrics].slice(-120)
        setHistory(newHistory)
        
        // Update gaze path
        if (newMetrics.screenGaze) {
          setGazePath(prev => [...prev, {
            x: newMetrics.screenGaze.x,
            y: newMetrics.screenGaze.y,
            timestamp: Date.now()
          }].slice(-50))
        }
        
        // Draw landmarks on canvas
        drawLandmarksOnCanvas(landmarks, newMetrics)
        
        // Run Alzheimer's analysis when we have enough data
        if (newHistory.length >= 60) {
          const assessment = analyzeAlzheimersPatterns(newHistory, saccadicData)
          setCognitiveAssessment(assessment)
        }
      }
    } else {
      setMetrics(prev => prev ? { 
        ...prev, 
        confidence: 0.3, 
        faceDetected: false 
      } : null)
      
      // Clear canvas when no face detected
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const drawLandmarksOnCanvas = (landmarks: Landmark[], metrics?: EyeMetrics) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas?.getContext('2d')
    
    if (!canvas || !ctx || !video) return

    // Set canvas dimensions to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw eye landmarks using our manual definitions
    if (window.drawLandmarks && window.drawConnectors) {
      // Draw left eye
      const leftEyeLandmarks = LEFT_EYE_INDICES.map(i => landmarks[i])
      window.drawConnectors(ctx, leftEyeLandmarks, FACEMESH_LEFT_EYE, { color: '#00FF00', lineWidth: 1 })
      window.drawLandmarks(ctx, leftEyeLandmarks, { color: '#00FF00', lineWidth: 0.5, radius: 1 })
      
      // Draw right eye
      const rightEyeLandmarks = RIGHT_EYE_INDICES.map(i => landmarks[i])
      window.drawConnectors(ctx, rightEyeLandmarks, FACEMESH_RIGHT_EYE, { color: '#00FF00', lineWidth: 1 })
      window.drawLandmarks(ctx, rightEyeLandmarks, { color: '#00FF00', lineWidth: 0.5, radius: 1 })
      
      // Draw iris landmarks
      const leftIrisLandmarks = LEFT_IRIS_INDICES.map(i => landmarks[i])
      const rightIrisLandmarks = RIGHT_IRIS_INDICES.map(i => landmarks[i])
      
      window.drawLandmarks(ctx, leftIrisLandmarks, { color: '#FF0000', lineWidth: 1, radius: 2 })
      window.drawLandmarks(ctx, rightIrisLandmarks, { color: '#FF0000', lineWidth: 1, radius: 2 })
    } else {
      // Fallback: simple circle drawing if drawing utils not available
      drawSimpleLandmarks(ctx, landmarks, metrics)
    }

    // Draw gaze point on screen if available
    if (metrics?.screenGaze) {
      drawGazePoint(ctx, metrics.screenGaze)
    }

    // Draw gaze path
    drawGazePath(ctx)
  }

  // Draw gaze point on screen
  const drawGazePoint = (ctx: CanvasRenderingContext2D, screenGaze: {x: number, y: number, quadrant: string}) => {
    const canvas = ctx.canvas
    const gazeX = screenGaze.x * canvas.width
    const gazeY = screenGaze.y * canvas.height

    // Draw gaze point
    ctx.fillStyle = '#FF00FF'
    ctx.beginPath()
    ctx.arc(gazeX, gazeY, 8, 0, 2 * Math.PI)
    ctx.fill()

    // Draw pulse animation
    ctx.strokeStyle = '#FF00FF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(gazeX, gazeY, 12, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw quadrant text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '14px Arial'
    ctx.fillText(`Gaze: ${screenGaze.quadrant}`, gazeX + 15, gazeY - 10)
  }

  // Draw gaze path trail
  const drawGazePath = (ctx: CanvasRenderingContext2D) => {
    if (gazePath.length < 2) return

    const canvas = ctx.canvas
    ctx.strokeStyle = '#00FFFF'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    ctx.beginPath()
    gazePath.forEach((point, index) => {
      const x = point.x * canvas.width
      const y = point.y * canvas.height
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Fallback drawing function
  const drawSimpleLandmarks = (ctx: CanvasRenderingContext2D, landmarks: Landmark[], metrics?: EyeMetrics) => {
    const canvas = ctx.canvas
    
    // Draw left eye
    LEFT_EYE_INDICES.forEach(index => {
      const landmark = landmarks[index]
      if (landmark) {
        ctx.fillStyle = '#00FF00'
        ctx.beginPath()
        ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
    
    // Draw right eye
    RIGHT_EYE_INDICES.forEach(index => {
      const landmark = landmarks[index]
      if (landmark) {
        ctx.fillStyle = '#00FF00'
        ctx.beginPath()
        ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 2, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
    
    // Draw iris centers
    const leftIrisCenter = calculatePupilPosition(LEFT_IRIS_INDICES.map(i => landmarks[i]))
    const rightIrisCenter = calculatePupilPosition(RIGHT_IRIS_INDICES.map(i => landmarks[i]))
    
    ctx.fillStyle = '#FF0000'
    ctx.beginPath()
    ctx.arc(leftIrisCenter.x * canvas.width, leftIrisCenter.y * canvas.height, 3, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(rightIrisCenter.x * canvas.width, rightIrisCenter.y * canvas.height, 3, 0, 2 * Math.PI)
    ctx.fill()
  }

  // Calibration function to establish baseline gaze
  const calibrateGaze = () => {
    if (metrics && metrics.faceDetected) {
      const centerX = metrics.gazeDirection.x
      const centerY = metrics.gazeDirection.y
      
      setCalibrationData({
        center: { x: centerX, y: centerY },
        range: 0.1
      })
      
      console.log('Gaze calibration completed:', { centerX, centerY })
    }
  }

  const calculateEnhancedEyeMetrics = (landmarks: Landmark[]): EyeMetrics | null => {
    try {
      const leftEyeCoords = LEFT_EYE_INDICES.map(i => landmarks[i])
      const rightEyeCoords = RIGHT_EYE_INDICES.map(i => landmarks[i])
      const leftIrisCoords = LEFT_IRIS_INDICES.map(i => landmarks[i])
      const rightIrisCoords = RIGHT_IRIS_INDICES.map(i => landmarks[i])
      
      const leftEAR = calculateEAR(leftEyeCoords)
      const rightEAR = calculateEAR(rightEyeCoords)
      const averageEAR = (leftEAR + rightEAR) / 2
      const asymmetry = Math.abs(leftEAR - rightEAR)
      
      const leftPupil = calculatePupilPosition(leftIrisCoords)
      const rightPupil = calculatePupilPosition(rightIrisCoords)
      
      const gazeDirection = calculateGazeDirection(leftPupil, rightPupil, leftEyeCoords, rightEyeCoords)
      const screenGaze = calculateScreenGaze(gazeDirection, calibrationData)
      
      let movement = 0
      let saccadeVelocity = 0
      let saccadeDetected = false
      
      if (history.length > 0) {
        const lastMetrics = history[history.length - 1]
        movement = calculateMovement(leftPupil, rightPupil, lastMetrics)
        saccadeVelocity = calculateSaccadeVelocity(leftPupil, rightPupil, lastMetrics)
        saccadeDetected = detectSaccade(movement, saccadeVelocity, lastMetrics)
      }
      
      const isBlink = averageEAR < 0.15
      const gazeStability = calculateEnhancedGazeStability(landmarks, history)
      const fixationDuration = calculateFixationDuration(history, movement)
      
      const cognitiveScore = calculateEnhancedCognitiveScore(
        averageEAR, 
        asymmetry, 
        gazeStability, 
        movement, 
        saccadeVelocity,
        fixationDuration
      )
      
      return {
        leftEyeOpenness: leftEAR,
        rightEyeOpenness: rightEAR,
        averageEAR,
        asymmetry,
        gazeStability,
        isBlink,
        movement,
        confidence: 0.9,
        faceDetected: true,
        cognitiveScore,
        timestamp: new Date().toISOString(),
        pupilLeft: leftPupil,
        pupilRight: rightPupil,
        gazeDirection,
        screenGaze,
        saccadeVelocity,
        fixationDuration,
        saccadeDetected
      }
    } catch (error) {
      console.error('Error calculating enhanced metrics:', error)
      return null
    }
  }

  // Calculate screen-relative gaze position
  const calculateScreenGaze = (gazeDirection: {x: number, y: number}, calibration: any) => {
    if (!calibration) {
      const x = 0.5 + (gazeDirection.x * 2)
      const y = 0.5 + (gazeDirection.y * 2)
      
      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        quadrant: getScreenQuadrant(x, y)
      }
    }

    const calibratedX = 0.5 + ((gazeDirection.x - calibration.center.x) / calibration.range) * 0.5
    const calibratedY = 0.5 + ((gazeDirection.y - calibration.center.y) / calibration.range) * 0.5

    return {
      x: Math.max(0, Math.min(1, calibratedX)),
      y: Math.max(0, Math.min(1, calibratedY)),
      quadrant: getScreenQuadrant(calibratedX, calibratedY)
    }
  }

  // Determine which screen quadrant the gaze is in
  const getScreenQuadrant = (x: number, y: number): string => {
    if (x < 0.4 && y < 0.4) return SCREEN_QUADRANTS.TOP_LEFT
    if (x > 0.6 && y < 0.4) return SCREEN_QUADRANTS.TOP_RIGHT
    if (x < 0.4 && y > 0.6) return SCREEN_QUADRANTS.BOTTOM_LEFT
    if (x > 0.6 && y > 0.6) return SCREEN_QUADRANTS.BOTTOM_RIGHT
    return SCREEN_QUADRANTS.CENTER
  }

  // Detect saccades (rapid eye movements)
  const detectSaccade = (currentMovement: number, currentVelocity: number, lastMetrics: EyeMetrics): boolean => {
    const now = Date.now()
    const timeSinceLastSaccade = now - lastSaccadeTimeRef.current
    
    const isRapidMovement = currentVelocity > 80
    const isSignificantMovement = currentMovement > 0.02
    const sufficientTimePassed = timeSinceLastSaccade > 100
    
    if (isRapidMovement && isSignificantMovement && sufficientTimePassed) {
      lastSaccadeTimeRef.current = now
      return true
    }
    
    return false
  }

  const calculateEAR = (eyeCoords: Landmark[]): number => {
    try {
      const p1 = eyeCoords[0]
      const p2 = eyeCoords[1]
      const p3 = eyeCoords[2]
      const p4 = eyeCoords[3]
      const p5 = eyeCoords[4]
      const p6 = eyeCoords[5]
      const p7 = eyeCoords[6]
      const p8 = eyeCoords[7]

      const vertical1 = Math.sqrt(Math.pow(p2.x - p8.x, 2) + Math.pow(p2.y - p8.y, 2))
      const vertical2 = Math.sqrt(Math.pow(p3.x - p7.x, 2) + Math.pow(p3.y - p7.y, 2))
      const vertical3 = Math.sqrt(Math.pow(p4.x - p6.x, 2) + Math.pow(p4.y - p6.y, 2))
      const horizontal = Math.sqrt(Math.pow(p1.x - p5.x, 2) + Math.pow(p1.y - p5.y, 2))

      return horizontal > 0 ? (vertical1 + vertical2 + vertical3) / (3 * horizontal) : 0.25
    } catch (error) {
      return 0.25
    }
  }

  const calculatePupilPosition = (irisCoords: Landmark[]) => {
    const sum = irisCoords.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 })
    
    return {
      x: sum.x / irisCoords.length,
      y: sum.y / irisCoords.length
    }
  }

  const calculateGazeDirection = (leftPupil: any, rightPupil: any, leftEye: Landmark[], rightEye: Landmark[]) => {
    const leftEyeCenter = calculateEyeCenter(leftEye)
    const rightEyeCenter = calculateEyeCenter(rightEye)
    
    const leftGazeX = ((leftPupil.x - leftEyeCenter.x) / (calculateEyeWidth(leftEye))) * 2
    const leftGazeY = ((leftPupil.y - leftEyeCenter.y) / (calculateEyeHeight(leftEye))) * 2
    const rightGazeX = ((rightPupil.x - rightEyeCenter.x) / (calculateEyeWidth(rightEye))) * 2
    const rightGazeY = ((rightPupil.y - rightEyeCenter.y) / (calculateEyeHeight(rightEye))) * 2
    
    return {
      x: (leftGazeX + rightGazeX) / 2,
      y: (leftGazeY + rightGazeY) / 2
    }
  }

  const calculateEyeWidth = (eyeCoords: Landmark[]) => {
    const leftCorner = eyeCoords[0]
    const rightCorner = eyeCoords[4]
    return Math.abs(rightCorner.x - leftCorner.x)
  }

  const calculateEyeHeight = (eyeCoords: Landmark[]) => {
    const top = eyeCoords[2].y
    const bottom = eyeCoords[6].y
    return Math.abs(bottom - top)
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

  const calculateMovement = (currentLeft: any, currentRight: any, previous: EyeMetrics) => {
    const leftMovement = Math.sqrt(
      Math.pow(currentLeft.x - previous.pupilLeft.x, 2) + 
      Math.pow(currentLeft.y - previous.pupilLeft.y, 2)
    )
    
    const rightMovement = Math.sqrt(
      Math.pow(currentRight.x - previous.pupilRight.x, 2) + 
      Math.pow(currentRight.y - previous.pupilRight.y, 2)
    )
    
    return (leftMovement + rightMovement) / 2
  }

  const calculateSaccadeVelocity = (currentLeft: any, currentRight: any, previous: EyeMetrics) => {
    const timeDiff = 16.67
    const movement = calculateMovement(currentLeft, currentRight, previous)
    return (movement / timeDiff) * 1000
  }

  const calculateEnhancedGazeStability = (landmarks: Landmark[], history: EyeMetrics[]): number => {
    if (history.length < 2) return 0.8
    
    const recentGazeDirections = history.slice(-10).map(h => h.gazeDirection)
    let totalVariance = 0
    
    for (let i = 1; i < recentGazeDirections.length; i++) {
      const dx = recentGazeDirections[i].x - recentGazeDirections[i-1].x
      const dy = recentGazeDirections[i].y - recentGazeDirections[i-1].y
      totalVariance += Math.sqrt(dx * dx + dy * dy)
    }
    
    const avgVariance = totalVariance / (recentGazeDirections.length - 1)
    return Math.max(0, 1 - (avgVariance * 10))
  }

  const calculateFixationDuration = (history: EyeMetrics[], currentMovement: number): number => {
    if (history.length < 2) return 0
    
    let fixationFrames = 0
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].movement < 0.005) {
        fixationFrames++
      } else {
        break
      }
    }
    
    return fixationFrames * 16.67
  }

  const calculateEnhancedCognitiveScore = (
    ear: number, 
    asymmetry: number, 
    stability: number, 
    movement: number, 
    velocity: number,
    fixation: number
  ): number => {
    const baseScore = 70
    
    const earScore = Math.min(100, baseScore + (ear - 0.25) * 120)
    const asymmetryPenalty = Math.max(0, asymmetry * 400)
    const stabilityBonus = stability * 20
    const movementPenalty = movement * 300
    const velocityPenalty = velocity > 50 ? (velocity - 50) * 2 : 0
    const fixationBonus = Math.min(15, fixation / 100)
    
    return Math.max(0, Math.min(100, 
      earScore - asymmetryPenalty + stabilityBonus - movementPenalty - velocityPenalty + fixationBonus
    ))
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
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 60 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', 'Camera Utils')
            initializeCameraAnalysis(mediaStream)
          } catch (error) {
            console.error('Failed to load camera utils:', error)
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
        if (window.Camera) {
          const cameraInstance = new window.Camera(videoRef.current, {
            onFrame: async () => {
              try {
                await faceMesh.send({ image: videoRef.current })
              } catch (error) {
                console.error('Error processing frame:', error)
              }
            },
            width: 1280,
            height: 720
          })
          
          cameraInstance.start()
          setCamera(cameraInstance)
        } else {
          console.log('Using manual frame capture')
          const captureFrame = async () => {
            if (isAnalyzing && videoRef.current && faceMesh) {
              try {
                await faceMesh.send({ image: videoRef.current })
                requestAnimationFrame(captureFrame)
              } catch (error) {
                console.error('Error in manual frame capture:', error)
              }
            }
          }
          captureFrame()
        }
        
        setStream(mediaStream)
        setIsAnalyzing(true)
        setHistory([])
        setGazePath([])
        setTestPhase('calibration')
        
        setTimeout(() => {
          calibrateGaze()
          setTestPhase('saccadic-test')
        }, 2000)
        
      } catch (error) {
        console.error('Error starting camera analysis:', error)
        setError('Failed to start camera analysis: ' + error)
      }
    }
  }

  const handleSaccadicTestComplete = (testData: any) => {
    const enhancedTestData = {
      ...testData,
      gazeAnalysis: {
        totalSaccades: history.filter(h => h.saccadeDetected).length,
        averageSaccadeVelocity: history.reduce((sum, h) => sum + h.saccadeVelocity, 0) / history.length,
        gazePath: gazePath,
        screenCoverage: calculateScreenCoverage(gazePath)
      }
    }
    
    setSaccadicData(enhancedTestData)
    setTestPhase('analysis')
    
    const combinedAssessment = analyzeAlzheimersPatterns(history, enhancedTestData)
    setCognitiveAssessment(combinedAssessment)
    setTestResults({
      saccadicLatency: enhancedTestData.saccadicLatency,
      accuracy: enhancedTestData.accuracy,
      gazeMetrics: enhancedTestData.gazeAnalysis,
      timestamp: new Date().toISOString()
    })
  }

  const calculateScreenCoverage = (gazePath: Array<{x: number, y: number}>) => {
    if (gazePath.length < 2) return 0
    
    const uniquePositions = new Set()
    gazePath.forEach(point => {
      const gridX = Math.floor(point.x * 10)
      const gridY = Math.floor(point.y * 10)
      uniquePositions.add(`${gridX},${gridY}`)
    })
    
    return (uniquePositions.size / 100) * 100
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
    setFps(0)
    setGazePath([])
  }

  useEffect(() => {
    return () => {
      if (camera) camera.stop()
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [camera, stream])

  const getCognitiveStatus = (score: number) => {
    if (score >= 85) return { text: 'Optimal', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 70) return { text: 'Normal', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 50) return { text: 'Monitor', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { text: 'Consult Professional', color: 'text-red-600', bg: 'bg-red-100' }
  }
  const handleCognitiveAnalysis = async (eyeData: any, saccadicData: any) => {
    try {
      const analysisAgent = new CognitiveAnalysisAgent();
      const results = await analysisAgent.analyzeCognitiveData(eyeData, saccadicData);
      
      // Convert CognitiveAnalysisResult to CognitiveAssessment format
      const cognitiveAssessment: CognitiveAssessment = {
        alzheimersRisk: results.riskLevel,
        confidence: results.confidence,
        biomarkers: {
          saccadeImpairment: results.biomarkers.saccadeImpairment,
          pursuitImpairment: results.biomarkers.pursuitImpairment,
          fixationImpairment: results.biomarkers.fixationImpairment,
          velocityImpairment: results.biomarkers.velocityImpairment,
          overallCognitiveScore: results.biomarkers.overallScore
        },
        recommendations: results.recommendations,
        detailedMetrics: {
          saccadeLatency: saccadicData?.saccadicLatency || 0,
          pursuitGain: eyeData?.gazeStability || 0,
          fixationStability: eyeData?.fixationDuration ? (eyeData.fixationDuration / 400) : 0, // Normalize to 0-1
          gazeConsistency: results.confidence
        }
      };
      
      // Store results in your database
      await saveCognitiveResultsToDB(results, cognitiveAssessment);
      
      // Update UI with results
      setCognitiveAssessment(cognitiveAssessment);
      
    } catch (error) {
      console.error('Cognitive analysis failed:', error);
    }
  };

  // Add this function to save results to your database
  const saveCognitiveResultsToDB = async (results: CognitiveAnalysisResult, assessment: CognitiveAssessment) => {
    try {
      const response = await fetch('/api/save-cognitive-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cognitiveResults: results,
          cognitiveAssessment: assessment,
          sessionId: 'current-session-id', // You'll need to pass this from your component
          userId: 'current-user-id' // You'll need to pass this from your component
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save cognitive results');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving cognitive results:', error);
    }
  };

  const status = metrics ? getCognitiveStatus(metrics.cognitiveScore) : null

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Brain className="w-7 h-7 text-purple-600" />
          Bathusi-AI Enhanced Cognitive Screening
        </CardTitle>
        <CardDescription className="text-lg">
          Advanced eye tracking with true gaze detection for accurate saccade analysis
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

        {/* Calibration Phase */}
        {testPhase === 'calibration' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
              <span className="font-semibold text-blue-800">Gaze Calibration</span>
            </div>
            <p className="text-blue-700 text-sm">
              Please look directly at the center of the screen. Calibrating your gaze...
            </p>
          </div>
        )}

        <div className="space-y-4" ref={containerRef}>
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
                Follow and click the red dot as it moves around the grid. Your gaze is being tracked.
              </p>
            </div>
          )}

          {/* Enhanced Camera Feed with Overlay */}
          <div className="aspect-video bg-gray-900 rounded-xl relative overflow-hidden border-2 border-gray-300">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
            
            {isAnalyzing && (
              <>
                <div className="absolute inset-0 border-4 border-green-500 rounded-xl" />
                <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-pulse" />
                  Live Analysis Active
                </div>
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold">
                  {fps} FPS
                </div>
                {metrics && metrics.faceDetected && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
                    Iris Tracking: ✅ | Gaze: {metrics.screenGaze.quadrant} | 
                    Saccades: {history.filter(h => h.saccadeDetected).length}
                  </div>
                )}
              </>
            )}
            
            {!isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                <div className="text-center text-white">
                  <VideoOff className="w-16 h-16 mx-auto mb-3 opacity-60" />
                  <p className="text-lg font-semibold">Enhanced Eye Tracking Ready</p>
                  <p className="text-sm opacity-80 mt-1">True gaze detection with saccade analysis</p>
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
                  Loading Enhanced AI Model...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Start Enhanced Cognitive Screening
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
              Enhanced Real-time Cognitive Metrics
            </h3>
            
            <div className={`p-4 rounded-xl ${status?.bg} border-2 ${status?.color.replace('text', 'border')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-80">Cognitive Score</div>
                  <div className="text-3xl font-bold">{Math.round(metrics.cognitiveScore)}/100</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${status?.color}`}>{status?.text}</div>
                  <div className="text-sm opacity-70">Based on advanced eye movement biomarkers</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.averageEAR.toFixed(3)}</div>
                <div className="text-sm text-gray-600 mt-1">Eye Aspect Ratio</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.saccadeVelocity.toFixed(1)}</div>
                <div className="text-sm text-gray-600 mt-1">Saccade Vel (px/s)</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-green-600">{(metrics.gazeStability * 100).toFixed(0)}%</div>
                <div className="text-sm text-gray-600 mt-1">Gaze Stability</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.fixationDuration.toFixed(0)}ms</div>
                <div className="text-sm text-gray-600 mt-1">Fixation Duration</div>
              </div>
            </div>

            {/* Enhanced Gaze Information */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Advanced Gaze Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">{metrics.screenGaze.x.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Screen X</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">{metrics.screenGaze.y.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Screen Y</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600 capitalize">{metrics.screenGaze.quadrant.replace('-', ' ')}</div>
                  <div className="text-sm text-gray-600">Screen Quadrant</div>
                </div>
                <div>
                  <div className="flex justify-center">
                    {metrics.saccadeDetected ? (
                      <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {metrics.saccadeDetected ? 'Saccade!' : 'Fixation'}
                  </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
                  {testResults.saccadicLatency < 200 ? 'Excellent' : 
                   testResults.saccadicLatency < 300 ? 'Normal' : 'Delayed'}
                </div>
                <div className="text-sm text-gray-600">Assessment</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{testResults.gazeMetrics.totalSaccades}</div>
                <div className="text-sm text-gray-600">Saccades Detected</div>
              </div>
            </div>
          </div>
        )}

        {cognitiveAssessment && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Advanced Medical Pattern Analysis
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
                  <div className="text-sm opacity-70">Based on advanced eye movement biomarkers</div>
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
                This enhanced tool analyzes iris movement patterns and gaze behavior which research suggests 
                may correlate with cognitive function. Not for medical diagnosis.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}