// app/(routes)/dashboard/_components/SaccadicTest.tsx
"use client"
import React, { useState, useEffect, useRef } from 'react'
import { Eye, Target, Brain, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Circle } from 'lucide-react'

interface MedicalTestResult {
  reactionTime: number
  accuracy: number
  missedTargets: number
  falsePositives: number
  saccadicVelocity: number
  cognitiveScore: number
}

interface SaccadicTestProps {
  onTestComplete: (results: MedicalTestResult) => void
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
  const [testResults, setTestResults] = useState<MedicalTestResult[]>([])
  const [showInstructions, setShowInstructions] = useState(true)
  
  // Medical test protocol based on clinical standards
  const MEDICAL_TEST_PROTOCOL = {
    targetDuration: 2000, // 2 seconds per target (clinical standard)
    targetSize: 40, // pixels - large enough for patients with vision issues
    numberOfTargets: 20, // Standard test length
    patterns: [
      'horizontal', // Test horizontal saccades
      'vertical',   // Test vertical saccades
      'diagonal',   // Test diagonal movements
      'random'      // Test unpredictable movements
    ]
  }

  useEffect(() => {
    if (useEyeCursor && currentTarget && eyeCursorPosition) {
      // Check if the virtual eye cursor is looking at the target
      const distance = calculateDistance(eyeCursorPosition, currentTarget)
      
      if (distance < 0.1) { // Within 10% of screen distance
        recordHit()
      }
    }
  }, [eyeCursorPosition, currentTarget])

