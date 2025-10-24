import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { SessionDetail } from "../medical-agent/[sessionid]/page";
import moment from "moment";

type props={
    record:SessionDetail
}

function ViewReportDialog({record}: props){
    const report: any = record?.report
    const formatDate = moment(record?.createdOn).format("MMMM Do YYYY. h:mm a")

    return(
        <Dialog>
            <DialogTrigger>
                <Button variant={'link'} size={'sm'}>View Report</Button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] overflow-y-auto bg-white shadow-lg p-6'>
                <DialogHeader>
                    <DialogTitle asChild>
                        <h2 className='text-center text-4xl font-semibold text-blue-500'>Medical AI Voice Agent Report</h2>
                    </DialogTitle>
                    <DialogDescription asChild>
                        <div mt-10>
                            <h2 className='font-bold text-blue-500 text-lg'>Video Info:</h2>

                            <div className='grid grid-cols-2'>
                                <h2><span className='font-semibold'>Bathusi Specialisation:</span> {record.selectedBathusi?.specialist}</h2>
                                <h2><span>Consultation Date:</span> {moment(new Date(record?.createdOn)).fromNow()}</h2>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default ViewReportDialog