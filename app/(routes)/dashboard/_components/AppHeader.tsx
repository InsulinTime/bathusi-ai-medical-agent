//this file is app/%28routes%29/dashboard/_components/AppHeader.tsx
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const menuOptions =[
    {
        id:1,
        name:'Home',
        path:'/dashboard'
    },
    {
        id:2,
        name:'History',
        path:'/dashboard/history'
    },
    {
        id:3,
        name:'Pricing',
        path:'/dashboard/billing'
    },
    {
        id:4,
        name:'Profile',
        path:'/dashboard/profile'
    },
    {
        id:5,
        name:'Chat to Bathusi-AI',
        path:'/dashboard/chat'
    },
    {
        id: 6,
        name: 'Record Consultation',
        path: '/dashboard/consultation-recording'
    },
    {
        id: 7,
        name: 'Cognitive Tests',
        path: '/dashboard/cognitive-tests'
    }
] 
function AppHeader() {
    return (
        <div className= 'flex items-center justify-between p-4 shadow px-10 md:px-20 lg:px-40'>
            <Image src={'/logo.svg'} alt='logo' width={20} height={12} />
            <div className='hidden md:flex gap-12 items-center'>
                {menuOptions.map((option,index)=>(
                    <Link key={index} href={option.path}>
                        <h2 className='hover:font-semibold cursor-pointer transition-all'>{option.name}</h2>
                    </Link>
                ))}
            </div>
            <UserButton />
        </div>
    )
}

export default AppHeader