// File: app/terms/page.tsx
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Shield, FileText, Heart } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms & Conditions
          </h1>
          <p className="text-xl text-gray-600">
            Important information about using Bathusi AI
          </p>
        </div>

        {/* Critical Warning Banner */}
        <Card className="border-red-300 bg-red-50 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-red-800 mb-2">
                  ⚠️ RESEARCH PROTOTYPE - NOT FOR MEDICAL USE
                </h3>
                <p className="text-red-700">
                  Bathusi AI is currently in <strong>testing phase</strong> and has <strong>NOT been approved</strong> by 
                  the South African Health Products Regulatory Authority (SAHPRA) or any other medical regulatory body. 
                  This platform is for <strong>research and demonstration purposes only</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Medical Disclaimer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                Medical Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-red max-w-none">
                <p className="font-semibold text-red-700">
                  Bathusi AI is NOT a medical device and does NOT provide medical diagnosis, treatment, or prescription services.
                </p>
                
                <h4 className="font-semibold text-gray-800 mt-4">Important Limitations:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>All health information provided is for <strong>educational and informational purposes only</strong></li>
                  <li>AI-generated content should <strong>NOT be considered medical advice</strong></li>
                  <li>Always consult qualified healthcare professionals for medical concerns</li>
                  <li>Do not disregard professional medical advice based on AI suggestions</li>
                  <li>In medical emergencies, contact emergency services immediately</li>
                </ul>

                <h4 className="font-semibold text-gray-800 mt-4">Regulatory Status:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Not approved by SAHPRA</strong> (South African Health Products Regulatory Authority)</li>
                  <li><strong>Not approved by HPCSA</strong> (Health Professions Council of South Africa)</li>
                  <li><strong>Not certified</strong> as a medical device in South Africa</li>
                  <li>Currently in <strong>research and development phase</strong></li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Testing Phase Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <FileText className="w-6 h-6" />
                Testing Phase Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-amber-700 font-semibold">
                  Bathusi AI is currently in BETA testing phase. Features may change, contain errors, or be unavailable.
                </p>
                
                <h4 className="font-semibold text-gray-800 mt-4">Current Status:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>BETA Version</strong> - Features under active development</li>
                  <li><strong>Research Platform</strong> - Collecting data for algorithm improvement</li>
                  <li><strong>Limited Accuracy</strong> - AI models are still being trained and validated</li>
                  <li><strong>Technical Issues</strong> - Service interruptions may occur</li>
                </ul>

                <h4 className="font-semibold text-gray-800 mt-4">User Responsibilities:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Understand this is a demonstration platform</li>
                  <li>Do not rely on AI suggestions for health decisions</li>
                  <li>Report any issues or concerns to the development team</li>
                  <li>Participate responsibly in cognitive testing features</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Shield className="w-6 h-6" />
                Data Privacy & Research
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <h4 className="font-semibold text-gray-800">Research Data Collection:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Anonymous usage data may be collected for research purposes</li>
                  <li>Eye tracking and cognitive test data helps improve algorithms</li>
                  <li>All personal health information is stored securely</li>
                  <li>You can request data deletion at any time</li>
                </ul>

                <h4 className="font-semibold text-gray-800 mt-4">Compliance:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Following POPIA (Protection of Personal Information Act) guidelines</li>
                  <li>Implementing data protection best practices</li>
                  <li>Regular security assessments</li>
                  <li>Ethical research protocols</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* User Agreement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <FileText className="w-6 h-6" />
                User Agreement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="font-semibold text-purple-700">
                  By using Bathusi AI, you acknowledge and agree to the following:
                </p>
                
                <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                  <li>I understand this is a research prototype, not a medical device</li>
                  <li>I will not use Bathusi AI for medical diagnosis or treatment decisions</li>
                  <li>I will consult healthcare professionals for medical concerns</li>
                  <li>I understand the limitations and testing nature of this platform</li>
                  <li>I agree to participate responsibly in research activities</li>
                  <li>I have read and understood all disclaimers and warnings</li>
                </ul>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm font-semibold">
                    🚨 If you do not agree with these terms, please do not use Bathusi AI.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Heart className="w-6 h-6" />
                Contact & Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700">
                  For questions, concerns, or to report issues:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
                  <li>Email: research@bathusi-ai.co.za</li>
                  <li>Research Team: University of Pretoria (Affiliation)</li>
                  <li>Emergency Medical Issues: Contact your healthcare provider or emergency services</li>
                </ul>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Remember:</strong> Bathusi AI is designed to support healthcare professionals, 
                    not replace them. Always seek proper medical care from qualified practitioners.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}