//this file is app/%28routes%29/dashboard/layout.tsx
import React from 'react'
import AppHeader from './_components/AppHeader';

function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <div>
            <AppHeader/>
            <div className='px-10 md:px-20 lg:px-40 py-10'>
              {children}
            </div>
        </div>
    )
}

export default DashboardLayout