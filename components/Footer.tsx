// File: components/Footer.tsx
import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Bathusi AI</h3>
            <p className="text-gray-400 text-sm mb-4">
              AI-powered healthcare assistant for South Africa. Currently in research and testing phase.
            </p>
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-red-200 text-xs font-semibold">
                ⚠️ RESEARCH PROTOTYPE - NOT SAHPRA APPROVED
              </p>
              <p className="text-red-300 text-xs mt-1">
                Not for medical diagnosis or treatment
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Information</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/research" className="hover:text-white transition-colors">
                  Research Information
                </Link>
              </li>
            </ul>
          </div>

          {/* Medical Disclaimer */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Important Notice</h3>
            <div className="text-xs text-gray-400 space-y-2">
              <p>
                🏥 <strong>Not a medical device</strong>
              </p>
              <p>
                🔬 <strong>Research phase only</strong>
              </p>
              <p>
                ⚕️ <strong>Consult healthcare professionals</strong>
              </p>
              <p className="text-red-300 mt-2">
                Not approved by SAHPRA or HPCSA
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Bathusi AI. Research platform - 
            All health information is for educational purposes only.
          </p>
        </div>
      </div>
    </footer>
  )
}