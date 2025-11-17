// app/(routes)/dashboard/_components/SaccadicTest.tsx
"use client"
import React, { useState, useEffect, useRef } from 'react'
import { Eye, Target, MousePointer } from 'lucide-react'

interface TargetPosition {
  x: number
  y: number
  timestamp: number
  hit?: boolean
}

interface SaccadicTestProps {
  onTestComplete: (data: {
    saccadicLatency: number
    accuracy: number
    reactionTimes: number[]
    targetPositions: TargetPosition[]
    eyeCursorHits?: number
  }) => void
  isRunning: boolean
  useEyeCursor?: boolean
  eyeCursorPosition?: { x: number; y: number }
}

export default function SaccadicTest({ 
  onTestComplete, 
  isRunning, 
  useEyeCursor = false,
  eyeCursorPosition = { x: 0.5, y: 0.5 }
}: SaccadicTestProps) {
  const [currentTarget, setCurrentTarget] = useState<{x: number, y: number} | null>(null)
  const [targetHistory, setTargetHistory] = useState<TargetPosition[]>([])
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [eyeCursorHits, setEyeCursorHits] = useState<number>(0)
  const [showHitFeedback, setShowHitFeedback] = useState(false)
  const testContainerRef = useRef<HTMLDivElement>(null)
  const targetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const testStartTimeRef = useRef<number>(0)
  const lastHitTimeRef = useRef<number>(0)

  // Grid positions for targets
  const gridPositions = [
    { x: 20, y: 20, label: 'A1' }, { x: 50, y: 20, label: 'B1' }, { x: 80, y: 20, label: 'C1' },
    { x: 20, y: 50, label: 'A2' }, { x: 50, y: 50, label: 'B2' }, { x: 80, y: 50, label: 'C2' },
    { x: 20, y: 80, label: 'A3' }, { x: 50, y: 80, label: 'B3' }, { x: 80, y: 80, label: 'C3' }
  ]

  useEffect(() => {
    if (isRunning) {
      startTest()
    } else {
      stopTest()
    }

    return () => {
      stopTest()
    }
  }, [isRunning])

  // Check for eye cursor hits when using eye tracking
  useEffect(() => {
    if (useEyeCursor && currentTarget && eyeCursorPosition) {
      checkEyeCursorHit()
    }
  }, [eyeCursorPosition, currentTarget, useEyeCursor])

  const checkEyeCursorHit = () => {
    if (!currentTarget || !eyeCursorPosition) return

    const distance = Math.sqrt(
      Math.pow((eyeCursorPosition.x * 100) - currentTarget.x, 2) + 
      Math.pow((eyeCursorPosition.y * 100) - currentTarget.y, 2)
    )

    // Check if eye cursor is within hit radius (adjusted for percentage coordinates)
    if (distance < 8) { // 8% radius for hit detection
      const now = Date.now()
      
      // Prevent multiple hits for same target (debounce)
      if (now - lastHitTimeRef.current > 500) {
        handleTargetHit()
        lastHitTimeRef.current = now
      }
    }
  }

  const handleTargetHit = () => {
    if (!currentTarget) return

    const reactionTime = Date.now() - targetHistory[targetHistory.length - 1].timestamp
    setReactionTimes(prev => [...prev, reactionTime])
    
    if (useEyeCursor) {
      setEyeCursorHits(prev => prev + 1)
      setShowHitFeedback(true)
      setTimeout(() => setShowHitFeedback(false), 300)
    }
    
    // Update target history with hit status
    setTargetHistory(prev => {
      const updated = [...prev]
      if (updated.length > 0) {
        updated[updated.length - 1].hit = true
      }
      return updated
    })
    
    // Move to next target immediately when hit
    if (targetTimerRef.current) {
      clearTimeout(targetTimerRef.current)
    }
    showNextTarget()
  }

  const startTest = () => {
    setTargetHistory([])
    setReactionTimes([])
    setEyeCursorHits(0)
    testStartTimeRef.current = Date.now()
    showNextTarget()
  }

  const stopTest = () => {
    if (targetTimerRef.current) {
      clearTimeout(targetTimerRef.current)
    }
    setCurrentTarget(null)
  }

  const showNextTarget = () => {
    if (targetHistory.length >= 12) { // 12 targets for complete test
      completeTest()
      return
    }

    // Randomly select next target (avoid same position twice)
    let newTarget
    do {
      newTarget = gridPositions[Math.floor(Math.random() * gridPositions.length)]
    } while (currentTarget && newTarget.x === currentTarget.x && newTarget.y === currentTarget.y)

    setCurrentTarget(newTarget)
    
    const timestamp = Date.now()
    setTargetHistory(prev => [...prev, { ...newTarget, timestamp, hit: false }])

    // Auto-advance after timeout if no hit
    targetTimerRef.current = setTimeout(() => {
      showNextTarget()
    }, 3000) // 3 seconds per target
  }

  const handleTargetClick = () => {
    if (!useEyeCursor) {
      handleTargetHit()
    }
  }

  const completeTest = () => {
    const saccadicLatency = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0
    
    const accuracy = targetHistory.length > 0 
      ? (targetHistory.filter(t => t.hit).length / targetHistory.length) * 100 
      : 0

    onTestComplete({
      saccadicLatency,
      accuracy,
      reactionTimes,
      targetPositions: targetHistory,
      eyeCursorHits: useEyeCursor ? eyeCursorHits : undefined
    })
  }

  const getTestProgress = () => {
    return Math.min(100, (targetHistory.length / 12) * 100)
  }

  return (
    <div className="w-full h-64 bg-gray-900 rounded-lg relative overflow-hidden border-2 border-blue-500">
      {/* Grid Background */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-4 p-4 opacity-20">
        {gridPositions.map((pos, index) => (
          <div key={index} className="border border-blue-300 rounded flex items-center justify-center">
            <span className="text-blue-300 text-xs">{pos.label}</span>
          </div>
        ))}
      </div>

      {/* Eye Cursor Indicator */}
      {useEyeCursor && isRunning && (
        <div
          className="absolute w-6 h-6 pointer-events-none z-20"
          style={{
            left: `${eyeCursorPosition.x * 100}%`,
            top: `${eyeCursorPosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.1s ease'
          }}
        >
          <MousePointer className="w-6 h-6 text-cyan-400 drop-shadow-lg" />
          {showHitFeedback && (
            <div className="absolute inset-0 animate-ping">
              <Target className="w-8 h-8 text-green-400" />
            </div>
          )}
        </div>
      )}

      {/* Moving Target */}
      {currentTarget && (
        <div
          className={`absolute w-10 h-10 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 ${
            useEyeCursor ? 'bg-red-500' : 'bg-red-500 hover:bg-red-400'
          }`}
          style={{
            left: `${currentTarget.x}%`,
            top: `${currentTarget.y}%`,
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
          }}
          onClick={handleTargetClick}
        >
          <div className="w-6 h-6 bg-white rounded-full animate-pulse"></div>
          {useEyeCursor && (
            <div className="absolute inset-0 border-2 border-red-300 rounded-full animate-ping"></div>
          )}
        </div>
      )}

      {/* Test Progress and Stats */}
      {isRunning && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex justify-between text-white text-sm mb-1">
            <span className="flex items-center gap-2">
              {useEyeCursor ? (
                <>
                  <Eye className="w-4 h-4" />
                  Eye Cursor Mode
                </>
              ) : (
                'Test Progress'
              )}
            </span>
            <span className="flex items-center gap-3">
              {useEyeCursor && (
                <span className="text-green-400">
                  Hits: {eyeCursorHits}
                </span>
              )}
              <span>{targetHistory.length}/12 targets</span>
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getTestProgress()}%` }}
            ></div>
          </div>
          <div className="text-white text-xs mt-2 text-center">
            {useEyeCursor ? (
              <span className="flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" />
                Look at the red dot to register a hit - no clicking needed!
              </span>
            ) : (
              'Click the red dot as quickly as possible when it moves'
            )}
          </div>
        </div>
      )}

      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center p-4">
            <div className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              <Target className="w-5 h-5" />
              Saccadic Eye Movement Test
            </div>
            <p className="text-sm opacity-80">
              {useEyeCursor ? (
                <>
                  Control the cursor with your eyes!<br />
                  Look directly at targets to hit them.<br />
                  This measures eye movement precision and speed.
                </>
              ) : (
                <>
                  Click the red dot as quickly as possible when it appears.<br />
                  This measures your eye movement speed and accuracy.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}