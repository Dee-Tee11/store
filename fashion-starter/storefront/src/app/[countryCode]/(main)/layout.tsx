import { Metadata } from "next"
import { getBaseURL } from "@lib/util/env"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { PageTransition } from "@/components/PageTransition"
import { ViewTransitions } from "@/components/ViewTransitions"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <ViewTransitions />
      <Header />
      <PageTransition>{props.children}</PageTransition>
      <Footer />
    </>
  )
}
