import type { SelectedItem } from '../types/shopping'

export type GroupedCategory = {
  categoryId: string
  categoryName: string
  items: SelectedItem[]
}

export const groupByCategory = (items: SelectedItem[]): GroupedCategory[] => {
  const map = new Map<string, GroupedCategory>()

  items.forEach((item) => {
    const existing = map.get(item.categoryId)
    if (existing) {
      existing.items.push(item)
      return
    }

    map.set(item.categoryId, {
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      items: [item],
    })
  })

  return Array.from(map.values())
}

export const buildPrintableHtml = (
  name: string,
  grouped: GroupedCategory[],
) => {
  const sections = grouped
    .map(
      (group) => `
        <section>
          <h2>${group.categoryName}</h2>
          <ul>
            ${group.items.map((item) => `<li>${item.product.name}</li>`).join('')}
          </ul>
        </section>
      `,
    )
    .join('')

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; margin: 2rem; color: #1f2933; }
          h1 { margin-bottom: 0.5rem; }
          h2 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
          ul { margin: 0; padding-left: 1.25rem; }
          li { margin-bottom: 0.25rem; }
          .meta { color: #6b7280; margin-bottom: 1.5rem; }
          @media print {
            body { margin: 0.5in; }
          }
        </style>
      </head>
      <body>
        <h1>${name}</h1>
        <p class="meta">Generada el ${new Date().toLocaleString()}</p>
        ${sections}
      </body>
    </html>
  `
}
