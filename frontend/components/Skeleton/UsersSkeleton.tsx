"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

import { FaSearch } from "react-icons/fa"
import { FaPlus } from "react-icons/fa6"

// react
import { useState } from "react"

export function UsersSkeleton() {
  const [userRole, setUserRole] = useState<string>('All')
  const [userStatus, setUserStatus] = useState<string>('Active')

  return (
    <>
      <div className="hidden md:flex flex-col">

        {/* title and filter container */}
        <div className="flex justify-between w-full mb-4">
          <div className="font-bold text-[#122A48] flex justify-center items-center text-lg">
            <p>System Users</p>
          </div>

          <div className="flex gap-3">

            {/* search filter */}
            <div className="flex items-center bg-[#FAFCFD] border-2 border-[#C6C6C8] rounded-lg px-3 gap-2 h-11">
              <FaSearch size={18} className="text-[#C6C6C8]" />
              <Input
                placeholder="Search Users..."
                className="bg-transparent border-0 rounded-lg placeholder:text-gray text-[#122A48] focus-visible:ring-0 h-7 w-[200px]"
              />
            </div>

            {/* user role filter */}
            <Select value={userRole} onValueChange={setUserRole}>
              <SelectTrigger className="w-27 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-27 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="All">All Users</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="MENRO">MENRO</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Barangay">Barangay</SelectItem>
              </SelectContent>
            </Select>

            {/* user status filter */}
            <Select value={userStatus} onValueChange={setUserStatus}>
              <SelectTrigger className="w-27 px-3 py-5 bg-white border-2 border-[#C6C6C8] text-[#122A48] rounded-lg font-medium">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent position="popper" className='w-27 min-w-0'>
                <SelectItem className="p-2 text-[#122A48]" value="All">All Status</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Active">Active</SelectItem>
                <SelectItem className="p-2 text-[#122A48]" value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* add user */}
            <Button
              className="p-5 py-5.5 rounded-lg cursor-pointer bg-[#1565BC] hover:bg-[#135499] text-white shadow-[0_6px_4px_-4px_rgba(0,0,0,0.2)]"
            >
              <FaPlus color="white" /> Add User
            </Button>

          </div>

        </div>

        {/* header total cards */}
        <div className="flex justify-between w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border-2 border-[#C6C6C8] h-20 w-85 flex items-center p-6 gap-3 bg-[#FAFCFD]">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          ))}
        </div>
        
        {/* table */}
        <div className="bg-[#FAFCFD] rounded-lg border-2 border-[#C6C6C8] mt-5 pt-4 shadow-[0_5px_4px_-4px_rgba(0,0,0,0.2)] flex flex-col h-[435px]">
      
        {/* table title */}
        <Skeleton className="h-4 w-32 mx-3 mb-2" />

        {/* table */}
        <div className="h-84">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(5)].map((_, i) => (
                  <TableHead key={i} className="text-center">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(4)].map((_, i) => (
                <TableRow key={i} className="border-0">

                  {/* ID */}
                  <TableCell className="text-center h-18">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </TableCell>

                  {/* User (avatar + name + email) */}
                  <TableCell className="h-18">
                    <div className="flex gap-3 justify-center items-center">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell className="text-center h-18">
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center h-18">
                    <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="h-18">
                    <div className="flex gap-2 justify-center">
                      <Skeleton className="h-9 w-16 rounded-lg" />
                      <Skeleton className="h-9 w-24 rounded-lg" />
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      
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

      {/* ----------------------------------------------------------------------------------- */}

      {/* mobile */}
      <div className="md:hidden flex flex-col">

        {/* title + add button */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* search + filter */}
        <div className="flex gap-2 justify-between mt-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>

        {/* cards row 1 */}
        <div className="flex gap-2 mt-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-lg border border-[#C6C6C8] h-18 w-40 flex items-center p-3 gap-3 bg-[#FAFCFD]">
              <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* cards row 2 */}
        <div className="flex gap-2 mt-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-lg border border-[#C6C6C8] h-18 flex-1 flex items-center p-3 gap-3 bg-[#FAFCFD]">
              <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* mobile user cards list */}
        <div className="rounded-lg bg-[#FAFAFA] mt-3 border border-[#C6C6C8]">
          <Skeleton className="h-4 w-28 m-3" />
          <hr />
          <div className="flex flex-col divide-y divide-[#C6C6C8]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                {/* avatar */}
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                {/* info */}
                <div className="flex flex-col flex-1 gap-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <div className="flex gap-2 mt-0.5">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                </div>
                {/* action button */}
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

      </div>
      
    </>
  )
}

