"use client"

// icons
import { FaSearch } from "react-icons/fa"
import { FaPlus } from "react-icons/fa6"

// shadcn
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

// react
import { useState } from "react"

export function BarangaySkeleton() {
  // filter states
  const [barangayStatus, setBarangayStatus] = useState<string>('Active')

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* title and filter container */}
        <div className="flex justify-between w-full mb-4">
          <div className="font-bold text-[#122A48] flex justify-center items-center text-lg">
            <p>Barangay</p>
          </div>

          <div className="flex gap-3">
            {/* search filter */}
            <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 h-11">
              <FaSearch size={18} className="text-[#C6C6C8]" />
              <Input
                placeholder="Search Barangay..."
                className="bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-[200px]"
              />
            </div>

            {/* add barangay */}
            <Button
              className="p-5 py-5.5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white" /> Register Barangay
            </Button>

          </div>
        </div>

        {/* total cards */}
        <div className="flex justify-between gap-17 text-[#122A48]">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border-2 border-[#C6C6C8] h-20 flex items-center p-6 gap-3 bg-[#FAFCFD] flex-1"
            >
              {/* icon */}
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />

              {/* text */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* table */}
        <div className="bg-[#FAFCFD] rounded-lg border-2 border-[#C6C6C8] mt-5 pt-4 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] flex flex-col h-[435px]">
          <Skeleton className="h-6 w-32 mx-3 mb-2" />

          <Table>
            <TableHeader className="bg-[#e8eef1b4] border-[#727272]">
              <TableRow>
                {[...Array(4)].map((_, i) => (
                  <TableHead key={i} className="text-center">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {[...Array(4)].map((_, i) => (
                <TableRow key={i} className="border-b border-[#C6C6C8]">

                  {/* ID */}
                  <TableCell className="text-center h-18">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>

                  {/* Barangay Name */}
                  <TableCell className="text-center h-18">
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </TableCell>

                  {/* Location Button */}
                  <TableCell className="text-center h-18">
                    <Skeleton className="h-10 w-28 mx-auto rounded-lg" />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="h-18">
                    <div className="flex gap-3 justify-center">
                      <Skeleton className="h-10 w-20 rounded-lg" />
                      <Skeleton className="h-10 w-24 rounded-lg" />
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#C6C6C8]">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </div>



      </div>

      {/* -------------------------------------------------------------------------------------- */}

      {/* for mobile */}
      <div className="md:hidden text-[#122A48]">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 justify-between mt-3">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        {/* Summary Cards */}
        <div className="flex gap-2 mt-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-[#C6C6C8] h-18 w-26 flex items-center p-2 gap-2"
            >
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />

              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>

        {/* Barangay List */}
        <div className="rounded-lg mt-3">
          <Skeleton className="h-4 w-24 mb-3" />

          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-2 rounded-lg border border-[#C6C6C8] shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)]"
              >
                {/* Top Section */}
                <div className="flex justify-between items-center border-b border-[#C6C6C8] pb-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-10 rounded-md" />
                    <Skeleton className="h-4 w-28" />
                  </div>

                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-3">
                  <Skeleton className="h-11 w-25 rounded-lg" />
                  <Skeleton className="h-11 w-23 rounded-lg" />
                  <Skeleton className="h-11 w-23 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </>
  )
}
