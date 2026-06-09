" use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
}

export function TablePagination({ totalItems, itemsPerPage, currentPage, onPageChange } : Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
 
  if (totalPages <= 1) return null
 
  const isFirst = currentPage === 1
  const isLast  = currentPage === totalPages

  return (
    <div className="border-t border-[#C6C6C8] flex justify-between">
      <div className="p-4 text-[#88898D] text-[13px]">
        <p>
          Page
          <span> {currentPage}</span> of <span>{totalPages}</span>
        </p>
      </div>

      <div className="flex gap-4 mt-3 mr-4 font-medium">
        <Button
          className="text-[#88898D] text-[13px] bg-[#FAFCFD] hover:bg-[#e9eff3] cursor-pointer border border-[#C6C6C8]"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
        >
          <ChevronLeft/>
          Previous
        </Button>
        <Button
          className="text-[#88898D] text-[13px] bg-[#FAFCFD] hover:bg-[#e9eff3] cursor-pointer border border-[#C6C6C8]"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
        >
          Next
          <ChevronRight/>
        </Button>
      </div>

    </div>
  )
}