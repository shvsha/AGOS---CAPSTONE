"use client"
import { useSearchParams } from "next/navigation"

export default function Form() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const isEdit = !!id

  return (
    <>
      <div className="hidden md:flex flex-col">

      </div>
    </>
  )
}
