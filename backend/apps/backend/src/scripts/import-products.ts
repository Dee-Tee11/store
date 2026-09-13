import fs from "fs"
import path from "path"

import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  deleteFilesWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Importa os produtos da lista abaixo: envia as fotos para o storage (R2) e cria
 * produto, categoria e stock. Produtos cujo handle já exista são ignorados, por
 * isso pode correr-se de novo depois de acrescentar produtos à lista.
 *
 * A partir de backend/apps/backend/:
 *
 *   npx medusa exec ./src/scripts/import-products.ts <pasta-das-fotos> dry-run
 *   npx medusa exec ./src/scripts/import-products.ts <pasta-das-fotos>
 *
 * Com dry-run só lê a base de dados e mostra o que ia fazer. Vai como argumento
 * simples porque o `medusa exec` rejeita flags que não conhece (--dry-run).
 */

type ProdutoImport = {
  handle: string
  titulo: string
  descricao: string
  categoria: string
  /** Em euros (o Medusa 2 guarda o valor na unidade principal, não em cêntimos). */
  preco: number | null
  opcao: { titulo: string; valor: string }
  stock: number
  /** Nomes dos ficheiros na pasta; o primeiro é a foto principal. */
  fotos: string[]
}

const PRODUTOS: ProdutoImport[] = [
  {
    handle: "mala-coach",
    titulo: "Mala Coach",
    descricao: "Mala de ombro Coach com aba e corrente dourada.",
    categoria: "Malas",
    preco: 90,
    opcao: { titulo: "Tamanho", valor: "Único" },
    stock: 1,
    fotos: ["coach_4.jpg", "coach_3.jpg", "coach_2.jpg", "coach_1.jpg"],
  },
  {
    handle: "mala-yves-saint-laurent",
    titulo: "Mala Yves Saint Laurent",
    descricao: "Mala de ombro Yves Saint Laurent em pele envernizada preta.",
    categoria: "Malas",
    preco: 90,
    opcao: { titulo: "Tamanho", valor: "Único" },
    stock: 1,
    fotos: ["ysl_1.jpg", "ysl_2.jpg"],
  },
  {
    handle: "mala-gucci-mini",
    titulo: "Mala Gucci Mini",
    descricao: "Mala Gucci em lona GG.",
    categoria: "Malas",
    preco: 90,
    opcao: { titulo: "Tamanho", valor: "Único" },
    stock: 1,
    fotos: ["gucci_mini_6.jpg", "gucci_mini_5.jpg", "gucci_mini_7.jpg", "gucci_mini_4.jpg"],
  },
  {
    handle: "casaco-corteiz",
    titulo: "Casaco Corteiz",
    descricao: "Casaco puffer Corteiz preto com forro amarelo. Tamanho M.",
    categoria: "Casacos",
    preco: 100,
    opcao: { titulo: "Tamanho", valor: "M" },
    stock: 1,
    fotos: ["corteiz_m_2.jpg", "corteiz_m_1.jpg", "corteiz_m_4.jpg"],
  },
  {
    handle: "casaco-nike-nocta",
    titulo: "Casaco Nike x Nocta",
    descricao: "Casaco puffer Nike x Nocta preto. Tamanho M.",
    categoria: "Casacos",
    preco: 100,
    opcao: { titulo: "Tamanho", valor: "M" },
    stock: 1,
    fotos: ["nocta_m_2.jpg", "nocta_m_3.jpg", "nocta_m_1.jpg"],
  },
  {
    handle: "fato-treino-nike-nocta-tech-fleece",
    titulo: "Fato de Treino Nike x Nocta Tech Fleece",
    descricao: "Fato de treino Nike x Nocta Tech Fleece preto, casaco e calças. Tamanho M.",
    categoria: "Casacos",
    preco: 100,
    opcao: { titulo: "Tamanho", valor: "M" },
    stock: 1,
    fotos: ["nocta_tracksuit_1.jpg", "nocta_tracksuit_2.jpg"],
  },
  {
    handle: "coluna-jbl-boombox-3",
    titulo: "Coluna JBL Boombox 3",
    descricao: "Coluna portátil JBL Boombox 3.",
    categoria: "Colunas",
    preco: 100,
    opcao: { titulo: "Modelo", valor: "Boombox 3" },
    stock: 3,
    fotos: [
      "jbl_boombox3_3.jpg",
      "jbl_boombox3_2.jpg",
      "jbl_boombox3_1.jpg",
      "jbl_boombox3_4.jpg",
    ],
  },
  {
    handle: "azzaro-wanted-by-night-50ml",
    titulo: "Azzaro Wanted by Night 50 ml",
    descricao: "Eau de Parfum Azzaro Wanted by Night, 50 ml.",
    categoria: "Perfumes",
    preco: 50,
    opcao: { titulo: "Volume", valor: "50 ml" },
    stock: 1,
    fotos: [
      "azzaro_wanted_night_1.jpg",
      "azzaro_wanted_night_2.jpg",
      "azzaro_wanted_night_3.jpg",
    ],
  },
  {
    handle: "xerjoff-erba-pura-50ml",
    titulo: "Xerjoff Erba Pura 50 ml",
    descricao: "Eau de Parfum Xerjoff Erba Pura, 50 ml.",
    categoria: "Perfumes",
    preco: 80,
    opcao: { titulo: "Volume", valor: "50 ml" },
    stock: 1,
    fotos: ["erba_pura_2.jpg", "erba_pura_1.jpg"],
  },
  {
    handle: "xerjoff-erba-gold-50ml",
    titulo: "Xerjoff Erba Gold 50 ml",
    descricao: "Eau de Parfum Xerjoff Erba Gold, 50 ml.",
    categoria: "Perfumes",
    // Sem preço o produto é ignorado — preencher antes de correr.
    preco: null,
    opcao: { titulo: "Volume", valor: "50 ml" },
    stock: 1,
    fotos: ["erba_gold_1.jpg", "erba_gold_2.jpg"],
  },
]

