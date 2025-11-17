// File: components/MedicalDisclaimer.tsx
import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface MedicalDisclaimerProps {
  compact?: boolean
}

export default function MedicalDisclaimer({ compact = false }: MedicalDisclaimerProps) {
  if (compact) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 text-sm font-semibold">
              Research Prototype - Not for Medical Use
            </p>
            <p className="text-amber-700 text-xs mt-1">
              Not approved by SAHPRA. Consult healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-red-800 font-bold text-lg mb-2">
            🚨 MEDICAL DISCLAIMER - RESEARCH PROTOTYPE
          </h4>
          <p className="text-red-700 text-sm">
            <strong>Bathusi AI is NOT a medical device and has NOT been approved by SAHPRA.</strong>{' '}
            This platform is for research and demonstration purposes only. Do not use for 
            medical diagnosis or treatment decisions. Always consult qualified healthcare 
            professionals for medical concerns.
          </p>
        </div>
      </div>
    </div>
  )
}