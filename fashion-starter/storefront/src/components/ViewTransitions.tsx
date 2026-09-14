"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

// How long the page may stay frozen waiting for the next route. Navigations
// that take longer (e.g. a slow backend) skip the slide rather than keep the
// page frozen.
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
  // view transition is waiting for. A layout effect runs in the same task as
  // the commit, so the timeout can't fire between the two and skip a
  // navigation that already landed.
  React.useLayoutEffect(() => {
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

      // Leave external links, and links that keep the current pathname (only
      // the query string or hash changes), alone: the pathname effect above
      // never fires for those, so the page would just freeze until the timeout.
      if (
        url.origin !== window.location.origin ||
        url.pathname === window.location.pathname
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
              // Dropping the attribute also re-enables the mount animation on
              // the page still on screen, replaying its fade-in — a flash
              // before the next page arrives. Keep that page still.
              document
                .querySelector<HTMLElement>(".page-transition")
                ?.style.setProperty("animation", "none")
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
