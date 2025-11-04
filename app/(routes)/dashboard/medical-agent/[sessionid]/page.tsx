// this file is app/%28routes%29/dashboard/medical-agent/[sessionid]/page.tsx
"use client"
import axios from 'axios'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { bathusiAgent } from '../../_components/BathusiAgentCard'
import { Circle, Loader2, PhoneCall, PhoneOff } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Vapi from '@vapi-ai/web';
import { toast } from 'sonner'

export type SessionDetail = {
    id: number,
    notes: string,
    sessionId: string,
    report: JSON,
    selectedBathusi: bathusiAgent,
    createdOn: string,
}

type messages = {
    role: string,
    text: string
}

function MedicalVoiceAgent() {
    const { sessionid: sessionId } = useParams();
    const [sessionDetail, setSessionDetail] = useState<SessionDetail>();
    const [callStarted, setCallStarted] = useState(false);
    const [currentRoll, setCurrentRole] = useState<string | null>(null);
    const [liveTranscript, setLiveTranscript] = useState<string>('');
    const [messages, setMessages] = useState<messages[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        sessionId && GetSessionDetails();
    }, [sessionId])

    const GetSessionDetails = async () => {
        const result = await axios.get('/api/session-chat?sessionId=' + sessionId);
        console.log(result.data);
        setSessionDetail(result.data);
    };

    const StartCall = async () => {
        setLoading(true);
        
        if (!process.env.NEXT_PUBLIC_VAPI_API_KEY) {
            toast.error('Voice service is not configured');
            setLoading(false);
            return;
        }

        console.log('🔑 VAPI Key exists, starting call...');

        try {
            const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY);

            // Get the appropriate assistant ID based on selected specialist
            const getAssistantId = () => {
                const specialist = sessionDetail?.selectedBathusi?.specialist;
                
                const assistantMap = {
                    'Bathusi-AI GP (General Health Assistant)': process.env.NEXT_PUBLIC_VAPI_GP_ASSISTANT_ID,
                    'Bathusi-AI Mind (Mental Health Assistant)': process.env.NEXT_PUBLIC_VAPI_MIND_ASSISTANT_ID,
                    'Bathusi-AI Nexi (Procedure and Recovery Assistant)': process.env.NEXT_PUBLIC_VAPI_NEXI_ASSISTANT_ID
                };

                const assistantId = specialist ? assistantMap[specialist as keyof typeof assistantMap] : process.env.NEXT_PUBLIC_VAPI_GP_ASSISTANT_ID;
                
                console.log(`🎯 Selected specialist: ${specialist}`);
                console.log(`🎯 Using assistant ID: ${assistantId}`);
                
                return assistantId;
            };

            const assistantId = getAssistantId();

            if (!assistantId) {
                toast.error('Assistant configuration not found');
                setLoading(false);
                return;
            }

            console.log('⚙️ Using pre-configured HIPAA-compliant VAPI assistant...');

            const callStartTimeout = setTimeout(() => {
                console.error('⏰ Call start timeout');
                setLoading(false);
                toast.error('Call timeout - please try again');
            }, 15000); // 15 second timeout for HIPAA setup

            vapi.on('call-start', () => {
                clearTimeout(callStartTimeout);
                console.log('✅ Call started successfully');
                setLoading(false);
                setCallStarted(true);
                toast.success('HIPAA-compliant call connected!');
            });
            
            vapi.on('call-end', () => {
                console.log('Call ended');
                setCallStarted(false);
                toast.info('Call ended securely');
            });
            
            vapi.on('message', (message) => {
                if (message.type === 'transcript') {
                    const { role, transcriptType, transcript } = message;
                    console.log(`${role}: ${transcript}`);
                    
                    if (transcriptType === 'partial') {
                        setLiveTranscript(transcript);
                        setCurrentRole(role);
                    } else if (transcriptType === 'final') {
                        setMessages(prev => [...prev, { role, text: transcript }]);
                        setLiveTranscript("");
                        setCurrentRole(null);
                    }
                }
            });

            vapi.on('error', (error) => {
                clearTimeout(callStartTimeout);
                console.error('🔴 VAPI Error Details:', {
                    name: error?.name,
                    message: error?.message,
                    code: error?.code,
                    stack: error?.stack,
                    toString: error?.toString()
                });
                setLoading(false);
                toast.error('Failed to start secure call - check console');
            });

            console.log('🚀 Starting HIPAA-compliant VAPI call...');
            
            // FIX: Pass the assistant ID directly as a string
            await vapi.start(assistantId);
            
        } catch (error: any) {
            console.error('💥 VAPI initialization failed:', {
                message: error?.message,
                name: error?.name,
                stack: error?.stack
            });
            setLoading(false);
            toast.error('Failed to initialize secure voice call');
        }
    };

    const endCall = async () => {
        setLoading(true);
        setCallStarted(false);
        setLoading(false);
        toast.info('Secure call ended');
        
        if (messages.length > 0) {
            await GenerateReport();
        }
        
        setTimeout(() => {
            router.replace('/dashboard');
        }, 1500);
    };

    const GenerateReport = async () => {
        try {
            await axios.post('/api/medical-report', {
                messages: messages,
                sessionDetail: sessionDetail,
                sessionId: sessionId
            });
            toast.success('Secure consultation report generated!');
        } catch (error) {
            console.error('Error generating report:', error);
        }
    };

    return (
        <div className='p-5 border rounded-3xl bg-secondary'>
            <div className='flex justify-between items-center mb-2'>
                <h2 className='p-1 px-2 border rounded-md flex gap-2 items-center'>
                    <Circle className={`h-4 w-4 rounded-full ${callStarted ? 'bg-blue-300 animate-pulse' : 'bg-red-300'}`}/>
                    {callStarted ? 'Secure Call Connected...' : 'Not Connected'} 
                </h2>
                <h2 className='font-bold text-xl text-gray-400'>00:00</h2>
            </div>

            {sessionDetail && (
                <div className='flex items-center flex-col mt-10'>
                    <Image 
                        src={`/images/${sessionDetail?.selectedBathusi?.image}`} 
                        alt={sessionDetail?.selectedBathusi?.specialist ?? ''} 
                        width={80}
                        height={80}
                        className='h-[60px] w-[60px] object-cover rounded-full'
                    />
                    <h2 className='font-bold text-sm mt-2'>{sessionDetail?.selectedBathusi?.specialist}</h2>
                    <p className='text-center text-gray-500 text-sm mt-1 px-4'>{sessionDetail?.selectedBathusi?.description}</p>
                    <p className='text-xs text-green-600 mt-1'>🔒 HIPAA Compliant</p>

                    <div className='mt-8 max-h-40 overflow-y-auto w-full px-4'>
                        {messages.slice(-4).map((msg, index) => (
                            <div key={index} className={`p-2 rounded-lg mb-2 max-w-xs ${
                                msg.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                            }`}>
                                <p className="text-sm"><strong>{msg.role}:</strong> {msg.text}</p>
                            </div>
                        ))}
                        {liveTranscript && (
                            <div className="p-2 rounded-lg bg-yellow-100">
                                <p className="text-sm italic">{currentRoll}: {liveTranscript}</p>
                            </div>
                        )}
                    </div>

                    {!callStarted ? (
                        <Button className='w-full max-w-xs mt-6' onClick={StartCall} disabled={loading}>
                            {loading ? <Loader2 className='animate-spin'/> : <PhoneCall/>} 
                            {loading ? 'Starting Secure Call...' : 'Start Secure Consultation'}
                        </Button>
                    ) : ( 
                        <Button variant='destructive' onClick={endCall} disabled={loading}>
                            {loading ? <Loader2 className='animate-spin'/> : <PhoneOff/>} 
                            End Secure Call
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

export default MedicalVoiceAgent