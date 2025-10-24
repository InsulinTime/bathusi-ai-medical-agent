"use client"
import axios from 'axios'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import React, { use, useEffect, useState } from 'react'
import { bathusiAgent } from '../../_components/BathusiAgentCard'
import { Circle, Loader2, PhoneCall, PhoneOff } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Vapi from '@vapi-ai/web';
import Provider from '@/app/provider'
import { toast } from 'sonner'

export type SessionDetail ={
    id:number,
    notes:string,
    sessionId:string,
    report:JSON,
    selectedBathusi:bathusiAgent,
    createdOn:string,
    
}

type messages={
    role:string,
    text:string
}

function MedicalVoiceAgent() {
    const {sessionid: sessionId} = useParams();
    const [sessionDetail, setSessionDetail]= useState<SessionDetail>();
    const [callStarted, setCallStarted]=useState(false);
    const [vapiInstance, setVapiInstance]=useState<any>(null);
    const [currentRoll, setCurrentRole]=useState<string|null>(null);
    const [liveTranscript, setLiveTranscript]=useState<string>('');
    const [messages, setMessages]=useState<messages[]>([]);
    const [loading, setLoading]=useState(false);
    const router=useRouter();

    useEffect(()=>{
        sessionId&&GetSessionDetails();
    }, [sessionId])

    const GetSessionDetails=async()=>{
        const result=await axios.get('/api/session-chat?sessionId='+sessionId);
        console.log(result.data);
        setSessionDetail(result.data);
    };

    const StartCall=()=>{
        setLoading(true);
        const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
        setVapiInstance(vapi);

        const VapiAgentConfig={
            name:'AI Medical Bathusi Voice Agent',
            firstMessage:"Hi there! I'm Bathusi-AI and I'm here help you with any health concerns questions or concerns you might have today. How are you feeling?",
            transcriber:{
                provider:'assembly-ai',
                language:'en'
            },
            voice:{
                provider:'vapi',
                VoiceId:sessionDetail?.selectedBathusi?.voiceId ?? 'elliot'
            },
            model:{
                provider:'google',
                model:'gemini 2.o flash',
                messages:[
                    {
                        role:'system',
                        content:sessionDetail?.selectedBathusi?.agentPrompt
                    }
                ]
            }
        }

        //@ts-ignore
        vapi.start(VapiAgentConfig);
        vapi.on('call-start', () => {
            setLoading(false);
            console.log('Call started')
            setCallStarted(true);
        });
        vapi.on('call-end', () => {
            setCallStarted(false);
            console.log('Call ended')
        });
        vapi.on('message', (message) => {
            if (message.type === 'transcript') {
                const {role, transcriptType, transcript}=message;
                console.log(`${message.role}: ${message.transcript}`);
                if (transcriptType=='partial') {
                    setLiveTranscript(transcript);
                    setCurrentRole(role);
                }
                else if(transcriptType=='final'){
                    setMessages((prev : any)=> [...prev, {role:role, text:transcript}])
                    setLiveTranscript("");
                    setCurrentRole(null);
                }
            }
        });

        vapiInstance.on('speech-start', () => {
            console.log('Assistant started speaking');
            setCurrentRole('assistant')
            });

        vapiInstance.on('speech-end', () => {
            console.log('Assistant stopped speaking');
            setCurrentRole('user')
            });
    };

    const endCall = async() => {
        setLoading(true)
        if (!vapiInstance) return;
        vapiInstance.stop();
        vapiInstance.off('call-start');
        vapiInstance.off('call-end');
        vapiInstance.off('message');
        setCallStarted(false);
        setVapiInstance(null);
        toast.success('Your report is generated!')
        router.replace('/dashboard');

        const result=await GenerateReport();
        setLoading(false);
    };

    const GenerateReport=async()=>{
        const result=await axios.post('/api/medical-report', {
            messages:messages,
            sessionDetail:sessionDetail,
            sessionId:sessionId
        })

        console.log(result.data);
        return result.data;
    }

    return (
        <div className='p-5 border rounded-3xl bg-secondary'>
            <div className='flex justify-between items-center mb-2'>
                <h2 className='p-1 px-2 border rounded-md flex gap-2 items-center'><Circle className={`h-4 w-4 rounded-full ${callStarted?'bg-blue-300': 'bg-red-300'}`}/>{callStarted? 'Connected...': 'Not Connected'} </h2>
                <h2 className='font-bold text-xl text-gray-400'>00:00</h2>
            </div>

            {sessionDetail && <div className='flex items-center flex-col mt-10'>
                <Image src={`/images/${sessionDetail?.selectedBathusi?.image}`} alt={sessionDetail?.selectedBathusi?.specialist??''} 
                    width={80}
                    height={80}
                    className='h-[60px] w-[60px] object-cover rounded-full'/>
                <h2 className='font-bold text-sm mt-2'>{sessionDetail?.selectedBathusi?.specialist}</h2>
                <p className='text-center text-gray-500 text-sm mt-1 px-4'>{sessionDetail?.selectedBathusi?.description}</p>

                <div className='mt-22 overflow-y-auto flex flex-col items-center px-10 md:px-28 lg:px-52 xl:px-72'>
                    {messages?.slice(-4).map((msg:messages,index) => (
                        <h2 className='text-gray-400 p-2' key={index}> {msg.role}: {msg.text}</h2>
                    ))}
                    {liveTranscript && liveTranscript?.length > 0 && <h2 className='text-lg'>{currentRoll} : {liveTranscript}</h2>}
                </div>

                {!callStarted? (
                    <Button className='w-full max-w-xs mt-6' onClick={StartCall} disabled={loading}>
                        {loading ? <Loader2 className='animate-spin'/>:<PhoneCall/>}Start Voice Consultation
                    </Button>
                ):( 
                    <Button variant='destructive' onClick={endCall} disabled={loading}>
                        {loading ? <Loader2 className='animate-spin'/>:<PhoneOff/>} End Call
                    </Button>
                )}
            </div>}
        </div>
    )
}

export default MedicalVoiceAgent