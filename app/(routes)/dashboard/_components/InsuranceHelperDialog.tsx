// this file is app/%28routes%29/dashboard/_components/InsuranceHelperDialog.tsx
"use client"
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Calculator, BookOpen, Send, Loader2 } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

interface InsuranceEstimate {
    monthlyPremium: number
    estimatedDeductible: number
    estimatedOutOfPocketMax: number
    notes: string[]
}

export function InsuranceHelperDialog() {
    const [activeTab, setActiveTab] = useState<'education' | 'calculator' | 'chat'>('education')
    const [chatMessage, setChatMessage] = useState('')
    const [chatHistory, setChatHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    
    // Calculator state
    const [calculatorData, setCalculatorData] = useState({
        income: '',
        familySize: '1',
        state: '',
        hasEmployerInsurance: false
    })
    const [estimate, setEstimate] = useState<InsuranceEstimate | null>(null)
    const [calculating, setCalculating] = useState(false)

    const handleInsuranceChat = async () => {
        if (!chatMessage.trim()) return

        setLoading(true)
        const userMessage = { role: 'user', content: chatMessage }
        
        try {
            const result = await axios.post('/api/insurance-helper', {
                message: chatMessage,
                conversationHistory: chatHistory
            })

            setChatHistory(prev => [...prev, userMessage, { role: 'assistant', content: result.data.response }])
            setChatMessage('')
        } catch (error) {
            console.error('Insurance chat error:', error)
            toast.error('Failed to get insurance guidance')
        } finally {
            setLoading(false)
        }
    }

    const handleCalculate = async () => {
        setCalculating(true)
        try {
            const result = await axios.post('/api/insurance-calculator', calculatorData)
            setEstimate(result.data.estimate)
            toast.success('Cost estimate calculated')
        } catch (error) {
            console.error('Calculation error:', error)
            toast.error('Failed to calculate estimate')
        } finally {
            setCalculating(false)
        }
    }

    const insuranceTopics = [
        {
            title: "Understanding Health Insurance",
            description: "Learn about different plan types and how they work",
            questions: [
                "What's the difference between HMO and PPO?",
                "How do deductibles work?",
                "What is coinsurance?"
            ]
        },
        {
            title: "Costs & Payments",
            description: "Understand premiums, copays, and out-of-pocket costs",
            questions: [
                "How much will health insurance cost me?",
                "What counts toward my deductible?",
                "How do I lower my healthcare costs?"
            ]
        },
        {
            title: "Claims & Paperwork",
            description: "Navigate insurance claims and understand your bills",
            questions: [
                "How do I file an insurance claim?",
                "What is an Explanation of Benefits?",
                "My claim was denied - what can I do?"
            ]
        }
    ]

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Insurance Helper
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        Bathusi-AI Shield - Insurance Helper
                    </DialogTitle>
                    <DialogDescription>
                        Get help understanding insurance, comparing options, and navigating healthcare costs
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 border-b pb-2">
                    <Button
                        variant={activeTab === 'education' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('education')}
                        className="gap-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        Learn
                    </Button>
                    <Button
                        variant={activeTab === 'calculator' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('calculator')}
                        className="gap-2"
                    >
                        <Calculator className="w-4 h-4" />
                        Cost Estimate
                    </Button>
                    <Button
                        variant={activeTab === 'chat' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('chat')}
                        className="gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Ask Questions
                    </Button>
                </div>

                {activeTab === 'education' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Insurance Education Topics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {insuranceTopics.map((topic, index) => (
                                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="text-base">{topic.title}</CardTitle>
                                        <CardDescription>{topic.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-1 text-sm">
                                            {topic.questions.map((question, qIndex) => (
                                                <li key={qIndex} className="text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    onClick={() => {
                                                        setActiveTab('chat')
                                                        setChatMessage(question)
                                                    }}>
                                                    • {question}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'calculator' && (
                    <div className="space-y-6">
                        <h3 className="font-semibold text-lg">Insurance Cost Estimator</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Annual Income</label>
                                <Input
                                    type="number"
                                    placeholder="50000"
                                    value={calculatorData.income}
                                    onChange={(e) => setCalculatorData(prev => ({...prev, income: e.target.value}))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Family Size</label>
                                <Input
                                    type="number"
                                    placeholder="1"
                                    value={calculatorData.familySize}
                                    onChange={(e) => setCalculatorData(prev => ({...prev, familySize: e.target.value}))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">State</label>
                                <Input
                                    placeholder="CA"
                                    value={calculatorData.state}
                                    onChange={(e) => setCalculatorData(prev => ({...prev, state: e.target.value}))}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="employerInsurance"
                                    checked={calculatorData.hasEmployerInsurance}
                                    onChange={(e) => setCalculatorData(prev => ({...prev, hasEmployerInsurance: e.target.checked}))}
                                />
                                <label htmlFor="employerInsurance" className="text-sm">Employer Insurance Available</label>
                            </div>
                        </div>

                        <Button onClick={handleCalculate} disabled={calculating} className="w-full">
                            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                            Calculate Estimate
                        </Button>

                        {estimate && (
                            <Card className="bg-blue-50">
                                <CardHeader>
                                    <CardTitle>Cost Estimate</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Monthly Premium:</span>
                                        <span className="font-semibold">${estimate.monthlyPremium}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Estimated Deductible:</span>
                                        <span className="font-semibold">${estimate.estimatedDeductible}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Out-of-Pocket Max:</span>
                                        <span className="font-semibold">${estimate.estimatedOutOfPocketMax}</span>
                                    </div>
                                    <div className="mt-3 text-sm text-gray-600">
                                        <p className="font-medium">Notes:</p>
                                        <ul className="list-disc list-inside">
                                            {estimate.notes.map((note, index) => (
                                                <li key={index}>{note}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Ask Insurance Questions</h3>
                        
                        <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50">
                            {chatHistory.length === 0 ? (
                                <div className="text-center text-gray-500 h-full flex items-center justify-center">
                                    Ask a question about insurance to get started
                                </div>
                            ) : (
                                chatHistory.map((msg, index) => (
                                    <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        <div className={`inline-block p-3 rounded-lg max-w-xs md:max-w-md ${
                                            msg.role === 'user' 
                                                ? 'bg-blue-100 text-blue-900' 
                                                : 'bg-gray-100 text-gray-900'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Ask about insurance, costs, or coverage..."
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleInsuranceChat()
                                    }
                                }}
                            />
                            <Button onClick={handleInsuranceChat} disabled={loading || !chatMessage.trim()}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Disclaimer:</strong> Bathusi-AI Shield provides educational information about insurance concepts. 
                        This is not insurance advice. Consult licensed insurance professionals for policy recommendations 
                        and financial decisions. Insurance regulations and costs vary by location.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}