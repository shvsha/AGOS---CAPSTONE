"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// lib
import { getUserRole } from "@/lib/auth"


export default function BarangayReports() {
  const router = useRouter()
    useEffect(() => {
      const role = getUserRole()
      if (role === "MENRO") router.replace("/menro/reports")
    }, [])


  return (
    <div>BarangayReports</div>
  )
}

