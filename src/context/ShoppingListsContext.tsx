import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { ShoppingList } from '../types/shopping'

const STORAGE_KEY = 'winnershop:savedLists'

type ShoppingListsContextValue = {
  savedLists: ShoppingList[]
  addList: (list: ShoppingList) => void
  deleteList: (id: string) => void
  getListById: (id: string) => ShoppingList | undefined
}

const ShoppingListsContext = createContext<ShoppingListsContextValue | null>(
  null,
)

type ShoppingListsProviderProps = {
  children: ReactNode
}

const readInitialLists = (): ShoppingList[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ShoppingList[]
  } catch (error) {
    console.warn('No se pudieron leer las listas guardadas', error)
    return []
  }
}

export const ShoppingListsProvider = ({
  children,
}: ShoppingListsProviderProps) => {
  const [savedLists, setSavedLists] = useState<ShoppingList[]>(readInitialLists)

  const persist = useCallback((lists: ShoppingList[]) => {
    setSavedLists(lists)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
    }
  }, [])

  const addList = useCallback(
    (list: ShoppingList) => {
      persist([list, ...savedLists.filter((item) => item.id !== list.id)])
    },
    [persist, savedLists],
  )

  const deleteList = useCallback(
    (id: string) => {
      persist(savedLists.filter((list) => list.id !== id))
    },
    [persist, savedLists],
  )

  const getListById = useCallback(
    (id: string) => savedLists.find((list) => list.id === id),
    [savedLists],
  )

  const value = useMemo(
    () => ({ savedLists, addList, deleteList, getListById }),
    [addList, deleteList, getListById, savedLists],
  )

  return (
    <ShoppingListsContext.Provider value={value}>
      {children}
    </ShoppingListsContext.Provider>
  )
}

export const useShoppingLists = () => {
  const context = useContext(ShoppingListsContext)
  if (!context) {
    throw new Error(
      'useShoppingLists debe usarse dentro de un ShoppingListsProvider',
    )
  }
  return context
}
