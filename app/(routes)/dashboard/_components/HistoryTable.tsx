//this file is app/%28routes%29/dashboard/_components/HistoryTable.tsx
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SessionDetail } from "../medical-agent/[sessionid]/page";
import { Button } from "@/components/ui/button";
import { Island_Moments } from "next/font/google";
import moment from 'moment'
import ViewReportDialog from "./ViewReportDialog";


type Props={
    historyList: SessionDetail[]
}

function HistoryTable({historyList}:Props){
    return(
        <div>
            <Table>
                <TableCaption>Previous Consultation Reports</TableCaption>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[250px]">Bathusi-AI Specialist</TableHead>
                    <TableHead className="w-[250px]">Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {historyList.map((record:SessionDetail,index:number)=>(
                        <TableRow key={record.sessionId}>
                            <TableCell className="font-medium">{record.selectedBathusi.specialist}</TableCell>
                            <TableCell>{record.notes}</TableCell>
                            <TableCell>{moment(new Date(record.createdOn)).fromNow() }</TableCell>
                            <TableCell className="text-right"><ViewReportDialog record={record}/></TableCell>
                        </TableRow>
                    ))}
                    
                </TableBody>
                </Table>
        </div>
    )
}

export default HistoryTable