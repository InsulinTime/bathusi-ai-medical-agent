//this file is app/%28routes%29/dashboard/_components/BathusiAgentCard.tsx
"use client"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import { IconArrowRight } from '@tabler/icons-react'
import axios from 'axios'
import { Loader2Icon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

export type bathusiAgent={
    id:number,
    specialist:string,
    description:string,
    image:string,
    agentPrompt:string,
    voiceId?:string,
    subscriptionRequired:boolean
}
type props={
    bathusiAgent:bathusiAgent
}

function BathusiAgentCard({ bathusiAgent }: props){
    const[loading, setLoading] = useState(false);
    const router=useRouter();
    const {has} = useAuth();
    //@ts-ignore
    const paidUser =has && has({ plan: 'pro' });
    console.log(paidUser)

    const onStartConsultation=async()=>{
        setLoading(true);
        // Save All info To DB
        const result=await axios.post('/api/session-chat', {
            note: 'New Query',
            selectedBathusi: bathusiAgent
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
        <div className='relative'>
            {bathusiAgent.subscriptionRequired&& <Badge className='absolute m-2 right-0'>
                Premium
            </Badge>}
            <Image src={`/images/${bathusiAgent.image}`}
                alt={bathusiAgent.specialist}
                width={100}
                height={100} 
                className='w-full h-[250px] object-cover rounded-xl'
            />
            <h2 className='font-bold mt-1'>{bathusiAgent.specialist}</h2>
            <p className='line-clamp-2 text-sm text-gray-500'>{bathusiAgent.description}</p>
            <Button className='w-full my-2'
                onClick={onStartConsultation} 
                disabled={!paidUser&&bathusiAgent.subscriptionRequired}>
                Begin Consultation {loading ? <Loader2Icon className='animate-spin'/>:<IconArrowRight/>}</Button>
        </div>
    )
}

export default BathusiAgentCard
