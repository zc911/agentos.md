import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Navigation from './pages/Navigation'
import Blog from './pages/Blog'
import Studio from './pages/Studio'
import Spec from './pages/Spec'
import Templates from './pages/Templates'
import TemplateDetail from './pages/TemplateDetail'

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/navigation" element={<Navigation />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/spec" element={<Spec />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/templates/:id" element={<TemplateDetail />} />
        <Route path="/templates/:username/:slug" element={<TemplateDetail />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
