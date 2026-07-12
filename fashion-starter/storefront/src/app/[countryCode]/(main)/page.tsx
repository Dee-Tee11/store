import { Metadata } from "next"
import Image from "next/image"
import { getRegion } from "@lib/data/regions"
import { getProductTypesList } from "@lib/data/product-types"
import { Layout, LayoutColumn } from "@/components/Layout"
import { LocalizedLink } from "@/components/LocalizedLink"
import { CollectionsSection } from "@/components/CollectionsSection"

// ---------------------------------------------------------------------------
// Default images (static fallbacks)
// ---------------------------------------------------------------------------
const DEFAULT_HERO_IMAGE = "/images/content/living-room-gray-armchair-two-seater-sofa.png"
const DEFAULT_ABOUT_IMAGE = "/images/content/gray-sofa-against-concrete-wall.png"

interface TemplateImages {
  hero_image: { id: string; url: string } | null
  about_image: { id: string; url: string } | null
}

async function getTemplateImages(): Promise<TemplateImages> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
    const res = await fetch(`${backendUrl}/store/template-images`, {
      next: { revalidate: 60 }, // cache for 60s, stays fresh without full rebuild
    })
    if (!res.ok) return { hero_image: null, about_image: null }
    return res.json()
  } catch {
    return { hero_image: null, about_image: null }
  }
}

export const metadata: Metadata = {
  title: "South Store",
  description:
    "Discover the best in technology, fashion, and much more.",
}

const CategoriesSection: React.FC = () => {
  const categories = [
    { title: "APPLE", desc: "iPhone, iPad, Apple Watch, AirPods and more." },
    { title: "JBL SPEAKERS", desc: "Quality sound for every moment." },
    { title: "DYSON", desc: "Advanced hair dryer technology for your daily routine." },
    { title: "VAPES", desc: "The best devices and accessories." },
    { title: "PERFUMES", desc: "The best fragrances for men and women." },
    { title: "CLOTHING & BRANDS", desc: "All kinds of clothing and brands, for men and women." },
  ]
  return (
    <div className="bg-black text-white py-16 mb-26 md:mb-36">
      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-8">
        <h2 className="text-center text-xl md:text-2xl text-yellow-500 font-bold mb-10 uppercase">Products you can find at South Store</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((c) => (
            <div key={c.title} className="text-center flex flex-col items-center border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-yellow-500 font-bold mb-2 text-md">{c.title}</h3>
              <p className="text-sm text-gray-300">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ProductTypesSection: React.FC = async () => {
  const productTypes = await getProductTypesList(0, 20, [
    "id",
    "value",
    "metadata",
  ])

  if (!productTypes) {
    return null
  }

  return (
    <Layout className="mb-26 md:mb-36 max-md:gap-x-2">
      <LayoutColumn>
        <h3 className="text-md md:text-2xl mb-8 md:mb-15">Our products</h3>
      </LayoutColumn>
      {productTypes.productTypes.map((productType, index) => (
        <LayoutColumn
          key={productType.id}
          start={index % 2 === 0 ? 1 : 7}
          end={index % 2 === 0 ? 7 : 13}
        >
          <LocalizedLink href={`/store?type=${productType.value}`}>
            {typeof productType.metadata?.image === "object" &&
              productType.metadata.image &&
              "url" in productType.metadata.image &&
              typeof productType.metadata.image.url === "string" && (
                <Image
                  src={productType.metadata.image.url}
                  width={1200}
                  height={900}
                  alt={productType.value}
                  className="mb-2 md:mb-8"
                />
              )}
            <p className="text-xs md:text-md">{productType.value}</p>
          </LocalizedLink>
        </LayoutColumn>
      ))}
    </Layout>
  )
}

export default async function Home({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const templateImages = await getTemplateImages()
  const heroImageSrc = templateImages.hero_image?.url ?? DEFAULT_HERO_IMAGE
  const aboutImageSrc = templateImages.about_image?.url ?? DEFAULT_ABOUT_IMAGE

  return (
    <>
      <div className="max-md:pt-18">
        <Image
          src={heroImageSrc}
          width={2880}
          height={1500}
          alt="Living room with gray armchair and two-seater sofa"
          className="md:h-screen md:object-cover"
          unoptimized={!heroImageSrc.startsWith("/")}
        />
      </div>
      <div className="pt-8 pb-26 md:pt-26 md:pb-36">
        <Layout className="mb-26 md:mb-36">
          <LayoutColumn start={1} end={{ base: 13, md: 8 }}>
            <h3 className="text-md max-md:mb-6 md:text-2xl">
              Find the Best Products at South Store
            </h3>
          </LayoutColumn>
          <LayoutColumn start={{ base: 1, md: 9 }} end={13}>
            <div className="flex items-center h-full">
              <div className="md:text-md">
                <p>Technology, Fashion, Perfumes and much more</p>
                <LocalizedLink href="/store" variant="underline">
                  Explore Now
                </LocalizedLink>
              </div>
            </div>
          </LayoutColumn>
        </Layout>
        <CategoriesSection />
        <CollectionsSection className="mb-22 md:mb-36" />
        <Layout>
          <LayoutColumn className="col-span-full">
            <h3 className="text-md md:text-2xl mb-8 md:mb-16">
              About South Store
            </h3>
            <Image
              src={aboutImageSrc}
              width={2496}
              height={1400}
              alt="Gray sofa against concrete wall"
              className="mb-8 md:mb-16 max-md:aspect-[3/2] max-md:object-cover"
              unoptimized={!aboutImageSrc.startsWith("/")}
            />
          </LayoutColumn>
          <LayoutColumn start={1} end={{ base: 13, md: 7 }}>
            <h2 className="text-md md:text-2xl">
              At South Store, you'll find everything you need in one place.
            </h2>
          </LayoutColumn>
          <LayoutColumn
            start={{ base: 1, md: 8 }}
            end={13}
            className="mt-6 md:mt-19"
          >
            <div className="md:text-md">
              <p className="mb-5 md:mb-9">
                We offer the best brands at the best prices. Our mission
                is to bring you the latest trends, from cutting-edge
                technology to exclusive fragrances and fashion.
              </p>
              <p className="mb-5 md:mb-3">
                Whether you're looking for the latest iPhone, or want to renew your
                wardrobe, we are here to offer quality and excellence.
              </p>
              <LocalizedLink href="/about" variant="underline">
                Read more about South Store
              </LocalizedLink>
            </div>
          </LayoutColumn>
        </Layout>
      </div>
    </>
  )
}
