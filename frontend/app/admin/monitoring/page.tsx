"use client"

// react
import { useState, useEffect } from 'react'

// shadcn
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

// components
import { SpinnerIcon } from '@/components/SpinnerIcon'



export default function Monitoring() {
  // us
  const [search, setSearch] = useState<string>('')
  const [status, setStatus] = useState<string>('All Status')
  const [location, setLocation] = useState<string>('All Location')

  // table state
  const [loading, setLoading] = useState<boolean>(true)

   return (
     <>
      <div className="hidden md:flex flex-col">
        
      </div>
     </>
   )
 }
 

