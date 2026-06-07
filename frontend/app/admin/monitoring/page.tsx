"use client"

// react
import { useState, useEffect } from 'react'

// shadcn
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"

// components
import { SearchFilter } from '@/components/SearchFilter'
import { SelectFilter } from '@/components/SelectFilter'
import { SpinnerIcon } from '@/components/SpinnerIcon'



export default function Monitoring() {
  // us
  const [search, setSearch] = useState<string>('')
  const [status, setStatus] = useState<string>('All Status')
  const [location, setLocation] = useState<string>('All Location')

  // table state
  const [loading, setLoading] = useState<boolean>(true)

   return (
     <>
      <div className="hidden md:flex flex-col">
        
        {/* header filter */}
        <div className="flex justify-between w-full">
          <div>
            <SearchFilter
              value={search}
              onChange={setSearch}
              placeholder="Search devices or location..."
            />
          </div>

          <div className='flex gap-3'>
            <SelectFilter
              value={status}
              onChange={setStatus}
              placeholder="Select Status"
              options={[
                { label: "All Status", value: "All Status" },
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
                { label: "Offline", value: "Offline" },
              ]}
            />
            <SelectFilter
              value={location}
              onChange={setLocation}
              placeholder="Select Status"
              options={[
                { label: "All Location", value: "All Location" },
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
                { label: "Offline", value: "Offline" },
              ]}
            />
          </div>
        </div>

        <p className='font-bold text-left text-[#122A48] mt-3 mb-3'>Live Map</p>

        {/* map and device status container */}
        <div className='flex gap-4'>
        
          {/* Map */}
          <div className='bg-[#D9D9D9] rounded-lg w-250 h-90 shadow-[0_0_12px_rgba(0,0,0,0.12)]'>
            {/* map here */}
          </div>
          
          {/* Device Status */}
          <div className='rounded-lg shadow-[0_0_12px_rgba(0,0,0,0.12)] bg-[#FAFAFA] p-4 w-100 border border-[#72727280]'>
            <p className='text-[#122A48] font-bold'>Device Status</p>
            <hr className='mt-2' />
            
            {/* Online */}
            <div className='p-5 flex flex-col gap-4'>
              <div className='text-[#2C7B3C] flex justify-between w-full font-semibold'>
                <div className='flex gap-4 items-center'>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2C7B3C]" />
                  <p>Online</p>
                </div>
                <div>
                  <span>20</span>
                </div>
              </div>
              {/* offline */}
              <div className='text-[#D81010] flex justify-between w-full font-semibold'>
                <div className='flex gap-4 items-center'>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D81010]" />
                  <p>Offline</p>
                </div>
                <div>
                  <span>20</span>
                </div>
              </div>
              {/* inactive */}
              <div className='text-[#FF9705] flex justify-between w-full font-semibold'>
                <div className='flex gap-4 items-center'>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF9705]" />
                  <p>Inactive</p>
                </div>
                <div>
                  <span>20</span>
                </div>
              </div>

              <hr />

              <div className='flex justify-between text-[#122A48] font-semibold'>
                <p>Total</p>
                <span>60</span>
              </div>

            </div>
          </div>

        </div>

        {/* Table Live Feed */}
        <div className='h-150 mt-4 bg-[#FAFCFD] rounded-lg shadow-[0_0_12px_rgba(0,0,0,0.12)] text-[#122A48]'>
          <p className='font-bold p-5'>Live Feed</p>
          <Table>
            <TableHeader className='bg-[#e8eef1b4] border-[#727272]'>
              <TableRow>
                <TableHead className="text-[#727272] text-center font-semibold">Device ID</TableHead>
                <TableHead className="text-[#727272] text-center font-semibold">Location</TableHead>
                <TableHead className="text-[#727272] text-center font-semibold">Water Flow</TableHead>
                <TableHead className="text-[#727272] text-center font-semibold">Water Level</TableHead>
                <TableHead className="text-[#727272] text-center font-semibold">Signal</TableHead>
              </TableRow>
            </TableHeader>

            {/* loading state */}
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-54">
                  <div className="flex flex-col items-center gap-3 text-[#122A48]">
                    <SpinnerIcon size={32} color="#122A48" />
                    <span className="text-sm font-medium">Loading Live Feed...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </Table>

        </div>

      </div>
     </>
   )
 }
 

