import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  chakra,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import categoriesData from '../data/products.json'
import type { Category, SelectedItem, ShoppingList } from '../types/shopping'
import { useShoppingLists } from '../context/ShoppingListsContext'
import { buildPrintableHtml, groupByCategory } from '../utils/list'

const categories = categoriesData as Category[]

type SelectionState = Record<string, Set<string>>

const HomePage = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const { savedLists, addList, getListById } = useShoppingLists()
  const actionsDirection =
    useBreakpointValue<'column' | 'row'>({ base: 'column', md: 'row' }) ??
    'column'

  const [selectedProducts, setSelectedProducts] = useState<SelectionState>({})
  const [listName, setListName] = useState('')
  const [shouldPersist, setShouldPersist] = useState(true)
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const applyListToSelection = (list: ShoppingList) => {
    setCurrentList(list)
    setListName(list.name)
    const restored: SelectionState = {}
    list.items.forEach((item) => {
      const set = restored[item.categoryId] ?? new Set<string>()
      set.add(item.product.id)
      restored[item.categoryId] = set
    })
    setSelectedProducts(restored)
  }

  useEffect(() => {
    const state = location.state as { loadListId?: string } | undefined
    if (state?.loadListId) {
      const list = getListById(state.loadListId)
      if (list) {
        applyListToSelection(list)
        toast({
          title: 'Lista cargada',
          description: 'Puedes editarla y generar una nueva version.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'Lista no encontrada',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
      }
      navigate('.', { replace: true })
    }
  }, [getListById, location.state, navigate, toast])

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
      addList(newList)
      toast({
        title: 'Lista guardada',
        description: 'Puedes consultarla en "Listas guardadas".',
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

  const handleClearSelection = () => {
    setSelectedProducts({})
    setCurrentList(null)
  }

  const isCurrentListSaved = useMemo(() => {
    if (!currentList) return false
    return savedLists.some((list) => list.id === currentList.id)
  }, [currentList, savedLists])

  return (
    <Container maxW="6xl" px={{ base: 4, md: 6 }}>
      <Stack spacing={{ base: 8, md: 10 }}>
        <Stack spacing={3}>
          <Heading size="xl">Arma tu lista de compras</Heading>
          <Text color="gray.600" _dark={{ color: 'gray.300' }}>
            Selecciona productos por categoria, guarda tus listas y accede a
            ellas desde cualquier pagina de la app.
          </Text>
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
                  _dark={{
                    borderColor: currentCount ? 'green.400' : 'gray.700',
                  }}
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
                  <Button
                    onClick={() =>
                      currentList && navigate(`/listas/${currentList.id}`)
                    }
                    isDisabled={!isCurrentListSaved}
                  >
                    Ver detalle
                  </Button>
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

export default HomePage
