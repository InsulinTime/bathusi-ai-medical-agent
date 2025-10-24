import React from 'react'
import HistoryList from './_components/HistoryList'
import { Button } from '@/components/ui/button'
import BathusiAgentList from './_components/BathusiAgentList'
import AddNewSessionDialog from './_components/AddNewSessionDialog'

function Dashboard() {
    return (
        <div>
            <div className='flex justify-between items-center'>
                <h2 className='font-bold text-2xl'>My Dashboard</h2>
                <AddNewSessionDialog />
            </div>
            <HistoryList />

            <BathusiAgentList />
        </div>
    )
}

export default Dashboard