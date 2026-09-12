import { defineCloudflareConfig } from "@opennextjs/cloudflare"

// Configuração mínima: sem cache incremental nem fila de revalidação.
// O storefront vai buscar tudo ao Medusa a cada pedido, que é o correcto
// para preços e stock. Se um dia o tráfego justificar, acrescenta-se aqui
// um cache em KV ou R2.
export default defineCloudflareConfig()
