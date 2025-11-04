// this file is app/%28routes%29/dashboard/chat/page.tsx
"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2, ArrowLeft, FileText } from 'lucide-react'
import { AIBathusiAgents } from '@/shared/list'
import { bathusiAgent } from '../_components/BathusiAgentCard'
import axios from 'axios'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [selectedAgent, setSelectedAgent] = useState<bathusiAgent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleAgentSelect = (agent: bathusiAgent) => {
    setSelectedAgent(agent)
    // Initialize conversation with welcome message
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Hello! I'm ${agent.specialist}. ${agent.description} How can I help you today?`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
    
    // Create a new session
    createNewSession(agent)
  }

  const createNewSession = async (agent: bathusiAgent) => {
    try {
      const result = await axios.post('/api/session-chat', {
        notes: `Text chat with ${agent.specialist}`,
        selectedBathusi: agent,
        type: 'text'
      })
      setSessionId(result.data.sessionId)
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          agentPrompt: selectedAgent.agentPrompt,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          sessionId: sessionId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const generateReport = async () => {
    if (!sessionId || !selectedAgent) {
      toast.error('Cannot generate report - session not found')
      return
    }
    
    if (messages.length <= 1) {
      toast.error('Please have a conversation first before generating a report')
      return
    }
    
    setIsGeneratingReport(true)
    
    try {
      const result = await axios.post('/api/medical-report', {
        messages: messages.map(msg => ({
          role: msg.role,
          text: msg.content
        })),
        sessionDetail: {
          selectedBathusi: selectedAgent,
          notes: `Text chat consultation with ${selectedAgent.specialist}`
        },
        sessionId: sessionId
      })
      
      toast.success('Medical report generated successfully!')
      
      setTimeout(() => {
        router.push('/dashboard/history')
      }, 1000)
      
    } catch (error: any) {
      console.error('Failed to generate report:', error)
      const errorMessage = error.response?.data?.message || 'Failed to generate report'
      toast.error(`Report generation failed: ${errorMessage}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  if (!selectedAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">Choose Your Bathusi-AI Specialist</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AIBathusiAgents.map((agent) => (
              <motion.div
                key={agent.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer border border-gray-200"
                onClick={() => handleAgentSelect(agent)}
              >
                <div className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <Image
                      src={`/images/${agent.image}`}
                      alt={agent.specialist}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
                    {agent.specialist}
                  </h3>
                  <p className="text-gray-600 text-sm text-center">
                    {agent.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => setSelectedAgent(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 relative">
                <Image
                  src={`/images/${selectedAgent.image}`}
                  alt={selectedAgent.specialist}
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">{selectedAgent.specialist}</h2>
                <p className="text-sm text-gray-500">{selectedAgent.description}</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={generateReport} 
            variant="outline"
            disabled={isGeneratingReport || messages.length <= 1}
            className="gap-2"
          >
            {isGeneratingReport ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isGeneratingReport ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-none">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Remember: Bathusi-AI provides health information but cannot diagnose or prescribe medication.
          </p>
        </div>
      </div>
    </div>
  )
}