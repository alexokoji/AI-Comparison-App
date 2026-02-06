import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Mem0Chat from './pages/Mem0Chat'
import ZepChat from './pages/ZepChat'
import Comparison from './pages/Comparison'
import Documentation from './pages/Documentation'
import Settings from './pages/Settings'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mem0" element={<Mem0Chat />} />
          <Route path="/zep" element={<ZepChat />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
