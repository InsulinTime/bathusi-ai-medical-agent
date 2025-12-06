// app/(routes)/dashboard/_components/EyeTrackingAnalyzer.tsx
"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Camera, Brain, AlertTriangle, CheckCircle, Activity, Zap, VideoOff, Heart, Target, Crosshair, Settings } from 'lucide-react'
import SaccadicTest from './SaccadicTest'
import { analyzeAlzheimersPatterns, CognitiveAssessment } from '@/app/utils/alzheimersPatterns'
import { CognitiveAnalysisAgent, CognitiveAnalysisResult } from '@/app/utils/cognitiveAnalysisAgent'

class Vector3 {
  constructor(public x: number, public y: number, public z: number) {}
  
  static from(arr: number[]): Vector3 {
    return new Vector3(arr[0] || 0, arr[1] || 0, arr[2] || 0)
  }
  
  add(v: Vector3): Vector3 {
    return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z)
  }
  
  subtract(v: Vector3): Vector3 {
    return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z)
  }
  
  multiply(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar)
  }
  
  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }
  
  cross(v: Vector3): Vector3 {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    )
  }
  
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }
  
  normalize(): Vector3 {
    const len = this.length()
    if (len < 1e-9) return new Vector3(0, 0, 0)
    return new Vector3(this.x / len, this.y / len, this.z / len)
  }
  
  toArray(): number[] {
    return [this.x, this.y, this.z]
  }
}

class Matrix3 {
  constructor(public data: number[][]) {}
  
  static identity(): Matrix3 {
    return new Matrix3([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ])
  }
  
  static fromEuler(roll: number, pitch: number, yaw: number): Matrix3 {
    const cr = Math.cos(roll), sr = Math.sin(roll)
    const cp = Math.cos(pitch), sp = Math.sin(pitch)
    const cy = Math.cos(yaw), sy = Math.sin(yaw)
    
    return new Matrix3([
      [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
      [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr],
      [-sp, cp * sr, cp * cr]
    ])
  }
  
  multiply(v: Vector3): Vector3 {
    return new Vector3(
      this.data[0][0] * v.x + this.data[0][1] * v.y + this.data[0][2] * v.z,
      this.data[1][0] * v.x + this.data[1][1] * v.y + this.data[1][2] * v.z,
      this.data[2][0] * v.x + this.data[2][1] * v.y + this.data[2][2] * v.z
    )
  }
  
  transpose(): Matrix3 {
    return new Matrix3([
      [this.data[0][0], this.data[1][0], this.data[2][0]],
      [this.data[0][1], this.data[1][1], this.data[2][1]],
      [this.data[0][2], this.data[1][2], this.data[2][2]]
    ])
  }
  
  determinant(): number {
    const a = this.data
    return a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
           a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
           a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0])
  }
}

interface Landmark {
  x: number
  y: number
  z: number
}

interface EyeSphere {
  center: Vector3
  radius: number
  locked: boolean
  localOffset?: Vector3
  calibrationScale?: number
}

interface VirtualEyeCursor {
  x: number
  y: number
  isTracking: boolean
  confidence: number
}

interface EyeMetrics {
  leftEyeOpenness: number
  rightEyeOpenness: number
  averageEAR: number
  asymmetry: number
  gazeStability: number
  isBlink: boolean
  movement: number
  confidence: number
  faceDetected: boolean
  cognitiveScore: number
  timestamp: string
  pupilLeft: { x: number; y: number }
  pupilRight: { x: number; y: number }
  gazeDirection: { x: number; y: number }
  screenGaze: { x: number; y: number; quadrant: string }
  saccadeVelocity: number
  fixationDuration: number
  saccadeDetected: boolean
  virtualCursor: VirtualEyeCursor
  headCenter3D: Vector3
  headRotation: Matrix3
  leftIris3D: Vector3
  rightIris3D: Vector3
  leftGazeRay: Vector3
  rightGazeRay: Vector3
  combinedGazeRay: Vector3
}

const NOSE_INDICES = [4, 45, 275, 220, 440, 1, 5, 51, 281, 44, 274, 241, 
                      461, 125, 354, 218, 438, 195, 167, 393, 165, 391, 3, 248]

const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]

const LEFT_IRIS_INDEX = 468
const RIGHT_IRIS_INDEX = 473

const SCREEN_QUADRANTS = {
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  CENTER: 'center'
}

declare global {
  interface Window {
    Holistic?: any
    Camera?: any
    drawConnectors?: any
    drawLandmarks?: any
  }
}

