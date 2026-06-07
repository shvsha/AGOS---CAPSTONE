"use client"

// shadcn component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"

interface SelectOption {
  label: string
  value: string
}
interface SelectFilterProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  width?: string
}

export function SelectFilter({ value, onChange, options, placeholder = 'Select...', width = 'w-40'}: SelectFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`${width} px-3 py-4.5 bg-[#FAFCFD] border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className={`${width} min-w-0`}
      >
        {options.map(opt => (
          <SelectItem key={opt.value} className="p-2 text-[#122A48]" value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}