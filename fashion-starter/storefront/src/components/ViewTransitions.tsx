"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

// How long the page may stay frozen waiting for the next route. Navigations
// that take longer (a slow backend, or only the query string changing) skip
// the slide rather than keep the page frozen.
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

      // A previous slow navigation may have handed over to the mount animation.
      root.dataset.viewTransitions = "true"

      const transition = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const timeout = window.setTimeout(() => {
              // The next page isn't in the DOM yet. Resolving the transition
              // now would slide the current page into itself and then swap to
              // the new one with no animation, so skip the slide instead and
              // let PageTransition's mount animation run when the page lands.
              finishNavigation.current = null
              transition.skipTransition()
              delete root.dataset.viewTransitions
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
