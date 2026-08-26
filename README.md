# CRA — Comer Rezar Amar

Menú digital para pedir empanadas, fajitas, papas y bebidas. El cliente arma el pedido y lo envía por WhatsApp. La cocina edita precios, fotos y descripciones desde el panel.

Repo: [Yane2410/crachile](https://github.com/Yane2410/crachile)

## Qué incluye

- Carta con fotos
- Arma tu empanada / arma tu fajita
- Pedido completo a WhatsApp (efectivo o transferencia)
- Panel de la cocina (PIN inicial: `cra2026`)

## Publicar el menú (Vercel, gratis)

Así el sitio queda **siempre visible**, aunque no tengas Grok.

1. Entra a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. **Add New → Project** e importa `crachile`
3. En [neon.tech](https://neon.tech) crea una base Postgres gratis
4. Copia el `DATABASE_URL` de Neon
5. En Vercel → Settings → Environment Variables, pega:

   | Nombre | Valor |
   |---|---|
   | `DATABASE_URL` | la URL de Neon |

6. Deploy

Vercel te da un enlace tipo `crachile.vercel.app`. Ese es el menú público.

Opcional: en Vercel → Domains, apunta el dominio que tengas.

## Después de publicar

1. Abre el enlace
2. Baja al pie → **Panel de la cocina**
3. PIN: `cra2026` (cámbialo en Ajustes)
4. Pon el WhatsApp de pedidos (`569…`)
5. Completa banco, RUT y cuenta para transferencias

Sin el número de WhatsApp, el cliente igual copia el pedido; con el número, se abre el chat de la cocina con el pedido completo.

## Desarrollo local

```bash
npm install
npm run dev
```

Sin `DATABASE_URL` usa una base local de prueba.

## Stack

React, TanStack Start, Tailwind, Postgres (Neon en producción).
