//this file is app/%28routes%29/dashboard/page.tsx
import React from 'react'
import HistoryList from './_components/HistoryList'
import BathusiAgentList from './_components/BathusiAgentList'
import AddNewSessionDialog from './_components/AddNewSessionDialog'
import { InsuranceHelperDialog } from './_components/InsuranceHelperDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Heart, Brain, Stethoscope } from 'lucide-react'

function Dashboard() {
    return (
        <div className="space-y-8 p-6">
            <div className='flex justify-between items-center'>
                <div>
                    <h2 className='font-bold text-2xl'>My Dashboard</h2>
                    <p className="text-gray-600 mt-1">Your comprehensive healthcare assistant platform</p>
                </div>
                <div className="flex gap-2">
                    <InsuranceHelperDialog />
                    <AddNewSessionDialog />
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4">Bathusi-AI Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-red-400 hover:border-l-red-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">General Health</CardTitle>
                            <Heart className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-gray-800">Bathusi-AI GP</div>
                            <CardDescription className="text-xs mt-1">
                                Everyday health concerns & symptoms
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-purple-400 hover:border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mental Wellness</CardTitle>
                            <Brain className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-gray-800">Bathusi-AI Mind</div>
                            <CardDescription className="text-xs mt-1">
                                Emotional support & stress management
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-400 hover:border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Procedures</CardTitle>
                            <Stethoscope className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-gray-800">Bathusi-AI Nexi</div>
                            <CardDescription className="text-xs mt-1">
                                Treatment guidance & recovery
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-400 hover:border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Insurance Help</CardTitle>
                            <Shield className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-gray-800">Bathusi-AI Shield</div>
                            <CardDescription className="text-xs mt-1">
                                NEW: Cost & coverage guidance
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4">Recent Consultations</h3>
                <HistoryList />
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4">All Specialists</h3>
                <BathusiAgentList />
            </div>
        </div>
    )
}

export default Dashboard