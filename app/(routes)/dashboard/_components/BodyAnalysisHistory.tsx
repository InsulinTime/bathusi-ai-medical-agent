// app/(routes)/dashboard/_components/BodyAnalysisHistory.tsx
"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, Calendar, AlertCircle, ChevronRight, 
  Brain, Clock, FileText, TrendingUp 
} from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'

interface BodyAnalysisRecord {
  id: number
  sessionId: string
  selectedParts: string[]
  symptoms: string
  severity: string
  painLevels: Record<string, number>
  duration: string
  structuredAnalysis: any
  urgencyLevel: string
  createdAt: string
}

interface BodyAnalysisHistoryProps {
  analyses: BodyAnalysisRecord[]
}

export default function BodyAnalysisHistory({ analyses }: BodyAnalysisHistoryProps) {
  const getUrgencyColor = (urgency: string) => {
    switch(urgency?.toLowerCase()) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch(urgency?.toLowerCase()) {
      case 'critical': return <AlertCircle className="w-4 h-4" />
      case 'high': return <TrendingUp className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {analyses.map((analysis) => (
        <Card key={analysis.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  Body Analysis
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(analysis.createdAt), 'MMM dd, yyyy')}
                  <Clock className="w-3 h-3 ml-2" />
                  {format(new Date(analysis.createdAt), 'HH:mm')}
                </div>
              </div>
              <Badge variant={getUrgencyColor(analysis.urgencyLevel)}>
                <div className="flex items-center gap-1">
                  {getUrgencyIcon(analysis.urgencyLevel)}
                  {analysis.urgencyLevel}
                </div>
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Body Parts */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Affected Areas:</p>
              <div className="flex flex-wrap gap-1">
                {analysis.selectedParts?.slice(0, 3).map((part, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {part}
                  </Badge>
                ))}
                {analysis.selectedParts?.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{analysis.selectedParts.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Symptoms Preview */}
            {analysis.symptoms && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Symptoms:</p>
                <p className="text-xs text-gray-700 line-clamp-2">
                  {analysis.symptoms}
                </p>
              </div>
            )}

            {/* Top Conditions */}
            {analysis.structuredAnalysis?.possibleConditions && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Top Conditions:</p>
                <div className="space-y-1">
                  {analysis.structuredAnalysis.possibleConditions.slice(0, 2).map((condition: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{condition.name}</span>
                      {condition.probability && (
                        <Badge variant="secondary" className="text-xs">
                          {condition.probability}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Details Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  <FileText className="w-4 h-4 mr-2" />
                  View Full Report
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    Body Analysis Report
                  </DialogTitle>
                  <DialogDescription>
                    Analysis from {format(new Date(analysis.createdAt), 'MMMM dd, yyyy HH:mm')}
                  </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="mt-4 h-[60vh]">
                  <div className="space-y-4">
                    {/* Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Analysis Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Severity:</span>
                          <Badge>{analysis.severity}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Duration:</span>
                          <span className="text-sm">{analysis.duration || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Urgency Level:</span>
                          <Badge variant={getUrgencyColor(analysis.urgencyLevel)}>
                            {analysis.urgencyLevel}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Affected Areas with Pain Levels */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Affected Body Parts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysis.selectedParts?.map((part, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm">{part}</span>
                              {analysis.painLevels?.[part] !== undefined && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Pain Level:</span>
                                  <Badge variant="outline">
                                    {analysis.painLevels[part]}/10
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Symptoms */}
                    {analysis.symptoms && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Reported Symptoms</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700">{analysis.symptoms}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Possible Conditions */}
                    {analysis.structuredAnalysis?.possibleConditions && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Differential Diagnosis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {analysis.structuredAnalysis.possibleConditions.map((condition: any, i: number) => (
                            <div key={i} className="border-l-2 border-purple-500 pl-3">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-sm">{condition.name}</h4>
                                {condition.probability && (
                                  <Badge variant="secondary">
                                    {condition.probability}% match
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{condition.description}</p>
                              {condition.details && condition.details.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {condition.details.map((detail: string, j: number) => (
                                    <li key={j} className="text-xs text-gray-500">• {detail}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Recommendations */}
                    {analysis.structuredAnalysis?.recommendations && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.structuredAnalysis.recommendations.map((rec: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Emergency Warnings */}
                    {analysis.structuredAnalysis?.emergencyWarnings && 
                     analysis.structuredAnalysis.emergencyWarnings.length > 0 && (
                      <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            Emergency Indicators
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {analysis.structuredAnalysis.emergencyWarnings.map((warning: string, i: number) => (
                              <li key={i} className="text-sm text-red-700">• {warning}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}