import { StrictMode } from 'react'
import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  },
  fonts: {
    heading: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    body: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </StrictMode>,
)
