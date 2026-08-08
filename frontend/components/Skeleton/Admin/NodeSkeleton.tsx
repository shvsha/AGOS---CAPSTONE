"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

import { FaSearch, FaPlus } from "react-icons/fa"
import { useState } from "react"

export function NodeSkeleton() {
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("All Status")

  return (
    <div className="hidden md:flex flex-col">

      {/* Header */}
      <div className="flex justify-between w-full">
        <div className="font-bold text-[#122A48] flex justify-center items-center text-[15px]">
          <p>Node Management</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 h-9 w-60">
            <FaSearch size={14} className="text-[#C6C6C8]" />
            <Input disabled placeholder="Search node..." className="text-xs bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-full" />
          </div>

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="text-xs cursor-pointer w-36 px-3 py-[16px] bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem className="cursor-pointer p-2 text-xs" value="All Status">All Status</SelectItem>
            </SelectContent>
          </Select>

          <Button disabled className="p-5 py-[16px] rounded-lg bg-[#1565BC] text-white opacity-60 shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]">
            <FaPlus color="white" /> Add Node
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex justify-between w-full text-[#122A48] mt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border-2 border-[#C6C6C8] h-17 w-100 flex items-center p-3 gap-3 bg-[#FAFCFD] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]">
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex gap-4 mt-2 h-132 overflow-visible">
        <div className="bg-[#FAFCFD] border border-[#00000040] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] w-full rounded-lg flex flex-col">
          <Skeleton className="h-4 w-32 m-2" />

          <Table>
            <TableHeader className="bg-[#e8eef1b4] border border-[#CFD8DC]">
              <TableRow>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">NODE ID</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">NODE NAME</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">AVAILABILITY</TableHead>
                <TableHead className="font-semibold text-left text-xs text-[#727272]">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(6)].map((_, i) => (
                <TableRow key={i} className="border-b border-[#C6C6C8]">
                  <TableCell className="h-14"><Skeleton className="h-3.5 w-6" /></TableCell>
                  <TableCell className="h-14"><Skeleton className="h-3.5 w-28" /></TableCell>
                  <TableCell className="h-14"><Skeleton className="h-6 w-22 rounded-full" /></TableCell>
                  <TableCell className="h-14">
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-20 rounded-lg" />
                      <Skeleton className="h-9 w-9 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-auto flex items-center justify-between px-4 py-3 border-t border-[#C6C6C8]">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}