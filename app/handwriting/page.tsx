// app/handwriting/page.tsx
"use client"
import { useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, FileText, Activity } from "lucide-react"

// Import the HandwritingTest component dynamically to avoid SSR issues
const HandwritingTest = dynamic(
  () => import("@/app/(routes)/dashboard/_components/HandwritingTest"),
  { ssr: false }
)

export default function HandwritingPage() {
  const [report, setReport] = useState<any>(null)
  const [selectedTask, setSelectedTask] = useState("spiral-copy")
  
  const tasks = [
    { id: "spiral-copy", name: "Spiral Drawing", icon: "🌀" },
    { id: "wave-trace", name: "Wave Tracing", icon: "〰️" },
    { id: "sentence", name: "Sentence Writing", icon: "✍️" },
    { id: "free-draw", name: "Free Drawing", icon: "✏️" },
  ]
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Real-Time Handwriting Kinematics Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This test measures velocity, acceleration, and jerk in real-time as you draw.
            Watch the live metrics update like a speedometer as you move your cursor.
          </p>
          
          {/* Task Selection */}
          <div className="flex gap-2 mb-4">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedTask === task.id 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <span className="mr-2">{task.icon}</span>
                {task.name}
              </button>
            ))}
          </div>
          
          <HandwritingTest 
            width={900} 
            height={420} 
            taskName={selectedTask} 
            onAnalysis={(r) => setReport(r)} 
          />
        </CardContent>
      </Card>
      
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Analysis Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clinical Summary */}
            {report.clinicalSummary && (
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <strong>Summary:</strong> {report.clinicalSummary}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Metrics */}
            {report.heuristics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3">
                  <p className="text-xs text-gray-500">Velocity Score</p>
                  <p className="text-lg font-bold">
                    {Math.round((report.heuristics.scores?.velocity || 0) * 100)}%
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-gray-500">Smoothness Score</p>
                  <p className="text-lg font-bold">
                    {Math.round((report.heuristics.scores?.jerk || 0) * 100)}%
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-gray-500">Fluency Score</p>
                  <p className="text-lg font-bold">
                    {Math.round((report.heuristics.scores?.inAir || 0) * 100)}%
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-gray-500">Overall Score</p>
                  <p className="text-lg font-bold">
                    {Math.round((report.heuristics.scores?.overall || 0) * 100)}%
                  </p>
                </Card>
              </div>
            )}
            
            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Recommendations:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {report.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Raw Data */}
            <details className="cursor-pointer">
              <summary className="font-medium text-sm">View Raw Data</summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(report, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
