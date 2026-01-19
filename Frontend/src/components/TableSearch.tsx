"use client"

import Image from "next/image"
import { useState } from "react"

const TableSearch = ({ onSearch }: { onSearch?: (search: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Don't search on every character - only update the input value
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
        <Image src="/search.png" alt="" width={14} height={14}/>
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-[200px] p-2 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
          value={searchTerm}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
    </div>
  )
}

export default TableSearch