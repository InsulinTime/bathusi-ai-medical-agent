// app/%28routes%29/dashboard/_components/SaccadicTest.tsx
"use client"
import React, { useState, useEffect, useRef } from 'react'

interface TargetPosition {
  x: number
  y: number
  timestamp: number
}

interface SaccadicTestProps {
  onTestComplete: (data: {
    saccadicLatency: number
    accuracy: number
    reactionTimes: number[]
    targetPositions: TargetPosition[]
  }) => void
  isRunning: boolean
}

export default function SaccadicTest({ onTestComplete, isRunning }: SaccadicTestProps) {
  const [currentTarget, setCurrentTarget] = useState<{x: number, y: number} | null>(null)
  const [targetHistory, setTargetHistory] = useState<TargetPosition[]>([])
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const testContainerRef = useRef<HTMLDivElement>(null)
  const targetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const testStartTimeRef = useRef<number>(0)

  // Grid positions
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

  const startTest = () => {
    setTargetHistory([])
    setReactionTimes([])
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
    if (targetHistory.length >= 12) { // 12 targets = 60 second test
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
    setTargetHistory(prev => [...prev, { ...newTarget, timestamp }])

    // Show target for 2 seconds, then move to next
    targetTimerRef.current = setTimeout(() => {
      showNextTarget()
    }, 2000)
  }

  const handleTargetClick = () => {
    if (!currentTarget) return

    const reactionTime = Date.now() - targetHistory[targetHistory.length - 1].timestamp
    setReactionTimes(prev => [...prev, reactionTime])
    
    // Move to next target immediately when clicked
    if (targetTimerRef.current) {
      clearTimeout(targetTimerRef.current)
    }
    showNextTarget()
  }

  const completeTest = () => {
    const saccadicLatency = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0
    
    const accuracy = targetHistory.length > 0 
      ? (reactionTimes.length / targetHistory.length) * 100 
      : 0

    onTestComplete({
      saccadicLatency,
      accuracy,
      reactionTimes,
      targetPositions: targetHistory
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

      {/* Moving Target */}
      {currentTarget && (
        <div
          className="absolute w-8 h-8 bg-red-500 rounded-full cursor-pointer animate-pulse shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            left: `${currentTarget.x}%`,
            top: `${currentTarget.y}%`,
            transition: 'left 0.3s ease, top 0.3s ease'
          }}
          onClick={handleTargetClick}
        >
          <div className="w-4 h-4 bg-white rounded-full"></div>
        </div>
      )}

      {/* Test Progress */}
      {isRunning && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex justify-between text-white text-sm mb-1">
            <span>Test Progress</span>
            <span>{targetHistory.length}/12 targets</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getTestProgress()}%` }}
            ></div>
          </div>
          <div className="text-white text-xs mt-2 text-center">
            Click the red dot as quickly as possible when it moves
          </div>
        </div>
      )}

      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center p-4">
            <div className="text-lg font-semibold mb-2">Saccadic Eye Movement Test</div>
            <p className="text-sm opacity-80">
              Click the red dot as quickly as possible when it appears.<br />
              This measures your eye movement speed and accuracy.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}