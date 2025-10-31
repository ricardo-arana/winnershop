import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  Container,
  Heading,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useShoppingLists } from '../context/ShoppingListsContext'

const SavedListsPage = () => {
  const { savedLists, deleteList } = useShoppingLists()
  const navigate = useNavigate()
  const toast = useToast()

  const handleDelete = (id: string) => {
    deleteList(id)
    toast({
      title: 'Lista eliminada',
      status: 'info',
      duration: 2500,
      isClosable: true,
    })
  }

  return (
    <Container maxW="4xl" px={{ base: 4, md: 6 }}>
      <Stack spacing={{ base: 6, md: 8 }}>
        <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4}>
          <Box>
            <Heading size="xl">Listas guardadas</Heading>
            <Text color="gray.600" _dark={{ color: 'gray.300' }}>
              Consulta, imprime o elimina las listas que guardaste en este dispositivo.
            </Text>
          </Box>
          <Button as={RouterLink} to="/" colorScheme="green" alignSelf={{ base: 'stretch', md: 'flex-start' }}>
            Crear nueva lista
          </Button>
        </Stack>

        {savedLists.length === 0 ? (
          <Stack spacing={3} align="center" textAlign="center" py={12}>
            <Text color="gray.500">
              Todavia no tienes listas guardadas. Genera una desde la pagina principal.
            </Text>
            <Button as={RouterLink} to="/" variant="outline">
              Ir a productos
            </Button>
          </Stack>
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
                      onClick={() => navigate(`/listas/${list.id}`)}
                    >
                      Ver detalle
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDelete(list.id)}
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
    </Container>
  )
}

export default SavedListsPage
