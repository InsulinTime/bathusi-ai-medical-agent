//this file is app/%28routes%29/dashboard/_components/HandwritingTest.tsx
"use client"
import React, { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, Gauge, Zap } from "lucide-react"

export type Point = { x: number; y: number; t: number; v?: number; a?: number; j?: number }
export type Stroke = { points: Point[]; startsAt: number; endsAt?: number }

interface LiveMetrics {
  velocity: number
  acceleration: number
  jerk: number
  smoothness: number
  strokeCount: number
  inAirTime: number
  totalTime: number
  tremor: boolean
}

function nowMs() {
  return performance.now()
}

export default function HandwritingTest({
  width = 900,
  height = 420,
  taskName = "free-draw",
  onAnalysis,
}: {
  width?: number
  height?: number
  taskName?: string
  onAnalysis?: (r: any) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const metricsCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const metricsCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  
  const strokesRef = useRef<Stroke[]>([])
  const currentStrokeRef = useRef<Stroke | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const lastPointRef = useRef<Point | null>(null)
  const lastVelocityRef = useRef<number>(0)
  const lastAccelRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  
  const [status, setStatus] = useState<"idle" | "drawing" | "analyzing" | "done">("idle")
  
  // Live metrics state - updates in real-time
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    velocity: 0,
    acceleration: 0,
    jerk: 0,
    smoothness: 100,
    strokeCount: 0,
    inAirTime: 0,
    totalTime: 0,
    tremor: false
  })
  
  // History for graphs
  const velocityHistoryRef = useRef<number[]>([])
  const jerkHistoryRef = useRef<number[]>([])
  const HISTORY_SIZE = 100

  // Initialize canvases
  useEffect(() => {
    // Main drawing canvas
    const c = canvasRef.current!
    const DPR = Math.max(1, window.devicePixelRatio || 1)
    c.width = Math.round(width * DPR)
    c.height = Math.round(height * DPR)
    c.style.width = `${width}px`
    c.style.height = `${height}px`
    
    const ctx = c.getContext("2d")!
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = 2.4
    ctx.strokeStyle = "#0b1220"
    ctx.fillStyle = "#fff"
    ctx.clearRect(0, 0, width, height)
    ctx.fillRect(0, 0, width, height)
    ctxRef.current = ctx
    
    // Metrics visualization canvas
    const mc = metricsCanvasRef.current!
    mc.width = 300 * DPR
    mc.height = 150 * DPR
    mc.style.width = "300px"
    mc.style.height = "150px"
    
    const mctx = mc.getContext("2d")!
    mctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    metricsCtxRef.current = mctx
    
    // Draw task guide
    drawTaskGuide()
  }, [width, height])

  const drawTaskGuide = () => {
    const ctx = ctxRef.current!
    ctx.save()
    ctx.strokeStyle = "#e0e0e0"
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    
    switch(taskName) {
      case "spiral-copy":
        // Draw spiral guide
        ctx.beginPath()
        const cx = width / 2, cy = height / 2
        for (let t = 0; t < 4 * Math.PI; t += 0.1) {
          const r = 8 * t
          const x = cx + r * Math.cos(t)
          const y = cy + r * Math.sin(t)
          if (t === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        break
        
      case "wave-trace":
        // Draw wave guide
        ctx.beginPath()
        for (let x = 50; x < width - 50; x += 2) {
          const y = height / 2 + 60 * Math.sin((x - 50) * 0.015)
          if (x === 50) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        break
        
      case "sentence":
        // Draw writing lines
        for (let i = 0; i < 4; i++) {
          const y = 100 + i * 80
          ctx.beginPath()
          ctx.moveTo(50, y)
          ctx.lineTo(width - 50, y)
          ctx.stroke()
        }
        // Add text prompt
        ctx.setLineDash([])
        ctx.fillStyle = "#999"
        ctx.font = "14px sans-serif"
        ctx.fillText("Write: 'The quick brown fox jumps over the lazy dog'", 50, 80)
        break
    }
    
    ctx.restore()
  }

  // Real-time metrics update loop
  const updateLiveMetrics = useCallback(() => {
    if (!startTimeRef.current) return
    
    const now = nowMs()
    const totalTime = now - startTimeRef.current
    
    let inAirTime = 0
    const strokes = strokesRef.current
    for (let i = 0; i < strokes.length - 1; i++) {
      const endTime = strokes[i].endsAt ?? strokes[i].points[strokes[i].points.length - 1].t
      if (endTime && strokes[i + 1].startsAt) {
        inAirTime += strokes[i + 1].startsAt - endTime
      }
    }
    
    setLiveMetrics(prev => ({
      ...prev,
      strokeCount: strokes.length,
      inAirTime: inAirTime,
      totalTime: totalTime
    }))
    
    // Draw velocity graph
    drawMetricsGraph()
    
    if (isDrawing) {
      animationFrameRef.current = requestAnimationFrame(updateLiveMetrics)
    }
  }, [isDrawing])

  useEffect(() => {
    if (isDrawing) {
      updateLiveMetrics()
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isDrawing, updateLiveMetrics])

  const drawMetricsGraph = () => {
    const ctx = metricsCtxRef.current!
    const w = 300, h = 150
    
    // Clear
    ctx.fillStyle = "#f8f8f8"
    ctx.fillRect(0, 0, w, h)
    
    // Draw grid
    ctx.strokeStyle = "#e0e0e0"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 5; i++) {
      const y = (h / 5) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    
    // Draw velocity history
    if (velocityHistoryRef.current.length > 1) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.beginPath()
      
      const maxV = Math.max(...velocityHistoryRef.current, 1000)
      velocityHistoryRef.current.forEach((v, i) => {
        const x = (i / HISTORY_SIZE) * w
        const y = h - (v / maxV) * h * 0.8 - 10
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
    
    // Draw jerk history
    if (jerkHistoryRef.current.length > 1) {
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 1
      ctx.beginPath()
      
      const maxJ = Math.max(...jerkHistoryRef.current.map(Math.abs), 5000)
      jerkHistoryRef.current.forEach((j, i) => {
        const x = (i / HISTORY_SIZE) * w
        const y = h - (Math.abs(j) / maxJ) * h * 0.5 - 10
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
    
    // Labels
    ctx.fillStyle = "#666"
    ctx.font = "10px sans-serif"
    ctx.fillText("Velocity", 5, 15)
    ctx.fillText("Jerk", 5, 30)
  }

  // Get canvas position
  function getCanvasPos(evt: PointerEvent | React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const clientX = "clientX" in evt ? evt.clientX : (evt as any).x
    const clientY = "clientY" in evt ? evt.clientY : (evt as any).y
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  // Calculate real-time kinematics
  function calculateKinematics(currentPoint: Point, lastPoint: Point | null): { v: number; a: number; j: number } {
    if (!lastPoint) {
      return { v: 0, a: 0, j: 0 }
    }
    
    // Calculate velocity (speed = distance / time)
    const dx = currentPoint.x - lastPoint.x
    const dy = currentPoint.y - lastPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const dt = Math.max((currentPoint.t - lastPoint.t) / 1000, 0.001) // Convert to seconds, prevent division by zero
    const velocity = distance / dt // pixels per second
    
    // Calculate acceleration (accel = (speed_now - speed_prev) / delta_time)
    const lastV = lastVelocityRef.current
    const acceleration = (velocity - lastV) / dt // pixels per second squared
    
    // Calculate jerk (jerk = (accel_now - accel_prev) / delta_time)
    const lastA = lastAccelRef.current
    const jerk = (acceleration - lastA) / dt // pixels per second cubed
    
    // Update references
    lastVelocityRef.current = velocity
    lastAccelRef.current = acceleration
    
    // Add to history
    velocityHistoryRef.current.push(velocity)
    if (velocityHistoryRef.current.length > HISTORY_SIZE) {
      velocityHistoryRef.current.shift()
    }
    
    jerkHistoryRef.current.push(jerk)
    if (jerkHistoryRef.current.length > HISTORY_SIZE) {
      jerkHistoryRef.current.shift()
    }
    
    // Detect tremor (high frequency oscillation)
    const tremor = detectTremor()
    
    // Calculate smoothness (lower jerk = smoother)
    const smoothness = Math.max(0, 100 - Math.min(Math.abs(jerk) / 50, 100))
    
    // Update live metrics
    setLiveMetrics(prev => ({
      ...prev,
      velocity: Math.round(velocity),
      acceleration: Math.round(acceleration),
      jerk: Math.round(jerk),
      smoothness: Math.round(smoothness),
      tremor
    }))
    
    return { v: velocity, a: acceleration, j: jerk }
  }

  function detectTremor(): boolean {
    // Simple tremor detection: look for rapid oscillations in velocity
    if (velocityHistoryRef.current.length < 10) return false
    
    const recent = velocityHistoryRef.current.slice(-10)
    let directionChanges = 0
    
    for (let i = 1; i < recent.length; i++) {
      if ((recent[i] - recent[i-1]) * (recent[i-1] - (recent[i-2] || 0)) < 0) {
        directionChanges++
      }
    }
    
    return directionChanges > 4 // More than 4 direction changes in 10 samples
  }

  // Pointer event handlers
  function startStroke(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId)
    const now = nowMs()
    if (!startTimeRef.current) startTimeRef.current = now
    setIsDrawing(true)
    setStatus("drawing")
    
    const pos = getCanvasPos(e)
    const point: Point = { x: pos.x, y: pos.y, t: now }
    
    const stroke: Stroke = { points: [point], startsAt: now }
    currentStrokeRef.current = stroke
    strokesRef.current.push(stroke)
    lastPointRef.current = point
    
    // Reset velocity tracking
    lastVelocityRef.current = 0
    lastAccelRef.current = 0
    
    // Draw initial dot
    const ctx = ctxRef.current!
    ctx.strokeStyle = "#0b1220"
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineTo(pos.x + 0.001, pos.y + 0.001)
    ctx.stroke()
  }

  function moveStroke(e: React.PointerEvent) {
    if (!isDrawing || !currentStrokeRef.current) return
    
    const now = nowMs()
    const pos = getCanvasPos(e)
    const stroke = currentStrokeRef.current
    const last = lastPointRef.current
    
    // Only record if moved enough (reduces noise)
    if (last) {
      const dx = pos.x - last.x
      const dy = pos.y - last.y
      if (Math.hypot(dx, dy) < 0.5) return
    }
    
    const point: Point = { x: pos.x, y: pos.y, t: now }
    
    // Calculate kinematics for this point
    const kinematics = calculateKinematics(point, last)
    point.v = kinematics.v
    point.a = kinematics.a
    point.j = kinematics.j
    
    stroke.points.push(point)
    lastPointRef.current = point
    
    // Draw line
    const ctx = ctxRef.current!
    
    // Vary line properties based on velocity (optional visual feedback)
    const velocityNorm = Math.min(kinematics.v / 500, 1)
    ctx.strokeStyle = `rgba(11, 18, 32, ${0.3 + velocityNorm * 0.7})`
    ctx.lineWidth = 2 + velocityNorm * 2
    
    ctx.beginPath()
    ctx.moveTo(last!.x, last!.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }

  function endStroke(e: React.PointerEvent) {
    const now = nowMs()
    setIsDrawing(false)
    setStatus("idle")
    
    if (currentStrokeRef.current) {
      currentStrokeRef.current.endsAt = now
      currentStrokeRef.current = null
    }
    
    lastPointRef.current = null
    
    try {
      (e.target as Element).releasePointerCapture((e as React.PointerEvent).pointerId)
    } catch (err) {}
  }

  // Clear everything
  function clearAll() {
    const ctx = ctxRef.current!
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, width, height)
    drawTaskGuide()
    
    strokesRef.current = []
    currentStrokeRef.current = null
    startTimeRef.current = null
    lastPointRef.current = null
    velocityHistoryRef.current = []
    jerkHistoryRef.current = []
    
    setStatus("idle")
    setLiveMetrics({
      velocity: 0,
      acceleration: 0,
      jerk: 0,
      smoothness: 100,
      strokeCount: 0,
      inAirTime: 0,
      totalTime: 0,
      tremor: false
    })
  }

  // Compute full session features for analysis
  function computeSessionFeatures() {
    const strokes = strokesRef.current
    const numStrokes = strokes.length
    
    if (numStrokes === 0) return null
    
    const totalTime = startTimeRef.current ? 
      ((strokes[strokes.length - 1].endsAt ?? nowMs()) - startTimeRef.current) : 0
    
    // Calculate in-air time and movements
    let inAirTime = 0, inAirMoves = 0
    for (let i = 0; i < strokes.length - 1; i++) {
      const end = strokes[i].endsAt ?? strokes[i].points[strokes[i].points.length - 1].t
      const next = strokes[i + 1].startsAt
      const gap = next - end
      if (gap > 1) {
        inAirTime += gap
        inAirMoves++
      }
    }
    
    // Compute stroke-level kinematics
    const strokeKinematics = strokes.map(s => computeStrokeKinematics(s.points)).filter(Boolean)
    
    // Aggregate metrics
    const avgMeanVel = strokeKinematics.length ? 
      strokeKinematics.reduce((s: any, v: any) => s + v.meanVelocity, 0) / strokeKinematics.length : 0
    const avgJerk = strokeKinematics.length ?
      strokeKinematics.reduce((s: any, v: any) => s + v.meanJerk, 0) / strokeKinematics.length : 0
    const avgBboxW = strokeKinematics.length ?
      strokeKinematics.reduce((s: any, v: any) => s + v.bboxW, 0) / strokeKinematics.length : 0
    const avgBboxH = strokeKinematics.length ?
      strokeKinematics.reduce((s: any, v: any) => s + v.bboxH, 0) / strokeKinematics.length : 0
    
    return {
      taskName,
      numStrokes,
      totalTimeMs: totalTime,
      inAirTimeMs: inAirTime,
      inAirMoves,
      avgMeanVelocity: avgMeanVel,
      avgJerk,
      avgBboxW,
      avgBboxH,
      strokeKinematics,
      rawStrokes: strokes,
      device: navigator.userAgent,
      width,
      height,
    }
  }

  // Compute kinematics for a complete stroke
  function computeStrokeKinematics(points: Point[]) {
    if (!points || points.length < 2) return null
    
    const velocities: number[] = []
    const accels: number[] = []
    const jerks: number[] = []
    let length = 0
    
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1], p1 = points[i]
      const dx = p1.x - p0.x, dy = p1.y - p0.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const dt = Math.max((p1.t - p0.t) / 1000, 0.001)
      const v = dist / dt
      velocities.push(v)
      length += dist
      
      if (i >= 2) {
        const p_1 = points[i - 2]
        const dt2 = Math.max((p1.t - p_1.t) / 1000, 0.001)
        const vprev = Math.sqrt((p0.x - p_1.x) ** 2 + (p0.y - p_1.y) ** 2) / dt2
        const a = (v - vprev) / dt2
        accels.push(a)
        
        if (accels.length >= 2) {
          const aprev = accels[accels.length - 2]
          const j = (a - aprev) / dt2
          jerks.push(Math.abs(j))
        }
      }
    }
    
    const meanV = velocities.reduce((s, x) => s + x, 0) / velocities.length
    const maxV = Math.max(...velocities)
    const meanA = accels.length ? accels.reduce((s, x) => s + x, 0) / accels.length : 0
    const meanJ = jerks.length ? jerks.reduce((s, x) => s + x, 0) / jerks.length : 0
    
    // Bounding box and slant
    const xs = points.map(p => p.x), ys = points.map(p => p.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const bboxW = maxX - minX, bboxH = maxY - minY
    
    // Slant via linear regression
    const n = points.length
    const meanX = xs.reduce((s, x) => s + x, 0) / n
    const meanY = ys.reduce((s, y) => s + y, 0) / n
    let cov = 0, varX = 0
    for (let i = 0; i < n; i++) {
      cov += (xs[i] - meanX) * (ys[i] - meanY)
      varX += (xs[i] - meanX) ** 2
    }
    const slope = varX ? cov / varX : 0
    const slantDeg = Math.atan(slope) * (180 / Math.PI)
    
    return {
      lengthPx: length,
      meanVelocity: meanV,
      maxVelocity: maxV,
      meanAccel: meanA,
      meanJerk: meanJ,
      bboxW,
      bboxH,
      slantDeg,
      pointCount: points.length,
      durationMs: points[points.length - 1].t - points[0].t,
    }
  }

  // Send to backend for analysis
  async function sendAnalysis() {
    const features = computeSessionFeatures()
    if (!features) {
      alert("No drawing data to analyze")
      return
    }
    
    setStatus("analyzing")
    
    try {
      const res = await fetch("/api/analyze-strokes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
      })
      const json = await res.json()
      setStatus("done")
      if (onAnalysis) onAnalysis(json)
      return json
    } catch (err) {
      console.error(err)
      setStatus("idle")
      return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Live Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Velocity</p>
              <p className="text-xl font-bold font-mono">{liveMetrics.velocity}</p>
              <p className="text-xs text-gray-400">px/s</p>
            </div>
            <Gauge className="w-8 h-8 text-blue-500" />
          </div>
          <Progress 
            value={Math.min((liveMetrics.velocity / 800) * 100, 100)} 
            className="mt-2 h-1"
          />
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Acceleration</p>
              <p className="text-xl font-bold font-mono">{liveMetrics.acceleration}</p>
              <p className="text-xs text-gray-400">px/s²</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
          <Progress 
            value={Math.min(Math.abs(liveMetrics.acceleration / 2000) * 100, 100)} 
            className="mt-2 h-1"
          />
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Jerk</p>
              <p className="text-xl font-bold font-mono">{Math.abs(liveMetrics.jerk)}</p>
              <p className="text-xs text-gray-400">px/s³</p>
            </div>
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
          <Progress 
            value={Math.min((Math.abs(liveMetrics.jerk) / 10000) * 100, 100)} 
            className="mt-2 h-1"
          />
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Smoothness</p>
              <p className="text-xl font-bold">{liveMetrics.smoothness}%</p>
              {liveMetrics.tremor && (
                <Badge variant="destructive" className="text-xs mt-1">Tremor</Badge>
              )}
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
          <Progress 
            value={liveMetrics.smoothness} 
            className="mt-2 h-1"
          />
        </Card>
      </div>
      
      {/* Canvas and Graph Side by Side */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              onPointerDown={startStroke}
              onPointerMove={moveStroke}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              className="touch-none block cursor-crosshair"
              style={{ width: `${width}px`, height: `${height}px` }}
            />
          </div>
        </div>
        
        <div className="w-[300px]">
          <Card className="p-3">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-sm">Live Kinematics Graph</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <canvas
                ref={metricsCanvasRef}
                className="w-full border border-gray-200 rounded"
                style={{ height: "150px" }}
              />
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-blue-500">— Velocity</span>
                <span className="text-red-500">— Jerk</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-3 mt-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Strokes:</span>
                <span className="font-mono font-bold">{liveMetrics.strokeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Time:</span>
                <span className="font-mono">{(liveMetrics.totalTime / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">In-Air Time:</span>
                <span className="font-mono">{(liveMetrics.inAirTime / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex gap-3 items-center">
        <button 
          onClick={clearAll}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Clear
        </button>
        <button 
          onClick={sendAnalysis} 
          disabled={status === "analyzing" || strokesRef.current.length === 0}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {status === "analyzing" ? "Analyzing..." : "Analyze"}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          <Badge variant={status === "drawing" ? "default" : "secondary"}>
            {status}
          </Badge>
        </div>
        <div className="ml-auto text-sm text-gray-500">
          Task: <span className="font-medium">{taskName}</span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        💡 Tip: Watch the real-time metrics above as you draw. Smooth movements = lower jerk values.
        Normal velocity range: 100-500 px/s. High jerk (&gt;5000) indicates tremor or instability.
      </div>
    </div>
  )
}