export default async function importProducts({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const dryRun = args.includes("dry-run")
  const dir = args.find((a) => a !== "dry-run")
  if (!dir) {
    throw new Error("Falta a pasta das fotos: medusa exec ./src/scripts/import-products.ts <pasta>")
  }

  // Valida tudo antes de escrever o que quer que seja.
  const semFoto = PRODUTOS.flatMap((p) =>
    p.fotos.filter((f) => !fs.existsSync(path.join(dir, f))).map((f) => `${p.handle}: ${f}`)
  )
  if (semFoto.length) {
    throw new Error(`Fotos em falta em ${dir}:\n  ${semFoto.join("\n  ")}`)
  }

  const {
    data: [store],
  } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] })
  if (!store?.default_sales_channel_id) {
    throw new Error("A loja não tem sales channel por omissão.")
  }

  const {
    data: [salesChannel],
  } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name", "stock_locations.id", "stock_locations.name"],
    filters: { id: store.default_sales_channel_id },
  })
  const stockLocation = salesChannel?.stock_locations?.[0]
  if (!stockLocation) {
    throw new Error(`O sales channel "${salesChannel?.name}" não tem stock location associada.`)
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "type"],
  })
  const shippingProfile =
    shippingProfiles.find((s) => s.type === "default") ?? shippingProfiles[0]
  if (!shippingProfile) {
    throw new Error("Não há shipping profile.")
  }

  // Sem Portugal numa região, /pt não mostra preços nem deixa fazer checkout.
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["name", "countries.iso_2"],
  })
  if (!regions.some((r) => r.countries?.some((c) => c?.iso_2 === "pt"))) {
    logger.warn("Nenhuma região inclui Portugal (pt): os produtos não vão ter preço em /pt.")
  }

  logger.info(
    `Sales channel "${salesChannel.name}", stock em "${stockLocation.name}"` +
      (dryRun ? " — DRY RUN, nada será gravado" : "")
  )

  const { data: existentes } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { handle: PRODUTOS.map((p) => p.handle) },
  })
  const handlesExistentes = new Set(existentes.map((p) => p.handle))

  const aImportar = PRODUTOS.filter((p) => {
    if (handlesExistentes.has(p.handle)) {
      logger.info(`= ${p.handle}: já existe, ignorado`)
      return false
    }
    if (p.preco === null) {
      logger.warn(`! ${p.handle}: sem preço, ignorado`)
      return false
    }
    return true
  })

  const nomesCategorias = [...new Set(aImportar.map((p) => p.categoria))]
  const { data: categoriasExistentes } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
    filters: { name: nomesCategorias },
  })
  const categoriaId = new Map(categoriasExistentes.map((c) => [c.name, c.id]))
  const categoriasNovas = nomesCategorias.filter((n) => !categoriaId.has(n))

  if (dryRun) {
    if (categoriasNovas.length) {
      logger.info(`+ categorias a criar: ${categoriasNovas.join(", ")}`)
    }
    for (const p of aImportar) {
      logger.info(
        `+ ${p.titulo} — ${p.preco}€ — ${p.categoria} — ${p.opcao.valor} — stock ${p.stock} — ${p.fotos.length} fotos`
      )
    }
    return
  }

  if (categoriasNovas.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: categoriasNovas.map((name) => ({ name, is_active: true })),
      },
    })
    result.forEach((c) => categoriaId.set(c.name, c.id))
    logger.info(`+ categorias criadas: ${categoriasNovas.join(", ")}`)
  }

  for (const p of aImportar) {
    const { result: ficheiros } = await uploadFilesWorkflow(container).run({
      input: {
        files: p.fotos.map((f, i) => ({
          filename: `${p.handle}-${i + 1}${path.extname(f)}`,
          mimeType: "image/jpeg",
          content: fs.readFileSync(path.join(dir, f)).toString("base64"),
          access: "public" as const,
        })),
      },
    })

    let variantId: string
    try {
      const { result } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: p.titulo,
              handle: p.handle,
              description: p.descricao,
              status: ProductStatus.PUBLISHED,
              category_ids: [categoriaId.get(p.categoria)!],
              shipping_profile_id: shippingProfile.id,
              thumbnail: ficheiros[0].url,
              images: ficheiros.map((f) => ({ url: f.url })),
              options: [{ title: p.opcao.titulo, values: [p.opcao.valor] }],
              variants: [
                {
                  title: p.opcao.valor,
                  sku: p.handle.toUpperCase(),
                  manage_inventory: true,
                  allow_backorder: false,
                  options: { [p.opcao.titulo]: p.opcao.valor },
                  prices: [{ amount: p.preco!, currency_code: "eur" }],
                },
              ],
              sales_channels: [{ id: salesChannel.id }],
            },
          ],
        },
      })
      variantId = result[0].variants[0].id
    } catch (e) {
      // Não deixar fotos órfãs no bucket se o produto não chegou a ser criado.
      await deleteFilesWorkflow(container).run({
        input: { ids: ficheiros.map((f) => f.id) },
      })
      throw e
    }

    const {
      data: [variant],
    } = await query.graph({
      entity: "product_variant",
      fields: ["inventory_items.inventory_item_id"],
      filters: { id: variantId },
    })
    const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
    if (!inventoryItemId) {
      logger.warn(`! ${p.handle}: criado, mas sem inventory item — acerta o stock no Admin`)
      continue
    }

    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: [
          {
            inventory_item_id: inventoryItemId,
            location_id: stockLocation.id,
            stocked_quantity: p.stock,
          },
        ],
      },
    })

    logger.info(`+ ${p.titulo} — ${p.preco}€ — stock ${p.stock}`)
  }

  logger.info("Importação concluída.")
}
