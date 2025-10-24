//this file is app/%28routes%29/dashboard/_components/SuggestedBathusiCard.tsx
import React from 'react'
import { bathusiAgent } from './BathusiAgentCard'
import Image from 'next/image'



type props={
    bathusiAgent:bathusiAgent,
    setSelectedBathusi:any,
    selectedBathusi: bathusiAgent
}
function SuggestedBathusiCard({bathusiAgent, setSelectedBathusi, selectedBathusi}:props) {
    return (
        <div className={`flex flex-col items-center
        border rounded-2xl shadow p-5
        hover:border-blue-500 cursor-pointer
        ${selectedBathusi?.id == bathusiAgent?.id && 'border-blue-500'}`} onClick={() => setSelectedBathusi(bathusiAgent)}>
             <Image src={`/images/${bathusiAgent?.image}`}
                alt={bathusiAgent?.specialist}
                width={70}
                height={70} 
                className='w-[50px] h-[50px] rounded-4xl object-cover'
            />
            <h2 className='font-bold text-sm text-center mt-1'>{bathusiAgent?.specialist}</h2>
            <p className='text-xs text-center line-clamp-2'>{bathusiAgent?.description}</p>
        </div>
    )
}

export default SuggestedBathusiCard