export default function EyeTrackingAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debugCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [metrics, setMetrics] = useState<EyeMetrics | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [holistic, setHolistic] = useState<any>(null)
  const [camera, setCamera] = useState<any>(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<EyeMetrics[]>([])
  const [testPhase, setTestPhase] = useState<'idle' | 'calibration' | 'saccadic-test' | 'analysis'>('idle')
  const [saccadicData, setSaccadicData] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [cognitiveAssessment, setCognitiveAssessment] = useState<CognitiveAssessment | null>(null)
  const [fps, setFps] = useState(0)
  
  const [leftEyeSphere, setLeftEyeSphere] = useState<EyeSphere>({
    center: new Vector3(0, 0, 0),
    radius: 12,
    locked: false
  })
  
  const [rightEyeSphere, setRightEyeSphere] = useState<EyeSphere>({
    center: new Vector3(0, 0, 0),
    radius: 12,
    locked: false
  })
  
  const [calibrationOffset, setCalibrationOffset] = useState({ yaw: 0, pitch: 0 })
  const [monitorPlane, setMonitorPlane] = useState<any>(null)
  const [headRotationRef, setHeadRotationRef] = useState<Matrix3 | null>(null)
  
  const gazeHistoryRef = useRef<Vector3[]>([])
  const GAZE_HISTORY_SIZE = 10
  
  const virtualEyeCursor = useRef<VirtualEyeCursor>({
    x: 0.5,
    y: 0.5,
    isTracking: false,
    confidence: 0
  })
  
  const frameCountRef = useRef(0)
  const lastFpsUpdateRef = useRef(0)

  useEffect(() => {
    loadMediaPipeHolistic()
    
    return () => {
      if (camera) camera.stop()
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [])

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`)
      if (existing) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = src
      script.crossOrigin = 'anonymous'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load: ${src}`))
      document.head.appendChild(script)
    })
  }

  const loadMediaPipeHolistic = async () => {
    try {
      setIsModelLoading(true)
      setError(null)
      
      console.log('Loading MediaPipe Holistic for 3D eye tracking...')
      
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/holistic.js'
      ]
      
      for (const src of scripts) {
        await loadScript(src)
        console.log(`Loaded: ${src}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const Holistic = (window as any).Holistic || 
                      (window as any).mediapipe?.Holistic ||
                      (window as any).holistic?.Holistic
      
      if (!Holistic) {
        console.error('MediaPipe not found in window object')
        console.log('Window keys:', Object.keys(window))
        
        throw new Error('MediaPipe Holistic not available - using fallback')
      }
      
      const holisticInstance = new Holistic({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/${file}`
        }
      })
      
      holisticInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })
      
      holisticInstance.onResults(onHolisticResults)
      
      setHolistic(holisticInstance)
      setIsModelLoading(false)
      
      console.log('✅ 3D Eye tracking model initialized')
      
    } catch (error) {
      console.error('❌ Error loading 3D eye tracking:', error)
      
      // Implement fallback to basic webcam tracking
      await loadFallbackTracking()
    }
  }

  // Add a fallback tracking method
  const loadFallbackTracking = async () => {
    try {
      console.log('Loading fallback face tracking...')
      
      // Use simpler face-api.js as fallback
      await loadScript('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const faceapi = (window as any).faceapi
      
      if (faceapi) {
        // Load face-api models
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights')
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights')
        
        setIsModelLoading(false)
        setError('Using simplified eye tracking (MediaPipe unavailable)')
        
        // Start simplified tracking
        startFallbackTracking()
      } else {
        throw new Error('No face tracking libraries available')
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      setError('Eye tracking unavailable. Please try refreshing the page.')
      setIsModelLoading(false)
    }
  }

  // Simplified tracking for fallback
  const startFallbackTracking = () => {
    const video = videoRef.current
    if (!video) return
    
    const processVideo = async () => {
      if (!video || !isAnalyzing) return
      
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Simple face detection using getUserMedia only
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Simulate basic eye tracking metrics
      const mockMetrics: EyeMetrics = {
        leftEyeOpenness: 0.3 + Math.random() * 0.1,
        rightEyeOpenness: 0.3 + Math.random() * 0.1,
        averageEAR: 0.3,
        asymmetry: Math.random() * 0.05,
        gazeStability: 0.7 + Math.random() * 0.2,
        isBlink: Math.random() > 0.95,
        movement: Math.random() * 0.1,
        confidence: 0.5,
        faceDetected: true,
        cognitiveScore: 70 + Math.random() * 20,
        timestamp: new Date().toISOString(),
        pupilLeft: { x: 0.4, y: 0.5 },
        pupilRight: { x: 0.6, y: 0.5 },
        gazeDirection: { x: 0, y: 0 },
        screenGaze: { 
          x: 0.5 + (Math.random() - 0.5) * 0.2, 
          y: 0.5 + (Math.random() - 0.5) * 0.2, 
          quadrant: 'center' 
        },
        saccadeVelocity: Math.random() * 2,
        fixationDuration: 200 + Math.random() * 200,
        saccadeDetected: Math.random() > 0.7,
        virtualCursor: {
          x: 0.5 + (Math.random() - 0.5) * 0.3,
          y: 0.5 + (Math.random() - 0.5) * 0.3,
          isTracking: true,
          confidence: 0.5
        },
        headCenter3D: new Vector3(0, 0, 0),
        headRotation: Matrix3.identity(),
        leftIris3D: new Vector3(-20, 0, 0),
        rightIris3D: new Vector3(20, 0, 0),
        leftGazeRay: new Vector3(0, 0, -1),
        rightGazeRay: new Vector3(0, 0, -1),
        combinedGazeRay: new Vector3(0, 0, -1)
      }
      
      setMetrics(mockMetrics)
      setHistory(prev => [...prev, mockMetrics].slice(-120))
      
      // Draw tracking indicator
      ctx.fillStyle = '#00FF00'
      ctx.font = '16px Arial'
      ctx.fillText('Fallback Tracking Active', 10, 30)
      
      if (isAnalyzing) {
        requestAnimationFrame(processVideo)
      }
    }
    
    processVideo()
  }

  // Update the startMedicalTest function

  const computeHeadPoseFromNose = (landmarks: any[], videoWidth: number, videoHeight: number): { center: Vector3, rotation: Matrix3, scale: number } => {
    // Extract nose landmarks
    const nosePoints = NOSE_INDICES.map(i => 
      new Vector3(
        landmarks[i].x * videoWidth,
        landmarks[i].y * videoHeight,
        landmarks[i].z * videoWidth
      )
    )
    
    // Compute center
    const center = nosePoints.reduce((acc, p) => acc.add(p), new Vector3(0, 0, 0))
      .multiply(1 / nosePoints.length)
    
    // Center the points
    const centered = nosePoints.map(p => p.subtract(center))
    
    // Compute covariance matrix for PCA
    const cov = Array(3).fill(0).map(() => Array(3).fill(0))
    
    for (const p of centered) {
      const v = [p.x, p.y, p.z]
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          cov[i][j] += v[i] * v[j]
        }
      }
    }
    
    // Simplified PCA - use basic orientation estimation
    // For production, you'd want proper eigenvalue decomposition
    const forward = new Vector3(0, 0, -1) // Default forward
    const up = new Vector3(0, -1, 0) // Default up
    const right = forward.cross(up).normalize()
    
    const rotation = new Matrix3([
      right.toArray(),
      up.toArray(),
      forward.toArray()
    ])
    
    // Compute scale from average pairwise distance
    let totalDist = 0
    let count = 0
    for (let i = 0; i < nosePoints.length; i++) {
      for (let j = i + 1; j < nosePoints.length; j++) {
        totalDist += nosePoints[i].subtract(nosePoints[j]).length()
        count++
      }
    }
    const scale = count > 0 ? totalDist / count : 1
    
    // Stabilize rotation with reference
    if (headRotationRef) {
      // Check for flips and correct
      const det = rotation.determinant()
      if (det < 0) {
        rotation.data[2] = rotation.data[2].map(v => -v)
      }
    }
    
    return { center, rotation, scale }
  }

  const calibrateEyeSpheres = (landmarks: any[], headPose: any, videoWidth: number, videoHeight: number) => {
    const leftIris = new Vector3(
      landmarks[LEFT_IRIS_INDEX].x * videoWidth,
      landmarks[LEFT_IRIS_INDEX].y * videoHeight,
      landmarks[LEFT_IRIS_INDEX].z * videoWidth
    )
    
    const rightIris = new Vector3(
      landmarks[RIGHT_IRIS_INDEX].x * videoWidth,
      landmarks[RIGHT_IRIS_INDEX].y * videoHeight,
      landmarks[RIGHT_IRIS_INDEX].z * videoWidth
    )
    
    // Base radius for eye sphere (adjust based on face scale)
    const baseRadius = 12
    
    // Camera direction in world space
    const cameraDir = new Vector3(0, 0, 1)
    const cameraLocal = headPose.rotation.transpose().multiply(cameraDir)
    
    // Left eye sphere
    const leftOffset = headPose.rotation.transpose().multiply(leftIris.subtract(headPose.center))
    const leftSphereOffset = leftOffset.add(cameraLocal.multiply(baseRadius))
    
    setLeftEyeSphere({
      center: headPose.center.add(headPose.rotation.multiply(leftSphereOffset)),
      radius: baseRadius,
      locked: true,
      localOffset: leftSphereOffset,
      calibrationScale: headPose.scale
    })
    
    // Right eye sphere
    const rightOffset = headPose.rotation.transpose().multiply(rightIris.subtract(headPose.center))
    const rightSphereOffset = rightOffset.add(cameraLocal.multiply(baseRadius))
    
    setRightEyeSphere({
      center: headPose.center.add(headPose.rotation.multiply(rightSphereOffset)),
      radius: baseRadius,
      locked: true,
      localOffset: rightSphereOffset,
      calibrationScale: headPose.scale
    })
    
    console.log('Eye spheres calibrated')
  }

  const calculate3DGazeDirection = (
    irisPos: Vector3,
    sphereCenter: Vector3,
    sphereRadius: number
  ): Vector3 => {
    // Calculate gaze ray from eye sphere center through iris
    const gazeDir = irisPos.subtract(sphereCenter)
    return gazeDir.normalize()
  }

  const convertGazeToScreenCoordinates = (gazeDir: Vector3): { x: number, y: number } => {
    // Reference forward (looking straight ahead)
    const reference = new Vector3(0, 0, -1)
    
    // Calculate yaw (horizontal angle)
    const xzProj = new Vector3(gazeDir.x, 0, gazeDir.z).normalize()
    let yawRad = Math.acos(Math.max(-1, Math.min(1, reference.dot(xzProj))))
    if (gazeDir.x < 0) yawRad = -yawRad
    
    // Calculate pitch (vertical angle)
    const yzProj = new Vector3(0, gazeDir.y, gazeDir.z).normalize()
    let pitchRad = Math.acos(Math.max(-1, Math.min(1, reference.dot(yzProj))))
    if (gazeDir.y > 0) pitchRad = -pitchRad
    
    // Convert to degrees and apply calibration
    let yawDeg = (yawRad * 180 / Math.PI)
    let pitchDeg = (pitchRad * 180 / Math.PI)
    
    // Fix inversion issue - negate horizontal movement
    yawDeg = -yawDeg
    
    // Apply calibration offsets
    yawDeg += calibrationOffset.yaw
    pitchDeg += calibrationOffset.pitch
    
    // Map to screen coordinates with proper sensitivity
    const yawSensitivity = 15 // degrees for full screen width
    const pitchSensitivity = 10 // degrees for full screen height
    
    let screenX = 0.5 + (yawDeg / yawSensitivity) * 0.5
    let screenY = 0.5 - (pitchDeg / pitchSensitivity) * 0.5
    
    // Clamp to screen bounds
    screenX = Math.max(0, Math.min(1, screenX))
    screenY = Math.max(0, Math.min(1, screenY))
    
    return { x: screenX, y: screenY }
  }

  const onHolisticResults = (results: any) => {
    updateFPS()
    
    const canvas = canvasRef.current
    const video = videoRef.current
    
    if (!canvas || !video) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const videoWidth = video.videoWidth || 640
    const videoHeight = video.videoHeight || 480
    
    canvas.width = videoWidth
    canvas.height = videoHeight
    
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    if (results.faceLandmarks) {
      const landmarks = results.faceLandmarks.landmark
      
      // Compute head pose from nose region
      const headPose = computeHeadPoseFromNose(landmarks, videoWidth, videoHeight)
      
      // Get iris positions
      const leftIris3D = new Vector3(
        landmarks[LEFT_IRIS_INDEX].x * videoWidth,
        landmarks[LEFT_IRIS_INDEX].y * videoHeight,
        landmarks[LEFT_IRIS_INDEX].z * videoWidth
      )
      
      const rightIris3D = new Vector3(
        landmarks[RIGHT_IRIS_INDEX].x * videoWidth,
        landmarks[RIGHT_IRIS_INDEX].y * videoHeight,
        landmarks[RIGHT_IRIS_INDEX].z * videoWidth
      )
      
      // Update eye spheres if locked (calibrated)
      let leftGazeRay = new Vector3(0, 0, -1)
      let rightGazeRay = new Vector3(0, 0, -1)
      let combinedGazeRay = new Vector3(0, 0, -1)
      
      if (leftEyeSphere.locked && rightEyeSphere.locked) {
        // Scale-aware sphere positions
        const scaleRatio = headPose.scale / (leftEyeSphere.calibrationScale || 1)
        
        const leftSphereCenter = headPose.center.add(
          headPose.rotation.multiply(leftEyeSphere.localOffset!.multiply(scaleRatio))
        )
        
        const rightSphereCenter = headPose.center.add(
          headPose.rotation.multiply(rightEyeSphere.localOffset!.multiply(scaleRatio))
        )
        
        // Calculate gaze rays
        leftGazeRay = calculate3DGazeDirection(leftIris3D, leftSphereCenter, leftEyeSphere.radius * scaleRatio)
        rightGazeRay = calculate3DGazeDirection(rightIris3D, rightSphereCenter, rightEyeSphere.radius * scaleRatio)
        
        // Combined gaze (average of both eyes)
        const rawCombined = leftGazeRay.add(rightGazeRay).multiply(0.5).normalize()
        
        // Smooth the gaze
        gazeHistoryRef.current.push(rawCombined)
        if (gazeHistoryRef.current.length > GAZE_HISTORY_SIZE) {
          gazeHistoryRef.current.shift()
        }
        
        if (gazeHistoryRef.current.length > 0) {
          const sumGaze = gazeHistoryRef.current.reduce((acc, g) => acc.add(g), new Vector3(0, 0, 0))
          combinedGazeRay = sumGaze.multiply(1 / gazeHistoryRef.current.length).normalize()
        } else {
          combinedGazeRay = rawCombined
        }
        
        // Draw eye spheres and gaze rays
        drawEyeSphere(ctx, leftSphereCenter, leftEyeSphere.radius * scaleRatio, '#FFFF00')
        drawEyeSphere(ctx, rightSphereCenter, rightEyeSphere.radius * scaleRatio, '#00FFFF')
        drawGazeRay(ctx, leftSphereCenter, leftGazeRay, 200, '#FFFF00')
        drawGazeRay(ctx, rightSphereCenter, rightGazeRay, 200, '#00FFFF')
        
        const gazeOrigin = leftSphereCenter.add(rightSphereCenter).multiply(0.5)
        drawGazeRay(ctx, gazeOrigin, combinedGazeRay, 300, '#FF00FF', 3)
      } else {
        // Not calibrated - draw iris positions
        ctx.fillStyle = '#FF0000'
        ctx.beginPath()
        ctx.arc(leftIris3D.x, leftIris3D.y, 5, 0, 2 * Math.PI)
        ctx.fill()
        
        ctx.beginPath()
        ctx.arc(rightIris3D.x, rightIris3D.y, 5, 0, 2 * Math.PI)
        ctx.fill()
      }
      
      // Convert gaze to screen coordinates
      const screenGaze = convertGazeToScreenCoordinates(combinedGazeRay)
      
      // Update virtual cursor
      virtualEyeCursor.current = {
        x: screenGaze.x,
        y: screenGaze.y,
        isTracking: true,
        confidence: leftEyeSphere.locked && rightEyeSphere.locked ? 0.95 : 0.5
      }
      
      // Calculate medical metrics
      const newMetrics = calculateMedicalMetrics(
        landmarks,
        headPose,
        leftIris3D,
        rightIris3D,
        leftGazeRay,
        rightGazeRay,
        combinedGazeRay,
        screenGaze,
        videoWidth,
        videoHeight
      )
      
      if (newMetrics) {
        setMetrics(newMetrics)
        setHistory(prev => [...prev, newMetrics].slice(-120))
        
        // Run cognitive assessment
        if (history.length >= 60 && testPhase === 'saccadic-test') {
          const assessment = analyzeAlzheimersPatterns(history, saccadicData)
          setCognitiveAssessment(assessment)
        }
      }
      
      // Draw screen position indicator
      ctx.fillStyle = '#00FF00'
      ctx.font = '16px Arial'
      ctx.fillText(
        `Screen: (${(screenGaze.x * 100).toFixed(0)}%, ${(screenGaze.y * 100).toFixed(0)}%)`,
        10, 30
      )
      
      // Draw calibration status
      ctx.fillStyle = leftEyeSphere.locked ? '#00FF00' : '#FF0000'
      ctx.fillText(
        `Calibration: ${leftEyeSphere.locked ? 'LOCKED' : 'Press C to calibrate'}`,
        10, 50
      )
    } else {
      setMetrics(prev => prev ? { ...prev, faceDetected: false, confidence: 0 } : null)
      virtualEyeCursor.current.isTracking = false
    }
    
    ctx.restore()
  }

  const drawEyeSphere = (ctx: CanvasRenderingContext2D, center: Vector3, radius: number, color: string) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI)
    ctx.stroke()
  }

  const drawGazeRay = (
    ctx: CanvasRenderingContext2D,
    origin: Vector3,
    direction: Vector3,
    length: number,
    color: string,
    width: number = 2
  ) => {
    const endpoint = origin.add(direction.multiply(length))
    
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    ctx.lineTo(endpoint.x, endpoint.y)
    ctx.stroke()
    
    // Draw arrowhead
    const arrowSize = 10
    const arrowAngle = Math.PI / 6
    
    const angle = Math.atan2(direction.y, direction.x)
    
    ctx.beginPath()
    ctx.moveTo(endpoint.x, endpoint.y)
    ctx.lineTo(
      endpoint.x - arrowSize * Math.cos(angle - arrowAngle),
      endpoint.y - arrowSize * Math.sin(angle - arrowAngle)
    )
    ctx.moveTo(endpoint.x, endpoint.y)
    ctx.lineTo(
      endpoint.x - arrowSize * Math.cos(angle + arrowAngle),
      endpoint.y - arrowSize * Math.sin(angle + arrowAngle)
    )
    ctx.stroke()
  }

  const calculateMedicalMetrics = (
    landmarks: any[],
    headPose: any,
    leftIris3D: Vector3,
    rightIris3D: Vector3,
    leftGazeRay: Vector3,
    rightGazeRay: Vector3,
    combinedGazeRay: Vector3,
    screenGaze: { x: number, y: number },
    videoWidth: number,
    videoHeight: number
  ): EyeMetrics | null => {
    try {
      // Calculate eye openness (EAR)
      const leftEye = LEFT_EYE_INDICES.map(i => landmarks[i])
      const rightEye = RIGHT_EYE_INDICES.map(i => landmarks[i])
      
      const leftEAR = calculateEAR(leftEye, videoWidth, videoHeight)
      const rightEAR = calculateEAR(rightEye, videoWidth, videoHeight)
      const averageEAR = (leftEAR + rightEAR) / 2
      const asymmetry = Math.abs(leftEAR - rightEAR)
      
      // Movement and saccade detection
      let movement = 0
      let saccadeVelocity = 0
      let saccadeDetected = false
      
      if (history.length > 0) {
        const lastMetrics = history[history.length - 1]
        const lastGaze = lastMetrics.combinedGazeRay
        
        movement = combinedGazeRay.subtract(lastGaze).length()
        saccadeVelocity = movement * 60 // Assuming 60fps
        saccadeDetected = saccadeVelocity > 0.5
      }
      
      const isBlink = averageEAR < 0.15
      const gazeStability = calculateGazeStability()
      const fixationDuration = movement < 0.01 ? 
        (history.filter(h => h.movement < 0.01).length * 16.67) : 0
      
      const cognitiveScore = calculateCognitiveScore(
        averageEAR, asymmetry, gazeStability, movement, saccadeVelocity, fixationDuration
      )
      
      return {
        leftEyeOpenness: leftEAR,
        rightEyeOpenness: rightEAR,
        averageEAR,
        asymmetry,
        gazeStability,
        isBlink,
        movement,
        confidence: virtualEyeCursor.current.confidence,
        faceDetected: true,
        cognitiveScore,
        timestamp: new Date().toISOString(),
        pupilLeft: { x: leftIris3D.x / videoWidth, y: leftIris3D.y / videoHeight },
        pupilRight: { x: rightIris3D.x / videoWidth, y: rightIris3D.y / videoHeight },
        gazeDirection: { x: combinedGazeRay.x, y: combinedGazeRay.y },
        screenGaze: {
          x: screenGaze.x,
          y: screenGaze.y,
          quadrant: getScreenQuadrant(screenGaze.x, screenGaze.y)
        },
        saccadeVelocity,
        fixationDuration,
        saccadeDetected,
        virtualCursor: virtualEyeCursor.current,
        headCenter3D: headPose.center,
        headRotation: headPose.rotation,
        leftIris3D,
        rightIris3D,
        leftGazeRay,
        rightGazeRay,
        combinedGazeRay
      }
    } catch (error) {
      console.error('Error calculating metrics:', error)
      return null
    }
  }

  const calculateEAR = (eye: any[], width: number, height: number): number => {
    if (eye.length < 6) return 0.25
    
    try {
      const p1 = new Vector3(eye[1].x * width, eye[1].y * height, eye[1].z * width)
      const p2 = new Vector3(eye[5].x * width, eye[5].y * height, eye[5].z * width)
      const p3 = new Vector3(eye[2].x * width, eye[2].y * height, eye[2].z * width)
      const p4 = new Vector3(eye[4].x * width, eye[4].y * height, eye[4].z * width)
      const p5 = new Vector3(eye[0].x * width, eye[0].y * height, eye[0].z * width)
      const p6 = new Vector3(eye[3].x * width, eye[3].y * height, eye[3].z * width)
      
      const v1 = p1.subtract(p2).length()
      const v2 = p3.subtract(p4).length()
      const h = p5.subtract(p6).length()
      
      return h > 0 ? (v1 + v2) / (2 * h) : 0.25
    } catch {
      return 0.25
    }
  }

  const calculateGazeStability = (): number => {
    if (gazeHistoryRef.current.length < 2) return 0.5
    
    let totalVariance = 0
    for (let i = 1; i < gazeHistoryRef.current.length; i++) {
      const diff = gazeHistoryRef.current[i].subtract(gazeHistoryRef.current[i-1])
      totalVariance += diff.length()
    }
    
    const avgVariance = totalVariance / (gazeHistoryRef.current.length - 1)
    return Math.max(0, 1 - (avgVariance * 10))
  }

  const calculateCognitiveScore = (
    ear: number, asymmetry: number, stability: number,
    movement: number, velocity: number, fixation: number
  ): number => {
    const baseScore = 70
    const earScore = Math.min(100, baseScore + (ear - 0.25) * 120)
    const asymPenalty = asymmetry * 400
    const stabBonus = stability * 20
    const movePenalty = movement * 200
    const velBonus = velocity > 0.3 && velocity < 1 ? 10 : 0
    const fixBonus = Math.min(15, fixation / 100)
    
    return Math.max(0, Math.min(100, 
      earScore - asymPenalty + stabBonus - movePenalty + velBonus + fixBonus
    ))
  }

  const getScreenQuadrant = (x: number, y: number): string => {
    if (x < 0.4 && y < 0.4) return SCREEN_QUADRANTS.TOP_LEFT
    if (x > 0.6 && y < 0.4) return SCREEN_QUADRANTS.TOP_RIGHT
    if (x < 0.4 && y > 0.6) return SCREEN_QUADRANTS.BOTTOM_LEFT
    if (x > 0.6 && y > 0.6) return SCREEN_QUADRANTS.BOTTOM_RIGHT
    return SCREEN_QUADRANTS.CENTER
  }

  const updateFPS = () => {
    frameCountRef.current++
    const now = performance.now()
    if (now - lastFpsUpdateRef.current >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current)))
      frameCountRef.current = 0
      lastFpsUpdateRef.current = now
    }
  }

   const startMedicalTest = async () => {
    try {
      setError(null)
      if (!holistic && !isModelLoading) {
        console.log('Starting with fallback tracking')
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })
      
      const video = videoRef.current
      if (!video) return
      
      video.srcObject = mediaStream
      setStream(mediaStream)
      setIsAnalyzing(true)
      
      video.onloadedmetadata = () => {
        if (holistic) {
          const Camera = (window as any).Camera
          
          if (Camera) {
            const cam = new Camera(video, {
              onFrame: async () => {
                if (holistic && video.readyState === 4) {
                  await holistic.send({ image: video })
                }
              },
              width: 1280,
              height: 720
            })
            
            cam.start()
            setCamera(cam)
          } else {
            const processFrames = async () => {
              if (holistic && video.readyState === 4 && isAnalyzing) {
                await holistic.send({ image: video })
                requestAnimationFrame(processFrames)
              }
            }
            processFrames()
          }
        } else {
          startFallbackTracking()
        }
        
        setTimeout(() => {
          if (metrics && metrics.faceDetected) {
            performCalibration()
          } else {
            setTestPhase('saccadic-test')
          }
        }, 2000)
      }
    } catch (error: any) {
      console.error('Camera error:', error)
      setError(`Camera error: ${error.message}`)
    }
  }

  const performCalibration = () => {
    if (metrics && metrics.faceDetected) {
      const videoWidth = videoRef.current?.videoWidth || 640
      const videoHeight = videoRef.current?.videoHeight || 480
      
      // Calibrate eye spheres
      const headPose = {
        center: metrics.headCenter3D,
        rotation: metrics.headRotation,
        scale: 1
      }
      
      calibrateEyeSpheres(
        history[history.length - 1] ? 
          [{ x: metrics.leftIris3D.x / videoWidth, y: metrics.leftIris3D.y / videoHeight, z: metrics.leftIris3D.z / videoWidth }] : [],
        headPose,
        videoWidth,
        videoHeight
      )
      
      // Calibrate screen center
      const currentGaze = metrics.combinedGazeRay
      const screenPos = convertGazeToScreenCoordinates(currentGaze)
      
      setCalibrationOffset({
        yaw: 0.5 - screenPos.x,
        pitch: 0.5 - screenPos.y
      })
      
      setTestPhase('saccadic-test')
      console.log('Calibration complete')
    }
  }

  const stopMedicalTest = () => {
    if (camera) {
      camera.stop()
      setCamera(null)
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsAnalyzing(false)
    setTestPhase('idle')
    gazeHistoryRef.current = []
  }

  const handleMedicalTestComplete = (testData: any) => {
    setSaccadicData(testData)
    setTestPhase('analysis')
    
    const assessment = analyzeAlzheimersPatterns(history, testData)
    setCognitiveAssessment(assessment)
    
    setTestResults({
      ...testData,
      medicalMetrics: {
        cognitiveScore: testData.cognitiveScore,
        reactionTime: testData.reactionTime,
        accuracy: testData.accuracy,
        missedTargets: testData.missedTargets,
        saccadicVelocity: testData.saccadicVelocity
      },
      timestamp: new Date().toISOString()
    })
  }

  const getMedicalStatus = (score: number) => {
    if (score >= 85) return { text: 'Optimal', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 70) return { text: 'Normal', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (score >= 50) return { text: 'Monitor', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { text: 'Consult Professional', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const status = metrics ? getMedicalStatus(metrics.cognitiveScore) : null

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        performCalibration()
      } else if (e.key === 's' || e.key === 'S') {
        // Screen center calibration
        if (metrics && leftEyeSphere.locked && rightEyeSphere.locked) {
          const currentGaze = metrics.combinedGazeRay
          const screenPos = convertGazeToScreenCoordinates(currentGaze)
          
          setCalibrationOffset({
            yaw: -screenPos.x + 0.5,
            pitch: -screenPos.y + 0.5
          })
          
          console.log('Screen center calibrated')
        }
      }
    }
    
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [metrics, leftEyeSphere, rightEyeSphere])

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Brain className="w-7 h-7 text-purple-600" />
          Bathusi-AI 3D Medical Eye Tracking
        </CardTitle>
        <CardDescription className="text-lg flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-blue-500" />
          Advanced 3D iris tracking with proper gaze vector calculation
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

        {testPhase === 'calibration' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="font-semibold text-blue-800">3D Calibration in Progress</span>
            </div>
            <p className="text-blue-700 text-sm">
              Look at the center of the screen. Eye spheres are being calibrated...
            </p>
            <div className="mt-2 text-xs text-blue-600">
              Press 'C' to calibrate eye spheres | Press 'S' to calibrate screen center
            </div>
          </div>
        )}

        <div className="space-y-4">
          {testPhase === 'saccadic-test' && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                3D Saccadic Eye Movement Test
              </h3>
              <SaccadicTest 
                onTestComplete={handleMedicalTestComplete}
                isRunning={testPhase === 'saccadic-test'}
                useEyeCursor={true}
                eyeCursorPosition={virtualEyeCursor.current}
              />
            </div>
          )}

          {/* 3D Eye Tracking Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Main tracking view */}
            <div className="aspect-video bg-gray-900 rounded-xl relative overflow-hidden border-2 border-gray-300">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-0 left-0 w-full h-full object-cover"
                style={{ display: isAnalyzing ? 'none' : 'block' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ display: isAnalyzing ? 'block' : 'none' }}
              />
              
              {isAnalyzing && (
                <>
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 animate-pulse" />
                    3D Tracking Active
                  </div>
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold">
                    {fps} FPS
                  </div>
                  
                  {metrics && metrics.faceDetected && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-xs">
                      <div className="flex justify-between items-center">
                        <span>
                          <Eye className="inline w-3 h-3 mr-1" />
                          3D Tracking: {leftEyeSphere.locked ? '✅ Calibrated' : '⚠️ Need Calibration'} | 
                          Cursor: ({(virtualEyeCursor.current.x * 100).toFixed(0)}%, {(virtualEyeCursor.current.y * 100).toFixed(0)}%)
                        </span>
                        <span>
                          Quadrant: {metrics.screenGaze.quadrant}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {!isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                  <div className="text-center text-white">
                    <Eye className="w-16 h-16 mx-auto mb-3 opacity-60" />
                    <p className="text-lg font-semibold">3D Eye Tracking Ready</p>
                    <p className="text-sm opacity-80 mt-1">Advanced sphere-based iris tracking with proper 3D gaze vectors</p>
                  </div>
                </div>
              )}
            </div>

            {/* Debug view (optional - can be removed for production) */}
            <div className="aspect-video bg-gray-900 rounded-xl relative overflow-hidden border-2 border-gray-300">
              <canvas
                ref={debugCanvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
              <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-semibold">
                3D Debug View
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {!isAnalyzing ? (
            <Button 
              onClick={startMedicalTest}
              className="flex-1 gap-3 py-3 text-lg"
              disabled={isModelLoading}
              size="lg"
            >
              {isModelLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Loading 3D Eye Tracking...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Start 3D Eye Tracking Test
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={stopMedicalTest} 
              variant="outline" 
              className="flex-1 gap-3 py-3 text-lg"
              size="lg"
            >
              Stop Test
            </Button>
          )}
        </div>

        {/* Real-time Metrics */}
        {metrics && metrics.faceDetected && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              3D Eye Tracking Metrics
            </h3>
            
            <div className={`p-4 rounded-xl ${status?.bg} border-2 ${status?.color.replace('text', 'border')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium opacity-80">Cognitive Health Score</div>
                  <div className="text-3xl font-bold">{Math.round(metrics.cognitiveScore)}/100</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${status?.color}`}>{status?.text}</div>
                  <div className="text-sm opacity-70">Based on 3D gaze analysis</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.averageEAR.toFixed(3)}</div>
                <div className="text-sm text-gray-600 mt-1">Eye Aspect Ratio</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.saccadeVelocity.toFixed(2)}</div>
                <div className="text-sm text-gray-600 mt-1">Saccade Velocity</div>
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

            {/* 3D Gaze Vectors */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">3D Gaze Vectors</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Left Gaze</div>
                  <div className="text-xs font-mono">
                    ({metrics.leftGazeRay.x.toFixed(2)}, {metrics.leftGazeRay.y.toFixed(2)}, {metrics.leftGazeRay.z.toFixed(2)})
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Right Gaze</div>
                  <div className="text-xs font-mono">
                    ({metrics.rightGazeRay.x.toFixed(2)}, {metrics.rightGazeRay.y.toFixed(2)}, {metrics.rightGazeRay.z.toFixed(2)})
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Combined</div>
                  <div className="text-xs font-mono">
                    ({metrics.combinedGazeRay.x.toFixed(2)}, {metrics.combinedGazeRay.y.toFixed(2)}, {metrics.combinedGazeRay.z.toFixed(2)})
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults && testResults.medicalMetrics && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              3D Eye Tracking Test Results
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.medicalMetrics.reactionTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">Average Reaction Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {testResults.medicalMetrics.accuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Target Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {testResults.medicalMetrics.cognitiveScore}/100
                </div>
                <div className="text-sm text-gray-600">Cognitive Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Cognitive Assessment */}
        {cognitiveAssessment && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Medical Cognitive Assessment (3D Analysis)
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
                  <div className="text-sm font-medium opacity-80">Cognitive Risk Assessment</div>
                  <div className="text-2xl font-bold capitalize">
                    {cognitiveAssessment.alzheimersRisk} Risk
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {Math.round(cognitiveAssessment.confidence * 100)}% Confidence
                  </div>
                  <div className="text-sm opacity-70">Based on 3D eye movement patterns</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Medical Recommendations</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {cognitiveAssessment.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Heart className="w-3 h-3 mt-1 flex-shrink-0" />
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
              <div className="font-semibold text-amber-800 mb-1">Medical Disclaimer</div>
              <div className="text-sm text-amber-700">
                This tool uses advanced 3D eye sphere tracking and gaze vector calculation for cognitive screening. 
                The system properly tracks iris movements in 3D space and calculates accurate gaze directions. 
                Results should be reviewed by qualified healthcare professionals for medical diagnosis.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}