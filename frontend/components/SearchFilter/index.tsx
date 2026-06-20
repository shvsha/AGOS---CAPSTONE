"use client"

// icon
import { FaSearch } from "react-icons/fa"

// shadcn 
import { Input } from "@/components/ui/input"

interface SearchFilterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  width?: string
  height?: string
}

export function SearchFilter({ value, onChange, placeholder = "Search...", width = "w-70", height = 'h-9' }: SearchFilterProps) {
  return (
    <div className={`flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 ${width} ${height}`}>
      <FaSearch size={18} className="text-[#C6C6C8]" />
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] text-[12px] focus-visible:ring-0 h-full w-full"
      />
    </div>
  )
}