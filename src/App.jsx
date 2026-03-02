import { useState } from 'react'
import CreditScoring from './components/CreditScoring'
import Chatbot from './components/Chatbot'
import OCRModule from './components/OCRModule'

const TABS = [
  { id: 'scoring', icon: '📊', label: 'Credit Scoring' },
  { id: 'chatbot', icon: '💬', label: 'AI Chatbot' },
  { id: 'ocr', icon: '🪪', label: 'OCR Dokumen' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('scoring')
  // Shared state so chatbot can read scoring data
  const [formData, setFormData] = useState({
    membership: 36,
    savings: 10000000,
    consistency: 8,
    loanHistory: 2,
    paymentRate: 90,
    loanAmount: 15000000,
    purpose: 'usaha',
  })

  return (
    <div className="app-container">
      <header className="site-header">
        <h1>⚡ SIMULASI AI KOPERASI DIGITAL</h1>
        <p>Demo interaktif sistem kecerdasan buatan pada Koperasi Simpan Pinjam</p>
      </header>

      <nav className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-item${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span>{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main>
        {activeTab === 'scoring' && <CreditScoring formData={formData} setFormData={setFormData} />}
        {activeTab === 'chatbot' && <Chatbot formData={formData} />}
        {activeTab === 'ocr' && <OCRModule />}
      </main>

      <footer className="site-footer">
        Simulasi AI — Koperasi Simpan Pinjam Digital © 2026 | Untuk keperluan demonstrasi dan edukasi
      </footer>
    </div>
  )
}
