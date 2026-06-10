"use client"

import dynamic from "next/dynamic"
import { SpinnerIcon } from "@/components/SpinnerIcon"

const BarangayMap = dynamic(() => import("./BarangayMap"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-full w-full">
      <SpinnerIcon size={24} color="#122A48" />
    </div>
  ),
})

type Props = {
  latitude?: number
  longitude?: number
  label?: string
  zoom?: number
}

export default function BarangayMapWrapper(props: Props) {
  return <BarangayMap {...props} />
}