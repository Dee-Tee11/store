import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ product_types: [], count: 0, offset: 0, limit: 100 })
}