"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

// Safety net in case the navigation never resolves (e.g. the route only
// changes the query string): the transition must not stay frozen.
const TRANSITION_TIMEOUT = 700

/**
 * Runs client-side navigations inside a view transition, so the current page
 * slides out while the next one slides in (see the ::view-transition rules in
 * globals.css). Browsers without support just navigate as usual.
 */
export const ViewTransitions: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const finishNavigation = React.useRef<(() => void) | null>(null)

  // The new route is in the DOM by the time this runs, which is what the
  // view transition is waiting for.
  React.useEffect(() => {
    const finish = finishNavigation.current

    if (finish) {
      finishNavigation.current = null
      finish()
    }
  }, [pathname])

  React.useEffect(() => {
    if (!("startViewTransition" in document)) return

    const root = document.documentElement

    root.dataset.viewTransitions = "true"

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target

      if (!(target instanceof Element)) return

      const anchor = target.closest("a")

      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return
      }

      const url = new URL(anchor.href, window.location.href)

      // Leave external links, and anchors within the current page, alone.
      if (
        url.origin !== window.location.origin ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search)
      ) {
        return
      }

      event.preventDefault()

      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const timeout = window.setTimeout(() => {
              finishNavigation.current = null
              resolve()
            }, TRANSITION_TIMEOUT)

            finishNavigation.current = () => {
              window.clearTimeout(timeout)
              resolve()
            }

            React.startTransition(() => {
              router.push(`${url.pathname}${url.search}${url.hash}`)
            })
          })
      )
    }

    document.addEventListener("click", handleClick, { capture: true })

    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
      delete root.dataset.viewTransitions
    }
  }, [router])

  return null
}
