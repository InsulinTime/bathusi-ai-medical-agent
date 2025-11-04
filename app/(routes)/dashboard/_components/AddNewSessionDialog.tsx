//this file is app/%28routes%29/dashboard/_components/AddNewSessionDialog.tsx
"use client"
import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Flower, Loader2} from 'lucide-react'
import axios from 'axios'
import BathusiAgentCard, {bathusiAgent} from './BathusiAgentCard'
import SuggestedBathusiCard from './SuggestedBathusiCard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { SessionDetail } from '../medical-agent/[sessionid]/page'
function AddNewSessionDialog() {
    const[note,setNote]=useState<string>();
    const[loading, setLoading] = useState(false);
    const[suggestedBathusi, setSuggestedBathusi] = useState<bathusiAgent[]>();
    const[selectedBathusi, setSelectedBathusi] = useState<bathusiAgent>();
    const router = useRouter();
    const [historyList, setHistoryList]=useState<SessionDetail[]>([])
    const {has} = useAuth();
        //@ts-ignore
        const paidUser =has && has({ plan: 'pro' })
        useEffect(()=>{
            GetHistoryList();
        },[])

        const GetHistoryList=async()=>{
            const result=await axios.get('/api/session-chat?sessionId=all');
            console.log(result.data);
            setHistoryList(result.data);
        }


    const OnClickNext=async()=>{
        setLoading(true);
        const result=await axios.post('/api/suggest-bathusi', {
            notes:note
        });

        console.log(result.data);
        setSuggestedBathusi(result.data);
        setLoading(false);
    }

    const onStartConsultation=async()=>{
        setLoading(true);
        // Save All info To DB
        const result=await axios.post('/api/session-chat', {
            note:note,
            selectedBathusi: selectedBathusi
        });
        console.log(result.data)
        if (result.data?.sessionId) {
            console.log(result.data.sessionId);
            // Route new Conversation Screen
            router.push('/dashboard/medical-agent/'+ result.data.sessionId);
        }
        setLoading(false);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className='mt-3' disabled={!paidUser && historyList?.length >= 20800}>+ Start a Consultation</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Basic Details about your Health</DialogTitle>
                    <DialogDescription asChild>
                        {!suggestedBathusi? <div>
                            <h2> Add Symptoms or Any Other Details</h2>
                            <Textarea placeholder='Write the details here...' 
                                className='h-[150px] mt-3 '
                                onChange={(e)=>setNote(e.target.value)}
                            />
                        </div>:
                        <div>
                            <h2>Select the bathusi</h2>
                            <div className='grid grid-cols-3 gap-5'>
                                {suggestedBathusi.map((bathusi, index)=>(
                                    <SuggestedBathusiCard bathusiAgent={bathusi} key={index}
                                        setSelectedBathusi={()=>setSelectedBathusi(bathusi)}
                                        //@ts-ignore
                                        selectedBathusi={selectedBathusi}/>
                                ))}
                            </div>
                        </div>}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={'outline'}>Cancel</Button>
                    </DialogClose>
                    {!suggestedBathusi ? <Button disabled={!note || loading} onClick={() => OnClickNext()}>
                        Let's Begin {loading ? <Loader2 className='animate-spin'/> : <Flower/>} </Button>
                        : <Button disabled={loading || !selectedBathusi} onClick={()=> onStartConsultation()}>Start Consultation
                            {loading ? <Loader2 className='animate-spin'/> : <Flower/>}</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
    }

export default AddNewSessionDialog