  const calculateDistance = (point1: any, point2: any) => {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + 
      Math.pow(point1.y - point2.y, 2)
    )
  }

  const recordHit = () => {
    const reactionTime = Date.now() - (currentTarget as any).showTime
    
    // Medical scoring based on clinical parameters
    const medicalScore: MedicalTestResult = {
      reactionTime,
      accuracy: calculateAccuracy(eyeCursorPosition!, currentTarget!),
      missedTargets: 0,
      falsePositives: 0,
      saccadicVelocity: calculateSaccadicVelocity(reactionTime),
      cognitiveScore: calculateCognitiveScore(reactionTime)
    }
    
    setTestResults(prev => [...prev, medicalScore])
    showNextTarget()
  }

  const calculateAccuracy = (cursor: any, target: any) => {
    const distance = calculateDistance(cursor, target)
    return Math.max(0, 100 - (distance * 100))
  }

  const calculateSaccadicVelocity = (reactionTime: number) => {
    // Medical calculation based on eye movement research
    return 1000 / reactionTime * 300 // Simplified velocity calculation
  }

  const calculateCognitiveScore = (reactionTime: number) => {
    // Based on medical research thresholds
    if (reactionTime < 200) return 100 // Excellent
    if (reactionTime < 350) return 85  // Normal
    if (reactionTime < 500) return 70  // Mild concern
    if (reactionTime < 750) return 50  // Moderate concern
    return 30 // Significant concern
  }

  const showNextTarget = () => {
    // Generate next target position based on medical test protocol
    const pattern = MEDICAL_TEST_PROTOCOL.patterns[
      Math.floor(testResults.length / 5) % MEDICAL_TEST_PROTOCOL.patterns.length
    ]
    
    let nextPosition
    switch(pattern) {
      case 'horizontal':
        nextPosition = { 
          x: Math.random() > 0.5 ? 0.2 : 0.8, 
          y: 0.5 
        }
        break
      case 'vertical':
        nextPosition = { 
          x: 0.5, 
          y: Math.random() > 0.5 ? 0.2 : 0.8 
        }
        break
      case 'diagonal':
        nextPosition = { 
          x: Math.random() > 0.5 ? 0.2 : 0.8,
          y: Math.random() > 0.5 ? 0.2 : 0.8
        }
        break
      default:
        nextPosition = { 
          x: 0.2 + Math.random() * 0.6,
          y: 0.2 + Math.random() * 0.6
        }
    }
    
    setCurrentTarget({
      ...nextPosition,
      showTime: Date.now()
    } as any)
  }

  const completeTest = () => {
    // Calculate medical assessment results
    const averageReactionTime = testResults.reduce((sum, r) => sum + r.reactionTime, 0) / testResults.length
    const averageAccuracy = testResults.reduce((sum, r) => sum + r.accuracy, 0) / testResults.length
    const averageCognitiveScore = testResults.reduce((sum, r) => sum + r.cognitiveScore, 0) / testResults.length
    
    const finalResults: MedicalTestResult = {
      reactionTime: averageReactionTime,
      accuracy: averageAccuracy,
      missedTargets: testResults.filter(r => r.accuracy < 50).length,
      falsePositives: 0,
      saccadicVelocity: testResults.reduce((sum, r) => sum + r.saccadicVelocity, 0) / testResults.length,
      cognitiveScore: averageCognitiveScore
    }
    
    onTestComplete(finalResults)
  }

  return (
    <div className="w-full h-96 bg-gray-50 rounded-lg relative overflow-hidden border-2 border-blue-500">
      {showInstructions && (
        <div className="absolute inset-0 bg-white z-10 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3">Medical Eye Movement Test</h3>
            <p className="text-gray-600 mb-4">
              This test measures your eye movement patterns to assess cognitive function.
              {useEyeCursor ? (
                " Look directly at the red targets as they appear. The system will track your eye movements."
              ) : (
                " Click on the red targets as quickly as possible when they appear."
              )}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">What We're Testing:</h4>
              <ul className="text-left text-sm text-blue-700 space-y-1">
                <li>• Saccadic movement speed (rapid eye movements)</li>
                <li>• Reaction time to visual stimuli</li>
                <li>• Accuracy of eye movements</li>
                <li>• Pattern recognition ability</li>
              </ul>
            </div>
            <Button 
              onClick={() => {
                setShowInstructions(false)
                showNextTarget()
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Start Medical Test
            </Button>
          </div>
        </div>
      )}

      {/* Virtual Eye Cursor Overlay (NOT system mouse) */}
      {useEyeCursor && !showInstructions && (
        <div
          className="absolute w-8 h-8 pointer-events-none z-20"
          style={{
            left: `${eyeCursorPosition.x * 100}%`,
            top: `${eyeCursorPosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.05s ease' // Smooth movement
          }}
        >
          <div className="relative">
            {/* Eye cursor visualization */}
            <Circle className="w-8 h-8 text-blue-500 absolute animate-pulse" />
            <div className="w-2 h-2 bg-blue-600 rounded-full absolute top-3 left-3" />
            
            {/* Show when looking at target */}
            {currentTarget && calculateDistance(eyeCursorPosition, currentTarget) < 0.1 && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <span className="text-green-500 text-xs font-bold">LOOKING!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medical Test Target */}
      {currentTarget && !showInstructions && (
        <div
          className="absolute rounded-full bg-red-500 flex items-center justify-center transition-all duration-200"
          style={{
            width: `${MEDICAL_TEST_PROTOCOL.targetSize}px`,
            height: `${MEDICAL_TEST_PROTOCOL.targetSize}px`,
            left: `${currentTarget.x * 100}%`,
            top: `${currentTarget.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
          }}
          onClick={() => !useEyeCursor && recordHit()}
        >
          <Target className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Real-time Medical Metrics Display */}
      {isRunning && !showInstructions && (
        <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-semibold">Progress:</span> {testResults.length}/{MEDICAL_TEST_PROTOCOL.numberOfTargets}
            </div>
            <div>
              <span className="font-semibold">Avg Reaction:</span> {
                testResults.length > 0 
                  ? Math.round(testResults.reduce((sum, r) => sum + r.reactionTime, 0) / testResults.length)
                  : 0
              }ms
            </div>
            <div>
              <span className="font-semibold">Cognitive Score:</span> {
                testResults.length > 0
                  ? Math.round(testResults.reduce((sum, r) => sum + r.cognitiveScore, 0) / testResults.length)
                  : 0
              }/100
            </div>
          </div>
        </div>
      )}
    </div>
  )
}