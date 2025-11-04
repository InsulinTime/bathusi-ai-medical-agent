// this file is app/%28routes%29/dashboard/billing/page.tsx
import { PricingTable } from "@clerk/nextjs";
import React from "react";

function Billing(){
    return(
        <div className='px-10 md:px-24 lg:px-48'>
            <h2 className='font-bold text-3xl mb-10'>Join the Subscription</h2>
            <PricingTable />
        </div>
    )
}

export default Billing