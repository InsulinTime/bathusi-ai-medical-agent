// app/(routes)/dashboard/_components/NavigationDropdown.tsx
"use client"
import React, { useState } from 'react'
import { ChevronDown, FileText, MapPin, Brain, Stethoscope, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'

export default function NavigationDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  const resources = [
    {
      name: '3D Body Analyzer',
      href: '/dashboard/ar-body-analyzer',
      description: 'Interactive 3D body model for symptom tracking',
      icon: MapPin,
      color: 'text-blue-600'
    },
    {
      name: 'Health Articles',
      href: '/dashboard/articles',
      description: 'Educational content about health and wellness',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      name: 'Medical Guidelines',
      href: '/terms',
      description: 'Healthcare best practices and protocols',
      icon: Stethoscope,
      color: 'text-red-600'
    }
  ]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-1">
          Resources
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-80 p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 mb-2">Explore Bathusi-AI</h3>
          {resources.map((item) => (
            <DropdownMenuItem key={item.name} asChild>
              <Link 
                href={item.href}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className={`p-2 rounded-lg bg-gray-100 ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Bathusi-AI provides tools for health awareness and education. Not for medical diagnosis.
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}