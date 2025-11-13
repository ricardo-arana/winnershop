import { Box } from '@chakra-ui/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ShoppingListsProvider } from './context/ShoppingListsContext'
import AppHeader from './components/layout/AppHeader'
import HomePage from './pages/HomePage'
import SavedListsPage from './pages/SavedListsPage'
import ListDetailPage from './pages/ListDetailPage'
import './App.css'
import usePwaUpdateNotification from './hooks/usePwaUpdateNotification'

const App = () => {
  usePwaUpdateNotification()

  return (
    <ShoppingListsProvider>
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
        <AppHeader />
        <Box as="main" py={{ base: 6, md: 10 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/listas" element={<SavedListsPage />} />
            <Route path="/listas/:id" element={<ListDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </ShoppingListsProvider>
  )
}

export default App
