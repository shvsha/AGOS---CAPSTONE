"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// lib
import { getUserRole } from "@/lib/auth"


export default function Reports() {
  const router = useRouter()
    useEffect(() => {
      const role = getUserRole()
      if (role === "MENRO_Staff") router.replace("/menro/barangay-reports")
    }, [])


  return (
    <div>Reports</div>
  )
}

