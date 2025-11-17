// app/%28routes%29/dashboard/cognitive-tests/page.tsx
"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Eye, Mic, Activity, Zap, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react'
import EyeTrackingAnalyzer from '../_components/EyeTrackingAnalyzer'
import MedicalDisclaimer from '@/components/MedicalDisclaimer'

export default function CognitiveTestsPage() {
    const [activeTest, setActiveTest] = useState<string | null>(null)

    const cognitiveTests = [
        {
            id: 'eye-tracking',
            name: 'Eye Movement Analysis',
            description: 'Assess cognitive function through eye movement patterns, gaze stability, and blink analysis',
            icon: Eye,
            status: 'available',
            duration: '3-5 minutes',
            measures: ['Gaze Stability', 'Saccade Patterns', 'Blink Rate', 'Pupil Response'],
            color: 'bg-blue-50 border-blue-200'
        },
        {
            id: 'voice-analysis',
            name: 'Voice Pattern Analysis',
            description: 'Analyze speech patterns, fluency, and vocal biomarkers for cognitive assessment',
            icon: Mic,
            status: 'coming-soon',
            duration: '2-4 minutes',
            measures: ['Speech Fluency', 'Voice Tremor', 'Articulation', 'Response Time'],
            color: 'bg-purple-50 border-purple-200'
        },
        {
            id: 'motor-skills',
            name: 'Motor Function Test',
            description: 'Evaluate fine motor skills and coordination through interactive tasks',
            icon: Activity,
            status: 'coming-soon',
            duration: '4-6 minutes',
            measures: ['Hand Coordination', 'Reaction Time', 'Movement Precision', 'Task Switching'],
            color: 'bg-green-50 border-green-200'
        }
    ]

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Available Now in beta testing
                    </div>
                )
            case 'coming-soon':
                return (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Coming Soon
                    </div>
                )
            default:
                return null
        }
    }

    if (activeTest === 'eye-tracking') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <Button 
                            variant="ghost" 
                            onClick={() => setActiveTest(null)}
                            className="mb-4"
                        >
                            ← Back to Cognitive Tests
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-900">Eye Movement Analysis</h1>
                        <p className="text-gray-600 mt-2">
                            Real-time cognitive assessment through eye tracking technology
                        </p>
                    </div>
                    <EyeTrackingAnalyzer />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Brain className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Cognitive Health Screening
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Advanced AI-powered assessments for early detection of cognitive changes. Still in research phase. Refer to a real medical practioner.
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="text-center">
                        <CardContent className="pt-6">
                            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-900">3-5 min</div>
                            <div className="text-gray-600">Per Test</div>
                        </CardContent>
                    </Card>
                    <Card className="text-center">
                        <CardContent className="pt-6">
                            <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-900">Non-Invasive</div>
                            <div className="text-gray-600">Camera Based</div>
                        </CardContent>
                    </Card>
                    <Card className="text-center">
                        <CardContent className="pt-6">
                            <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-gray-900">Real-time</div>
                            <div className="text-gray-600">Results</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Available Tests */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Assessments</h2>
                    
                    {cognitiveTests.map((test) => (
                        <Card key={test.id} className={`border-2 ${test.color} hover:shadow-lg transition-all duration-300`}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                            <test.icon className="w-6 h-6 text-gray-700" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                {test.name}
                                                {getStatusBadge(test.status)}
                                            </CardTitle>
                                            <CardDescription className="text-base mt-2">
                                                {test.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Zap className="w-4 h-4" />
                                            Duration: {test.duration}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {test.measures.map((measure, index) => (
                                                <span 
                                                    key={index}
                                                    className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200"
                                                >
                                                    {measure}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <Button
                                        onClick={() => test.status === 'available' && setActiveTest(test.id)}
                                        disabled={test.status !== 'available'}
                                        className="gap-2 min-w-[140px]"
                                        size="lg"
                                    >
                                        {test.status === 'available' ? (
                                            <>
                                                Begin Test
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        ) : (
                                            'Coming Soon'
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Medical Disclaimer */}
                <Card className="mt-12 border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-amber-800 mb-2">Important Medical Disclaimer</h3>
                                <p className="text-amber-700 text-sm">
                                    Bathusi-AI cognitive screening tools are designed for research and educational purposes only. 
                                    These assessments are not medical devices and should not be used for diagnosis, treatment, 
                                    or as a substitute for professional medical advice. Always consult qualified healthcare 
                                    professionals for medical concerns and cognitive health assessments.
                                </p>
                                <MedicalDisclaimer />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}