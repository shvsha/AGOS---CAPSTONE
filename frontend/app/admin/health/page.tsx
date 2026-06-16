"use client"

// icons
import { BatteryMedium, Signal, ScanSearch, Radar } from "lucide-react";


type HealthContext = {
  battery_voltage?: number
  signal_strength?: number
  sensor_continuity?: boolean
  health_status?: string
  checked_at?: string
}

export default function Health() {
   return (
     <>
      <div className="hidden md:flex flex-col">
        
        {/* header cards */}
        {/* <div className="flex justify-between w-full text-[#122A48] mt-3">
          {[
            { icon: <RadioTower size={20} color="#2C7B3C" />, bg: "bg-[#CDE3DE]", count: total,    label: "Total Sensor Nodes" },
            { icon: <Activity   size={20} color="#D81010" />, bg: "bg-[#FFE5E5]", count: overflow,  label: "Overflow Events"    },
            { icon: <TriangleAlert size={20} color="#FF9705" />, bg: "bg-[#F4E4A7]", count: warning, label: "Warning"           },
            { icon: <Waves      size={20} color="#1868A9" />, bg: "bg-[#1868A929]", count: normal,  label: "Normal"             },
          ].map(card => (
            <div key={card.label} className="rounded-lg border-2 border-[#C6C6C8] h-20 w-85 flex items-center p-6 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
              <div className={`${card.bg} rounded-lg p-2`}>{card.icon}</div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{card.count}</span>
                <p className="text-sm">{card.label}</p>
              </div>
            </div>
          ))}
        </div> */}

        
        
      </div>
     </>
   )
 }
 

