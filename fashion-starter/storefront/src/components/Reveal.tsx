"use client"

import * as React from "react"
import { twJoin, twMerge } from "tailwind-merge"

const animationClasses = {
  up: "animate-slide-up",
  down: "animate-slide-down",
  left: "animate-slide-in-left",
  right: "animate-slide-in-right",
} as const

export type RevealProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Direction the content slides in from. */
  direction?: keyof typeof animationClasses
  /** Delay in milliseconds, useful to stagger sibling reveals. */
  delay?: number
  /** How much of the element has to be visible before animating. */
  threshold?: number
  /** Animate immediately on mount instead of waiting for the scroll position. */
  immediate?: boolean
}

export const Reveal: React.FC<RevealProps> = ({
  direction = "up",
  delay = 0,
  threshold = 0.15,
  immediate = false,
  className,
  style,
  children,
  ...rest
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = React.useState(immediate)

  React.useEffect(() => {
    if (immediate) return

    const element = ref.current

    if (!element) return

    // Elements already in view on load (or when the browser lacks support)
    // should not stay hidden.
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [immediate, threshold])

  return (
    <div
      {...rest}
      ref={ref}
      style={delay ? { animationDelay: `${delay}ms`, ...style } : style}
      className={twMerge(
        twJoin(
          "motion-reduce:opacity-100",
          isVisible ? animationClasses[direction] : "opacity-0"
        ),
        className
      )}
    >
      {children}
    </div>
  )
}
