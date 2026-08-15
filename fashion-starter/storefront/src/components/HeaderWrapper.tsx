"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useCountryCode } from "hooks/country-code"

export const HeaderWrapper: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const pathName = usePathname()
  const countryCode = useCountryCode()
  const currentPath = countryCode
    ? pathName.split(`/${countryCode}`)[1]
    : pathName
  const isPageWithHeroImage =
    !currentPath ||
    currentPath === "/" ||
    currentPath === "/about" ||
    currentPath === "/brands" ||
    currentPath.startsWith("/collections")
  const isAlwaysSticky =
    currentPath.startsWith("/auth") || currentPath.startsWith("/account")

  React.useEffect(() => {
    if (isAlwaysSticky) {
      return
    }

    const headerElement = document.querySelector("#site-header")

    if (!headerElement) {
      return
    }

    // The page transition wrapper is not part of the layout, so measure the
    // page's own first section rather than the wrapper around all of it.
    const sibling = headerElement.nextElementSibling
    const nextElement = sibling?.classList.contains("page-transition")
      ? sibling.firstElementChild
      : sibling
    let triggerPosition = 0

    const updateTriggerPosition = () => {
      if (isPageWithHeroImage) {
        triggerPosition = nextElement
          ? Math.max(nextElement.clientHeight - headerElement.clientHeight, 1)
          : 200
      } else {
        triggerPosition = nextElement
          ? Math.max(
              Number.parseInt(
                window.getComputedStyle(nextElement).paddingTop,
                10
              ) - headerElement.clientHeight,
              1
            )
          : 1
      }
    }

    const handleScroll = () => {
      const position = window.scrollY

      headerElement.setAttribute(
        "data-sticky",
        position > triggerPosition ? "true" : "false"
      )
    }

    updateTriggerPosition()
    handleScroll()

    window.addEventListener("resize", updateTriggerPosition, {
      passive: true,
    })
    window.addEventListener("orientationchange", updateTriggerPosition, {
      passive: true,
    })
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener("resize", updateTriggerPosition)
      window.removeEventListener("orientationchange", updateTriggerPosition)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [pathName, isPageWithHeroImage, isAlwaysSticky])

  return (
    <div
      id="site-header"
      className="top-0 left-0 w-full max-md:bg-grayscale-50 data-[light=true]:md:text-white data-[sticky=true]:md:bg-white data-[sticky=true]:md:text-black transition-colors fixed z-40 group"
      data-light={isPageWithHeroImage}
      data-sticky={isAlwaysSticky}
    >
      {children}
    </div>
  )
}
