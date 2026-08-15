"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

/**
 * Replays a short slide-in whenever the route changes, so navigations don't
 * swap the page content abruptly.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname()

  return (
    <div
      key={pathname}
      className="page-transition animate-page-in motion-reduce:animate-none"
    >
      {children}
    </div>
  )
}
