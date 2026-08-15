import { Metadata } from "next"
import Image from "next/image"
import { StoreRegion } from "@medusajs/types"
import { listRegions } from "@lib/data/regions"
import {
  getTemplateImages,
  isExternalImage,
} from "@lib/data/template-images"
import { Layout, LayoutColumn } from "@/components/Layout"
import { LocalizedLink } from "@/components/LocalizedLink"
import { CollectionsSection } from "@/components/CollectionsSection"
import { Reveal } from "@/components/Reveal"

export const metadata: Metadata = {
  title: "Brands",
  description: "Explore the brands we carry at South Store",
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

const BrandCard: React.FC<{
  src: string
  name: string
  description: string
  href: string
  className?: string
}> = ({ src, name, description, href, className }) => (
  <LocalizedLink href={href} className={className}>
    <Image
      src={src}
      width={768}
      height={572}
      alt={name}
      className="mb-4 md:mb-6"
      unoptimized={isExternalImage(src)}
    />
    <div className="flex justify-between">
      <div>
        <p className="mb-1">{name}</p>
        <p className="text-grayscale-500 text-xs">{description}</p>
      </div>
    </div>
  </LocalizedLink>
)

export default async function BrandsPage() {
  const images = await getTemplateImages()

  return (
    <>
      <div className="max-md:pt-18">
        <Image
          src={images.brands_hero_image}
          width={2880}
          height={1500}
          alt="Brands at South Store"
          className="md:h-screen md:object-cover mb-8 md:mb-26"
          unoptimized={isExternalImage(images.brands_hero_image)}
        />
      </div>
      <div className="pb-26 md:pb-36 overflow-x-clip">
        <Layout>
          <LayoutColumn start={1} end={{ base: 13, md: 8 }}>
            <Reveal direction="left">
              <h3 className="text-md mb-6 md:mb-16 md:text-2xl">
                Apple, ready to ship &mdash; iPhone, iPad, Watch and AirPods.
              </h3>
              <div className="md:text-md max-md:mb-16 max-w-135">
                <p>
                  The devices you already know, without the wait. We keep the
                  current generation in stock and ship across Europe.
                </p>
              </div>
            </Reveal>
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, md: 9 }} end={13}>
            <Reveal direction="right" delay={100}>
              <BrandCard
                src={images.brands_brand1_image}
                name="Apple"
                description="iPhone, iPad, Watch, AirPods"
                href="/store"
              />
            </Reveal>
          </LayoutColumn>
          <LayoutColumn>
            <Reveal>
              <Image
                src={images.brands_section1_wide}
                width={2496}
                height={1404}
                alt="Technology at South Store"
                className="mt-26 md:mt-36 mb-8 md:mb-26"
                unoptimized={isExternalImage(images.brands_section1_wide)}
              />
            </Reveal>
          </LayoutColumn>
          <LayoutColumn start={1} end={{ base: 13, md: 8 }}>
            <Reveal direction="left">
              <h3 className="text-md mb-6 md:mb-16 md:text-2xl">
                Sound and personal care from names you already trust.
              </h3>
              <div className="md:text-md max-md:mb-16 max-w-135">
                <p>
                  JBL for speakers and headphones that hold up day to day, Dyson
                  for hair care technology that does what it promises.
                </p>
              </div>
            </Reveal>
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, md: 9 }} end={13}>
            <Reveal direction="right" delay={100}>
              <BrandCard
                src={images.brands_brand2_image}
                name="JBL"
                description="Speakers and headphones"
                href="/store"
                className="mb-8 md:mb-16 inline-block"
              />
            </Reveal>
            <Reveal direction="right" delay={200}>
              <BrandCard
                src={images.brands_brand3_image}
                name="Dyson"
                description="Hair care technology"
                href="/store"
              />
            </Reveal>
          </LayoutColumn>
        </Layout>
        <Reveal>
          <Image
            src={images.brands_section2_wide}
            width={2880}
            height={1618}
            alt="Fragrances at South Store"
            className="md:h-screen md:object-cover mt-26 md:mt-36 mb-8 md:mb-26"
            unoptimized={isExternalImage(images.brands_section2_wide)}
          />
        </Reveal>
        <Layout>
          <LayoutColumn start={1} end={{ base: 13, md: 8 }}>
            <Reveal direction="left">
              <h3 className="text-md mb-6 md:mb-16 md:text-2xl">
                Fragrances for every day and for the occasions that matter.
              </h3>
              <div className="md:text-md max-md:mb-16 max-w-135">
                <p>
                  A selection of men&apos;s and women&apos;s fragrances, from
                  the one you reach for every morning to the bottle you save for
                  a night out.
                </p>
              </div>
            </Reveal>
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, md: 9 }} end={13}>
            <Reveal direction="right" delay={100}>
              <BrandCard
                src={images.brands_brand4_image}
                name="Perfumes"
                description="Men's and women's fragrances"
                href="/store"
              />
            </Reveal>
          </LayoutColumn>
        </Layout>
        <CollectionsSection className="mt-26 md:mt-36" />
      </div>
    </>
  )
}
