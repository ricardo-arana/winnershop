import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Stack,
  useColorMode,
  useDisclosure,
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Productos', to: '/' },
  { label: 'Listas guardadas', to: '/listas' },
]

const AppHeader = () => {
  const { isOpen, onToggle, onClose } = useDisclosure()
  const location = useLocation()
  const { colorMode, toggleColorMode } = useColorMode()

  const isActive = (to: string) => {
    if (to === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(to)
  }

  const renderNavButton = (label: string, to: string, onClick?: () => void) => {
    const active = isActive(to)
    return (
      <Button
        key={to}
        as={RouterLink}
        to={to}
        variant="ghost"
        fontWeight={active ? 'semibold' : 'medium'}
        px={3}
        py={2}
        borderRadius="md"
        bg={
          active
            ? colorMode === 'light'
              ? 'green.50'
              : 'whiteAlpha.200'
            : 'transparent'
        }
        _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
        onClick={onClick}
      >
        {label}
      </Button>
    )
  }

  return (
    <Box borderBottomWidth="1px" borderColor="gray.100" _dark={{ borderColor: 'gray.700' }}>
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <Flex
          h={16}
          align="center"
          justify="space-between"
          gap={4}
        >
          <HStack spacing={3}>
            <Button
              as={RouterLink}
              to="/"
              variant="ghost"
              fontWeight="bold"
              fontSize="lg"
              px={0}
              _hover={{ bg: 'transparent' }}
            >
              WinnerShop
            </Button>
          </HStack>
          <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
            {NAV_LINKS.map((link) => renderNavButton(link.label, link.to))}
            <IconButton
              aria-label={
                colorMode === 'light'
                  ? 'Activar modo oscuro'
                  : 'Activar modo claro'
              }
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              variant="ghost"
              onClick={toggleColorMode}
            />
          </HStack>
          <HStack spacing={2} display={{ base: 'flex', md: 'none' }}>
            <IconButton
              aria-label={
                colorMode === 'light'
                  ? 'Activar modo oscuro'
                  : 'Activar modo claro'
              }
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              variant="ghost"
              onClick={toggleColorMode}
            />
            <IconButton
              aria-label={isOpen ? 'Cerrar menu' : 'Abrir menu'}
              icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
              variant="ghost"
              onClick={onToggle}
            />
          </HStack>
        </Flex>
        {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack spacing={2}>
              {NAV_LINKS.map((link) =>
                renderNavButton(link.label, link.to, () => {
                  onClose()
                }),
              )}
            </Stack>
          </Box>
        ) : null}
      </Container>
    </Box>
  )
}

export default AppHeader
