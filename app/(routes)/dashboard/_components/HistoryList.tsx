"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, {useEffect, useState} from "react"
import AddNewSessionDialog from "./AddNewSessionDialog";
import axios from "axios";
import HistoryTable from "./HistoryTable";
import {SessionDetail} from '../medical-agent/[sessionid]/page';

function HistoryList() {
  const [historyList, setHistoryList] = useState<SessionDetail[]>([]);

  useEffect(()=>{
    GetHistoryList();
  },[])

  const GetHistoryList=async()=>{
    const result=await axios.get('/api/session-chat?sessionId=all');
    console.log(result.data);
    setHistoryList(result.data);
  }

  return (
    <div className='mt-10'>
        {historyList.length ==0?
            <div className='flex items-center flex-col justify-center p-7 border boarder-dashed rounded-2xl boarder-2'>
                < Image src={'/medical-assistance.png'} alt='empty' 
                width={120}
                height={120}
                />
                <h2 className='text-bold text-xl mt-2'>No Recent Consultations</h2>
                <p>You haven't consulted with any of Bathusi-AI's helpers recently.</p>
                <AddNewSessionDialog />
            </div>
            : <div>
                  <HistoryTable historyList={historyList} />
            </div>    
        }
    </div>
  )
}

export default HistoryList