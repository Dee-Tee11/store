import { Metadata } from "next"
import Image from "next/image"
import { StoreRegion } from "@medusajs/types"
import { listRegions } from "@lib/data/regions"
import {
  getTemplateImages,
  isExternalImage,
} from "@lib/data/template-images"
import { Layout, LayoutColumn } from "@/components/Layout"

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about South Store",
}

export async function generateStaticParams() {
  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions.flatMap((r) =>
      r.countries
        ? r.countries
            .map((c) => c.iso_2)
            .filter(
              (value): value is string =>
                typeof value === "string" && Boolean(value)
            )
        : []
    )
  )

  const staticParams = countryCodes.map((countryCode) => ({
    countryCode,
  }))

  return staticParams
}

export default async function AboutPage() {
  const images = await getTemplateImages()

  return (
    <>
      <div className="max-md:pt-18">
        <Image
          src={images.about_page_hero}
          width={2880}
          height={1500}
          alt="South Store"
          className="md:h-screen md:object-cover"
          unoptimized={isExternalImage(images.about_page_hero)}
        />
      </div>
      <div className="pt-8 md:pt-26 pb-26 md:pb-36">
        <Layout>
          <LayoutColumn start={1} end={{ base: 13, lg: 7 }}>
            <h3 className="text-md max-lg:mb-6 md:text-2xl">
              South Store brings the brands you actually want into one place.
            </h3>
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, lg: 8 }} end={13}>
            <div className="md:text-md lg:mt-18">
              <p className="mb-5 lg:mb-9">
                Welcome to South Store. We sell technology, fragrances and
                fashion &mdash; from the latest Apple devices and JBL speakers
                to Dyson hair care, perfumes and clothing from the labels people
                are actually looking for.
              </p>
              <p>
                Instead of an endless catalogue, we keep a focused selection.
                Everything we list is something we would recommend to a friend,
                at a price that makes sense.
              </p>
            </div>
          </LayoutColumn>
          <LayoutColumn>
            <Image
              src={images.about_page_image1}
              width={2496}
              height={1404}
              alt="South Store products"
              className="mt-26 lg:mt-36 mb-8 lg:mb-26"
              unoptimized={isExternalImage(images.about_page_image1)}
            />
          </LayoutColumn>
          <LayoutColumn start={1} end={{ base: 13, lg: 8 }}>
            <h3 className="text-md lg:mb-10 mb-6 md:text-2xl">
              Every product we list is chosen, not just stocked.
            </h3>
          </LayoutColumn>
          <LayoutColumn start={1} end={{ base: 13, lg: 6 }}>
            <div className="mb-16 lg:mb-26">
              <p className="mb-5 md:mb-9">
                Our range is built around a few clear categories: consumer
                technology, audio, personal care, fragrances and clothing. We
                work with trusted suppliers and check what we receive before it
                reaches you, so what you order is what shows up at your door.
              </p>
              <p>
                We&apos;d rather carry fewer references and know each one well
                than list thousands of products we can&apos;t stand behind. If
                something isn&apos;t up to standard, it doesn&apos;t make it
                into the store.
              </p>
            </div>
          </LayoutColumn>
          <LayoutColumn start={{ base: 2, lg: 1 }} end={{ base: 12, lg: 7 }}>
            <Image
              src={images.about_page_image2}
              width={1200}
              height={1600}
              alt="South Store selection"
              className="mb-16 lg:mb-46"
              unoptimized={isExternalImage(images.about_page_image2)}
            />
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, lg: 8 }} end={13}>
            <div className="mb-6 lg:mb-20 xl:mb-36">
              <p>
                Tastes differ, so our selection spans the practical and the
                indulgent: a phone or a pair of headphones you&apos;ll use every
                day, a fragrance for a specific occasion, a piece of clothing
                you&apos;ll keep for years. Whether you know exactly what
                you&apos;re after or you&apos;re still browsing, the aim is the
                same &mdash; make it easy to find the right thing without
                digging through noise.
              </p>
            </div>
            <div className="md:text-md max-lg:mb-26">
              <p>
                We ship across Europe, with clear pricing and no surprises at
                checkout. Shipping costs and delivery times are shown before you
                pay, and our team is reachable if anything needs sorting out.
              </p>
            </div>
          </LayoutColumn>
        </Layout>
        <Image
          src={images.about_page_wide}
          width={2880}
          height={1618}
          alt="South Store"
          className="mb-8 lg:mb-26"
          unoptimized={isExternalImage(images.about_page_wide)}
        />
        <Layout>
          <LayoutColumn start={1} end={{ base: 13, lg: 7 }}>
            <h3 className="text-md max-lg:mb-6 md:text-2xl">
              Our customers are at the center of everything we do!
            </h3>
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, lg: 8 }} end={13}>
            <div className="md:text-md lg:mt-18">
              <p className="mb-5 lg:mb-9">
                Our team is here to help guide you through the process, offering
                personalised support to ensure that you find exactly what
                you&apos;re looking for.
              </p>
              <p>
                From the first question to the moment your order arrives, we
                want the experience to be straightforward. Thank you for
                choosing South Store!
              </p>
            </div>
          </LayoutColumn>
        </Layout>
      </div>
    </>
  )
}
