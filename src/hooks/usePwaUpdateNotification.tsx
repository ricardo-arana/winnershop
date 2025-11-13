import { useCallback, useEffect, useRef } from 'react'
import {
  Box,
  Button,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  type ToastId,
} from '@chakra-ui/react'
import { registerSW } from 'virtual:pwa-register'

const usePwaUpdateNotification = () => {
  const toast = useToast()
  const toastIdRef = useRef<ToastId | undefined>(undefined)
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const closeUpdateToast = useCallback(() => {
    if (toastIdRef.current) {
      toast.close(toastIdRef.current)
      toastIdRef.current = undefined
    }
  }, [toast])

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (toastIdRef.current) return
        toastIdRef.current = toast({
          duration: null,
          position: 'bottom-right',
          render: () => (
            <Box
              p={4}
              borderRadius="md"
              boxShadow="lg"
              borderWidth="1px"
              bg={cardBg}
              borderColor={borderColor}
              maxW="sm"
            >
              <Stack spacing={3}>
                <Box>
                  <Text fontWeight="semibold">Nueva versión disponible</Text>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                    Actualiza WinnerShop para obtener las últimas mejoras.
                  </Text>
                </Box>
                <Stack direction="row" spacing={2} justify="flex-end">
                  <Button size="sm" variant="ghost" onClick={closeUpdateToast}>
                    Luego
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={async () => {
                      await updateSW(true)
                      closeUpdateToast()
                      window.setTimeout(() => window.location.reload(), 100)
                    }}
                  >
                    Actualizar
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ),
        })
      },
      onOfflineReady() {
        toast({
          title: 'Lista disponible sin conexión',
          description: 'Puedes usar WinnerShop incluso si pierdes internet.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'bottom-right',
        })
      },
    })

    return () => {
      closeUpdateToast()
    }
  }, [borderColor, cardBg, closeUpdateToast, toast])
}

export default usePwaUpdateNotification
