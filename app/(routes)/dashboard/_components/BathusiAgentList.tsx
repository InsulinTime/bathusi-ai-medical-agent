import { AIBathusiAgents } from '@/shared/list'
import React from 'react'
import BathusiAgentCard from './BathusiAgentCard'

function BathusiAgentList() {
    return (
        <div className='mt-10'>
            <h2 className='font-bold text-xl'>Bathusi-AI Assistants Agent</h2>

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-5'>
                {AIBathusiAgents.map((bathusi,index)=>(
                    <div key={index}>
                        <BathusiAgentCard bathusiAgent={bathusi}/>

                    </div>
                ))}
            </div>
        </div>
    )
}

export default BathusiAgentList