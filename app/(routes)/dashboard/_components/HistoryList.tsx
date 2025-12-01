// app/(routes)/dashboard/_components/HistoryList.tsx
"use client"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import React, { useEffect, useState } from "react"
import AddNewSessionDialog from "./AddNewSessionDialog"
import axios from "axios"
import HistoryTable from "./HistoryTable"
import BodyAnalysisHistory from "./BodyAnalysisHistory"
import { SessionDetail } from '../medical-agent/[sessionid]/page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Brain } from "lucide-react"

function HistoryList() {
  const [historyList, setHistoryList] = useState<SessionDetail[]>([])
  const [bodyAnalyses, setBodyAnalyses] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("consultations")

  useEffect(() => {
    GetHistoryList()
    GetBodyAnalyses()
  }, [])

  const GetHistoryList = async () => {
    const result = await axios.get('/api/session-chat?sessionId=all')
    console.log('Consultations:', result.data)
    setHistoryList(result.data)
  }

  const GetBodyAnalyses = async () => {
    try {
      const result = await axios.get('/api/body-analysis?sessionId=all')
      console.log('Body Analyses:', result.data)
      setBodyAnalyses(result.data)
    } catch (error) {
      console.error('Failed to fetch body analyses:', error)
    }
  }

  const hasNoHistory = historyList.length === 0 && bodyAnalyses.length === 0

  return (
    <div className='mt-10'>
      {hasNoHistory ? (
        <div className='flex items-center flex-col justify-center p-7 border border-dashed rounded-2xl border-2'>
          <Image 
            src={'/medical-assistance.png'} 
            alt='empty' 
            width={120}
            height={120}
          />
          <h2 className='font-bold text-xl mt-2'>No Recent Activity</h2>
          <p>You haven't used any of Bathusi-AI's services recently.</p>
          <AddNewSessionDialog />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="consultations" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Consultations ({historyList.length})
            </TabsTrigger>
            <TabsTrigger value="body-analysis" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Body Analysis ({bodyAnalyses.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="consultations" className="mt-6">
            {historyList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No consultation history yet
              </div>
            ) : (
              <HistoryTable historyList={historyList} />
            )}
          </TabsContent>
          
          <TabsContent value="body-analysis" className="mt-6">
            {bodyAnalyses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No body analysis history yet
              </div>
            ) : (
              <BodyAnalysisHistory analyses={bodyAnalyses} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default HistoryList