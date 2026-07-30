"use client"

import { CommandSearch } from "@/components/CommandSearch"

export function SearchProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CommandSearch />
      {children}
    </>
  )
}
