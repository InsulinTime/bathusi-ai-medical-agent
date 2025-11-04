// this file is app/%28routes%29/dashboard/consultation-recording/page.tsx
"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, MicOff, Square, Play, Download, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ConsultationRecordingPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioBlob(audioBlob)
        setAudioUrl(audioUrl)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      toast.success('Recording stopped')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (!isPaused) {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        toast.info('Recording paused')
      } else {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        toast.info('Recording resumed')
      }
    }
  }

  const processRecording = async () => {
    if (!audioBlob) {
      toast.error('No recording to process')
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'consultation.wav')
      formData.append('consultationDate', new Date().toISOString())

      const response = await fetch('/api/transcribe-consultation', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process recording')
      }

      const result = await response.json()
      
      toast.success('Consultation processed successfully!')
      
      // Redirect to the consultation summary page
      router.push(`/dashboard/consultation/${result.consultationId}`)
    } catch (error) {
      console.error('Error processing recording:', error)
      toast.error('Failed to process recording')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Doctor-Patient Consultation Recorder
          </h1>
          <p className="text-gray-600">
            Record your medical consultations and get automated transcriptions with medical insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recording Card */}
          <Card>
            <CardHeader>
              <CardTitle>Record Consultation</CardTitle>
              <CardDescription>
                Start recording when the consultation begins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-gray-800 mb-4">
                  {formatTime(recordingTime)}
                </div>
                
                <div className="flex justify-center space-x-4">
                  {!isRecording ? (
                    <Button onClick={startRecording} size="lg" className="bg-red-500 hover:bg-red-600">
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <>
                      <Button onClick={pauseRecording} variant="outline" size="lg">
                        {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button onClick={stopRecording} variant="destructive" size="lg">
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>

                {isRecording && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm text-red-500">Recording...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recording Preview</CardTitle>
              <CardDescription>
                Listen to your recording before processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {audioUrl ? (
                <div className="space-y-4">
                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Recording duration: {formatTime(recordingTime)}</p>
                    <p>• File ready for processing</p>
                    <p>• Click below to transcribe and analyze</p>
                  </div>

                  <Button 
                    onClick={processRecording} 
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Transcribe & Analyze
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MicOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recording available</p>
                  <p className="text-sm">Start recording to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Ensure both doctor and patient are clearly audible</li>
              <li>• Record in a quiet environment for better transcription</li>
              <li>• Speak clearly and at a moderate pace</li>
              <li>• The system will automatically transcribe and generate medical insights</li>
              <li>• All data is securely stored and processed</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}