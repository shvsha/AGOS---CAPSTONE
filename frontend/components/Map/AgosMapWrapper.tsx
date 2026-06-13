"use client"

import { MapMarker } from "./AgosMap"
import dynamic from "next/dynamic"
import { SpinnerIcon } from "@/components/SpinnerIcon"

const BarangayMap = dynamic(() => import("./AgosMap"), {
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
  markers?: MapMarker[]
}

export default function AgosMapWrapper(props: Props) {
  return <BarangayMap {...props} />
}