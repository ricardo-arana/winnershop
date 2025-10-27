export type Product = {
  id: string
  name: string
  note?: string
}

export type Category = {
  id: string
  name: string
  products: Product[]
}

export type SelectedItem = {
  categoryId: string
  categoryName: string
  product: Product
}

export type ShoppingList = {
  id: string
  name: string
  createdAt: string
  items: SelectedItem[]
}
