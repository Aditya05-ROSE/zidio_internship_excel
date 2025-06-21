import { HashRouter, Route, Routes } from 'react-router'
import Home from './pages/Home'
import { Toaster } from './components/ui/toaster'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Toaster />
    </HashRouter>
  )
}
