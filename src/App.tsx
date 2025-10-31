import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  chakra,
  Card,
  CardBody,
  CardHeader,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Flex,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  useBreakpointValue,
  useColorMode,
  useToast,
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { SearchIcon } from '@chakra-ui/icons'
import categoriesData from './data/products.json'
import type { Category, SelectedItem, ShoppingList } from './types/shopping'
import './App.css'

const categories = categoriesData as Category[]
const STORAGE_KEY = 'winnershop:savedLists'

type SelectionState = Record<string, Set<string>>

const App = () => {
  const toast = useToast()
  const { colorMode, toggleColorMode } = useColorMode()
  const actionsDirection =
    useBreakpointValue<'column' | 'row'>({ base: 'column', md: 'row' }) ??
    'column'
  const [selectedProducts, setSelectedProducts] = useState<SelectionState>({})
  const [listName, setListName] = useState('')
  const [shouldPersist, setShouldPersist] = useState(true)
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [savedLists, setSavedLists] = useState<ShoppingList[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw) as ShoppingList[]
    } catch (error) {
      console.warn('No se pudieron leer las listas guardadas', error)
      return []
    }
  })

  const selectedCount = useMemo(
    () =>
      Object.values(selectedProducts).reduce(
        (total, set) => total + set.size,
        0,
      ),
    [selectedProducts],
  )

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return categories
    return categories
      .map((category) => {
        const filteredProducts = category.products.filter((product) =>
          product.name.toLowerCase().includes(term),
        )
        return {
          ...category,
          products: filteredProducts,
        }
      })
      .filter((category) => category.products.length > 0)
  }, [searchTerm])

  const markdownPreview = useMemo(() => {
    if (!currentList) return ''
    const lines = [
      `# ${currentList.name}`,
      '',
      `Creada: ${new Date(currentList.createdAt).toLocaleString()}`,
      '',
    ]
    const grouped = groupByCategory(currentList.items)
    grouped.forEach(({ categoryName, items }) => {
      lines.push(`## ${categoryName}`)
      items.forEach((item) => lines.push(`- [ ] ${item.product.name}`))
      lines.push('')
    })
    return lines.join('\n').trim()
  }, [currentList])

  const persistLists = (lists: ShoppingList[]) => {
    setSavedLists(lists)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
    }
  }

  const handleToggleProduct = (categoryId: string, productId: string) => {
    setSelectedProducts((prev) => {
      const next: SelectionState = { ...prev }
      const set = new Set(next[categoryId] ?? [])

      if (set.has(productId)) {
        set.delete(productId)
      } else {
        set.add(productId)
      }

      if (set.size === 0) {
        delete next[categoryId]
      } else {
        next[categoryId] = set
      }

      return next
    })
  }

  const handleGenerateList = () => {
    const items = buildSelectedItems(selectedProducts)

    if (items.length === 0) {
      toast({
        title: 'Selecciona productos',
        description: 'Escoge al menos un producto para generar la lista.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      })
      return
    }

    const safeName = listName.trim() || 'Lista sin nombre'
    const newList: ShoppingList = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: safeName,
      createdAt: new Date().toISOString(),
      items,
    }

    setCurrentList(newList)

    if (shouldPersist) {
      persistLists([newList, ...savedLists])
      toast({
        title: 'Lista guardada',
        description: 'Quedara disponible en este navegador.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Lista creada',
        description: 'Puedes exportarla o imprimirla ahora.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleCopyMarkdown = async () => {
    if (!markdownPreview) return
    try {
      await navigator.clipboard.writeText(markdownPreview)
      toast({
        title: 'Markdown copiado',
        status: 'success',
        duration: 2500,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'No se pudo copiar',
        description: 'Intenta de nuevo o descarga el archivo.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      console.error(error)
    }
  }

  const handleDownloadMarkdown = () => {
    if (!markdownPreview || !currentList) return
    const blob = new Blob([markdownPreview], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentList.name.replace(/\s+/g, '-').toLowerCase()}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePrintableView = () => {
    if (!currentList) return
    const grouped = groupByCategory(currentList.items)
    const html = buildPrintableHtml(currentList.name, grouped)
    const win = window.open('', '_blank')
    if (!win) {
      toast({
        title: 'No se pudo abrir la vista',
        description: 'Verifica los bloqueadores de ventanas emergentes.',
        status: 'error',
        duration: 4000,
      })
      return
    }
    win.document.write(html)
    win.document.close()
  }

  const handleApplySavedList = (list: ShoppingList) => {
        setCurrentList(list)
        setListName(list.name)
    const restored: SelectionState = {}
    list.items.forEach((item) => {
      const set = restored[item.categoryId] ?? new Set<string>()
      set.add(item.product.id)
      restored[item.categoryId] = set
    })
    setSelectedProducts(restored)
    toast({
      title: 'Lista cargada',
      description: 'Puedes seguir editandola y generar una nueva version.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleDeleteList = (id: string) => {
    const filtered = savedLists.filter((list) => list.id !== id)
    persistLists(filtered)
    if (currentList?.id === id) {
      setCurrentList(null)
    }
    toast({
      title: 'Lista eliminada',
      status: 'info',
      duration: 2500,
      isClosable: true,
    })
  }

  const handleClearSelection = () => {
    setSelectedProducts({})
    setCurrentList(null)
  }

  return (
    <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }}>
      <Stack spacing={{ base: 8, md: 10 }}>
        <Stack spacing={3}>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', sm: 'center' }}
            gap={4}
          >
            <Box>
              <Heading size="xl">WinnerShop</Heading>
              <Text color="gray.600" _dark={{ color: 'gray.300' }}>
                Selecciona productos por categoria y genera listas listas para
                imprimir o exportar a Markdown.
              </Text>
            </Box>
            <IconButton
              onClick={toggleColorMode}
              aria-label={
                colorMode === 'light'
                  ? 'Activar modo oscuro'
                  : 'Activar modo claro'
              }
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              variant="outline"
              alignSelf={{ base: 'flex-start', sm: 'center' }}
            />
          </Flex>
        </Stack>

        <Stack spacing={4}>
          <Heading size="md">Categorias</Heading>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={4}
            align="stretch"
            as="form"
            onSubmit={(event) => event.preventDefault()}
          >
            <FormControl>
              <FormLabel fontWeight="medium">Filtrar productos</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Escribe el nombre de un producto"
                  aria-label="Filtrar productos por nombre"
                />
              </InputGroup>
            </FormControl>
            {searchTerm.trim() && (
              <Button
                alignSelf={{ base: 'stretch', md: 'flex-end' }}
                onClick={() => setSearchTerm('')}
                variant="ghost"
              >
                Limpiar filtro
              </Button>
            )}
          </Stack>
          {searchTerm.trim() && filteredCategories.length === 0 ? (
            <chakra.p color="gray.500">
              No encontramos productos que coincidan con{' '}
              <chakra.span fontWeight="semibold">{searchTerm}</chakra.span>.
              Intenta con otro termino.
            </chakra.p>
          ) : null}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 6 }}>
            {filteredCategories.map((category) => {
              const currentCount = selectedProducts[category.id]?.size ?? 0
              return (
                <Card
                  key={category.id}
                  borderWidth="1px"
                  borderColor={currentCount ? 'green.300' : 'gray.100'}
                >
                  <CardHeader
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Heading size="sm">{category.name}</Heading>
                    <Badge colorScheme={currentCount ? 'green' : 'gray'}>
                      {currentCount} seleccionados
                    </Badge>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={2}>
                      {category.products.map((product) => {
                        const checked =
                          selectedProducts[category.id]?.has(product.id) ??
                          false
                        return (
                          <Button
                            key={product.id}
                            justifyContent="flex-start"
                            variant={checked ? 'solid' : 'outline'}
                            colorScheme={checked ? 'green' : 'gray'}
                            onClick={() =>
                              handleToggleProduct(category.id, product.id)
                            }
                            w="full"
                          >
                            {product.name}
                          </Button>
                        )
                      })}
                    </Stack>
                  </CardBody>
                </Card>
              )
            })}
          </SimpleGrid>
          <Stack direction={actionsDirection} spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Nombre de la lista</FormLabel>
              <Input
                value={listName}
                onChange={(event) => setListName(event.target.value)}
                placeholder="Ej. Compras de la semana"
              />
            </FormControl>
            <FormControl
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <FormLabel mb="0">Guardar en este dispositivo</FormLabel>
              <Switch
                colorScheme="green"
                isChecked={shouldPersist}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setShouldPersist(event.target.checked)
                }
              />
            </FormControl>
            <Button
              colorScheme="green"
              onClick={handleGenerateList}
              minW={{ base: 'full', md: '200px' }}
            >
              Generar lista ({selectedCount})
            </Button>
            <Button
              variant="ghost"
              colorScheme="gray"
              onClick={handleClearSelection}
              minW={{ base: 'full', md: 'auto' }}
            >
              Reiniciar
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={4}>
          <Heading size="md">Lista activa</Heading>
          {currentList ? (
            <Card>
              <CardHeader
                display="flex"
                justifyContent="space-between"
                alignItems={{ base: 'flex-start', md: 'center' }}
                flexWrap="wrap"
                gap={3}
              >
                <Box>
                  <Heading size="sm">{currentList.name}</Heading>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(currentList.createdAt).toLocaleString()}
                  </Text>
                </Box>
                <ButtonGroup
                  size="sm"
                  variant="outline"
                  flexWrap="wrap"
                  justifyContent="flex-end"
                  spacing={2}
                >
                  <Button onClick={handleCopyMarkdown}>Copiar Markdown</Button>
                  <Button onClick={handleDownloadMarkdown}>
                    Descargar .md
                  </Button>
                  <Button onClick={handlePrintableView}>Vista imprimible</Button>
                </ButtonGroup>
              </CardHeader>
              <Divider />
              <CardBody>
                <Stack spacing={4}>
                  {groupByCategory(currentList.items).map(
                    ({ categoryId, categoryName, items }) => (
                      <Box key={categoryId}>
                        <Heading size="sm" mb={2}>
                          {categoryName}
                        </Heading>
                        <List spacing={1} styleType="disc" pl={4}>
                          {items.map((item) => (
                            <ListItem key={item.product.id}>
                              {item.product.name}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    ),
                  )}
                </Stack>
              </CardBody>
            </Card>
          ) : (
            <Text color="gray.500">
              Todavia no hay una lista activa. Selecciona productos y presiona
              "Generar lista".
            </Text>
          )}
        </Stack>

        <Stack spacing={4}>
          <Heading size="md">Listas guardadas</Heading>
          {savedLists.length === 0 ? (
            <Text color="gray.500">
              Aun no has guardado listas. Activa la opcion de guardado y genera
              una.
            </Text>
          ) : (
            <Stack spacing={4}>
              {savedLists.map((list) => (
                <Card key={list.id}>
                  <CardHeader
                    display="flex"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={3}
                  >
                    <Box>
                      <Heading size="sm">{list.name}</Heading>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(list.createdAt).toLocaleString()} ·{' '}
                        {list.items.length} productos
                      </Text>
                    </Box>
                    <ButtonGroup size="sm" flexWrap="wrap" spacing={2}>
                      <Button
                        variant="outline"
                        onClick={() => handleApplySavedList(list)}
                      >
                        Cargar
                      </Button>
                      <Button
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteList(list.id)}
                      >
                        Eliminar
                      </Button>
                    </ButtonGroup>
                  </CardHeader>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Container>
  )
}

const buildSelectedItems = (selection: SelectionState): SelectedItem[] => {
  const items: SelectedItem[] = []
  categories.forEach((category) => {
    const selectedSet = selection[category.id]
    if (!selectedSet || selectedSet.size === 0) return
    category.products.forEach((product) => {
      if (selectedSet.has(product.id)) {
        items.push({
          categoryId: category.id,
          categoryName: category.name,
          product,
        })
      }
    })
  })
  return items
}

const groupByCategory = (items: SelectedItem[]) => {
  const map = new Map<
    string,
    { categoryId: string; categoryName: string; items: SelectedItem[] }
  >()
  items.forEach((item) => {
    if (!map.has(item.categoryId)) {
      map.set(item.categoryId, {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        items: [],
      })
    }
    map.get(item.categoryId)!.items.push(item)
  })
  return Array.from(map.values())
}

const buildPrintableHtml = (
  name: string,
  grouped: ReturnType<typeof groupByCategory>,
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

export default App
