import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Card,
  CardBody,
  CardHeader,
  Container,
  Divider,
  Heading,
  List,
  ListItem,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import { useShoppingLists } from '../context/ShoppingListsContext'
import { buildPrintableHtml, groupByCategory } from '../utils/list'

const ListDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { getListById } = useShoppingLists()

  const list = id ? getListById(id) : undefined

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  const markdown = useMemo(() => {
    if (!list) return ''
    const lines = [
      `# ${list.name}`,
      '',
      `Creada: ${new Date(list.createdAt).toLocaleString()}`,
      '',
    ]
    const grouped = groupByCategory(list.items)
    grouped.forEach(({ categoryName, items }) => {
      lines.push(`## ${categoryName}`)
      items.forEach((item) => lines.push(`- [ ] ${item.product.name}`))
      lines.push('')
    })
    return lines.join('\n').trim()
  }, [list])

  const handleCopyMarkdown = async () => {
    if (!markdown) return
    try {
      await navigator.clipboard.writeText(markdown)
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
    if (!markdown || !list) return
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${list.name.replace(/\s+/g, '-').toLowerCase()}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePrintableView = () => {
    if (!list) return
    const grouped = groupByCategory(list.items)
    const html = buildPrintableHtml(list.name, grouped)
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

  const toggleItem = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  if (!list) {
    return (
      <Container maxW="3xl" px={{ base: 4, md: 6 }}>
        <Stack spacing={4} pt={10} textAlign="center">
          <Heading size="lg">Lista no encontrada</Heading>
          <Text color="gray.500">
            No pudimos encontrar la lista solicitada. Es posible que haya sido
            eliminada o que el enlace no sea correcto.
          </Text>
          <Button as={RouterLink} to="/listas" colorScheme="green" alignSelf="center">
            Volver a listas
          </Button>
        </Stack>
      </Container>
    )
  }

  return (
    <Container maxW="4xl" px={{ base: 4, md: 6 }}>
      <Stack spacing={{ base: 6, md: 8 }}>
        <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4}>
          <Box>
            <Heading size="xl">{list.name}</Heading>
            <Text color="gray.500">
              Creada el {new Date(list.createdAt).toLocaleString()}
            </Text>
          </Box>
          <Button
            variant="outline"
            onClick={() => navigate('/', { state: { loadListId: list.id } })}
          >
            Usar en el generador
          </Button>
        </Stack>

        <Card>
          <CardHeader
            display="flex"
            justifyContent="space-between"
            alignItems={{ base: 'flex-start', md: 'center' }}
            flexWrap="wrap"
            gap={3}
          >
            <Box>
              <Heading size="md">Acciones</Heading>
              <Text fontSize="sm" color="gray.500">
                Exporta esta lista para imprimirla o compartirla.
              </Text>
            </Box>
            <ButtonGroup size="sm" variant="outline" flexWrap="wrap" spacing={2}>
              <Button onClick={handleCopyMarkdown}>Copiar Markdown</Button>
              <Button onClick={handleDownloadMarkdown}>Descargar .md</Button>
              <Button onClick={handlePrintableView}>Vista imprimible</Button>
            </ButtonGroup>
          </CardHeader>
          <Divider />
          <CardBody>
            <Stack spacing={4}>
              {groupByCategory(list.items).map(
                ({ categoryId, categoryName, items }) => (
                  <Box key={categoryId}>
                    <Heading size="sm" mb={2}>
                      {categoryName}
                    </Heading>
                    <List spacing={2} styleType="none" alignContent="start" justifyContent="start">
                      {items.map((item) => (
                        <ListItem key={item.product.id}>
                          <Checkbox
                            colorScheme="green"
                            isChecked={checkedItems[item.product.id] ?? false}
                            onChange={() => toggleItem(item.product.id)}
                          >
                            <Text
                              as={
                                checkedItems[item.product.id] ? 's' : undefined
                              }
                            >
                              {item.product.name}
                            </Text>
                          </Checkbox>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ),
              )}
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </Container>
  )
}

export default ListDetailPage
