import { useState, useRef, useEffect } from 'react'

const AI_KEY = import.meta.env.VITE_AI_API_KEY || ''
const AI_URL = import.meta.env.VITE_AI_API_URL || 'https://api.x.ai/v1/chat/completions'
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'grok-4-latest'
const AI_ENABLED = AI_KEY.length > 10

// ─── SCORE HELPER ────────────────────────────────────────────────
function quickScore(d) {
  let s = 0
  s += Math.min(d.membership / 60, 1) * 20
  s += Math.min(Math.log10(d.savings + 1) / Math.log10(30000001), 1) * 18
  s += (d.consistency / 10) * 15
  s += (d.paymentRate / 100) * 25
  const ratio = d.savings > 0 ? d.loanAmount / d.savings : 10
  s += Math.max(0, 1 - (ratio - 0.5) / 4) * 12
  const pm = { usaha: 10, pendidikan: 8, kesehatan: 7, renovasi: 5, konsumtif: 2 }
  s += pm[d.purpose] || 5
  return Math.round(Math.max(0, Math.min(100, s)))
}

// ─── BUILD CONTEXT for OpenAI ────────────────────────────────────
function buildSystemPrompt(d) {
  const score = quickScore(d)
  const simpPokok = 500000
  const simpWajib = 2400000
  const simpSukarela = d.savings
  const total = simpPokok + simpWajib + simpSukarela
  const limit = Math.round(d.savings * 2.5)

  return `Kamu adalah AI Assistant untuk Koperasi Simpan Pinjam Digital "Koperasi Sejahtera Mandiri".
Kamu harus menjawab dalam Bahasa Indonesia yang ramah dan profesional.
Gunakan emoji secukupnya untuk membuat percakapan lebih friendly.

Data anggota yang sedang login:
- Lama keanggotaan: ${d.membership} bulan
- Simpanan Pokok: Rp ${simpPokok.toLocaleString('id-ID')}
- Simpanan Wajib: Rp ${simpWajib.toLocaleString('id-ID')}
- Simpanan Sukarela: Rp ${simpSukarela.toLocaleString('id-ID')}
- Total Simpanan: Rp ${total.toLocaleString('id-ID')}
- Konsistensi menabung: ${d.consistency}/10
- Jumlah pinjaman sebelumnya: ${d.loanHistory}
- Ketepatan pembayaran: ${d.paymentRate}%
- Skor kelayakan AI: ${score}/100
- Estimasi limit pinjaman: Rp ${limit.toLocaleString('id-ID')}
- Jumlah pinjaman yang ingin diajukan: Rp ${d.loanAmount.toLocaleString('id-ID')}
- Tujuan pinjaman: ${d.purpose}

Aturan koperasi:
- Bunga pinjaman: 1% per bulan (flat)
- Tenor maksimal: 24 bulan
- Minimal keanggotaan untuk pinjam: 6 bulan
- Jam operasional: Senin-Jumat 08.00-16.00, Sabtu 08.00-12.00 WIB
- AI hanya memberikan rekomendasi, keputusan akhir tetap oleh pengurus koperasi

Jawab pertanyaan anggota dengan data di atas. Jika ditanya hal di luar konteks koperasi, arahkan kembali ke topik layanan koperasi.`
}

// ─── AI API CALL (xAI / OpenAI compatible) ──────────────────────
async function callAI(messages) {
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
      stream: false,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API Error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ─── RULE-BASED FALLBACK ─────────────────────────────────────────
function buildResponses(d) {
  const score = quickScore(d)
  const simpPokok = 500000
  const simpWajib = 2400000
  const simpSukarela = d.savings
  const total = simpPokok + simpWajib + simpSukarela
  const limit = Math.round(d.savings * 2.5)

  return {
    saldo: `Halo! Berikut data simpanan Anda:\n\n💰 Simpanan Pokok: Rp ${simpPokok.toLocaleString('id-ID')}\n💰 Simpanan Wajib: Rp ${simpWajib.toLocaleString('id-ID')}\n💰 Simpanan Sukarela: Rp ${simpSukarela.toLocaleString('id-ID')}\n━━━━━━━━━━━\n📊 Total: Rp ${total.toLocaleString('id-ID')}\n\nEstimasi limit pinjaman Anda: Rp ${limit.toLocaleString('id-ID')}`,
    pinjaman: `Untuk mengajukan pinjaman, berikut syaratnya:\n\n1️⃣ Sudah menjadi anggota minimal 6 bulan (Anda: ${d.membership} bulan ✅)\n2️⃣ Memiliki simpanan aktif (Anda: Rp ${d.savings.toLocaleString('id-ID')} ✅)\n3️⃣ Menyiapkan foto KTP\n4️⃣ Mengisi formulir di menu "Pinjaman"\n\nSkor kelayakan Anda saat ini: ${score}/100`,
    cicilan: `Simulasi cicilan berdasarkan data Anda:\n\n📋 Pinjaman: Rp ${d.loanAmount.toLocaleString('id-ID')}\n📅 Tenor: 12 bulan\n💵 Cicilan/bulan: Rp ${Math.round(d.loanAmount * 1.12 / 12).toLocaleString('id-ID')}\n📈 Bunga: 1%/bulan (flat)\n\n💰 Total bayar: Rp ${Math.round(d.loanAmount * 1.12).toLocaleString('id-ID')}`,
    skor: `Skor kelayakan Anda: ${score}/100 ${score >= 60 ? '✅' : '⚠️'}\n\n${score >= 80 ? 'Sangat Layak — pinjaman sangat direkomendasikan.' : score >= 60 ? 'Layak — pinjaman bisa diajukan.' : score >= 40 ? 'Perlu Tinjauan — pengurus akan mengevaluasi lebih lanjut.' : 'Berisiko Tinggi — disarankan menabung lebih dulu.'}\n\nAnda bisa meningkatkan skor dengan:\n• Menabung lebih konsisten\n• Menjaga ketepatan pembayaran\n• Menyesuaikan jumlah pinjaman`,
    bantuan: `Saya bisa membantu Anda dengan:\n\n1️⃣ Cek saldo simpanan → "Berapa saldo saya?"\n2️⃣ Info pengajuan pinjaman → "Cara ajukan pinjaman"\n3️⃣ Simulasi cicilan → "Simulasi cicilan"\n4️⃣ Cek skor kelayakan → "Berapa skor saya?"\n5️⃣ Jam operasional → "Jam buka koperasi"\n\nSilakan ketik atau pilih topik!`,
    jam: `Jam operasional Koperasi Sejahtera Mandiri:\n\n🕐 Senin–Jumat: 08.00–16.00 WIB\n🕐 Sabtu: 08.00–12.00 WIB\n🚫 Minggu & Hari Libur: Tutup\n\n📱 Layanan aplikasi tersedia 24 jam.`,
  }
}

function getRuleResponse(input, data) {
  const r = buildResponses(data)
  const l = input.toLowerCase()
  if (l.includes('saldo') || l.includes('simpanan') || l.includes('tabungan')) return r.saldo
  if (l.includes('ajukan') || l.includes('syarat') || l.includes('pinjam') || l.includes('cara')) return r.pinjaman
  if (l.includes('cicilan') || l.includes('simulasi') || l.includes('angsuran') || l.includes('bayar')) return r.cicilan
  if (l.includes('skor') || l.includes('kelayakan') || l.includes('nilai') || l.includes('score')) return r.skor
  if (l.includes('jam') || l.includes('buka') || l.includes('operasional') || l.includes('tutup')) return r.jam
  if (l.includes('halo') || l.includes('hai') || l.includes('help') || l.includes('bantuan') || l.includes('hi')) return r.bantuan
  return null // null = no match, use OpenAI if available
}

// ─── QUICK ACTIONS ───────────────────────────────────────────────
const QUICK = [
  { icon: '💰', text: 'Cek Saldo', msg: 'Berapa saldo simpanan saya?' },
  { icon: '📝', text: 'Ajukan Pinjaman', msg: 'Bagaimana cara mengajukan pinjaman?' },
  { icon: '🧮', text: 'Simulasi Cicilan', msg: 'Simulasi cicilan pinjaman saya' },
  { icon: '📊', text: 'Cek Skor', msg: 'Berapa skor kelayakan saya?' },
  { icon: '🕐', text: 'Jam Buka', msg: 'Jam operasional koperasi?' },
]

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export default function Chatbot({ formData }) {
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Halo! 👋 Saya asisten virtual Koperasi Sejahtera Mandiri.\n\n🤖 Saya menggunakan AI (xAI Grok) dan terhubung dengan data profil Anda.\n\nSilakan ketik pertanyaan atau pilih topik di atas!'
    }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const chatHistoryRef = useRef([])
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = async (text) => {
    if (!text.trim() || typing) return
    const userMsg = text.trim()
    setMessages(prev => [...prev, { from: 'user', text: userMsg }])
    setInput('')
    setTyping(true)

    try {
      chatHistoryRef.current.push({ role: 'user', content: userMsg })
      const aiMessages = [
        { role: 'system', content: buildSystemPrompt(formData) },
        ...chatHistoryRef.current.slice(-10),
      ]
      const reply = await callAI(aiMessages)
      chatHistoryRef.current.push({ role: 'assistant', content: reply })
      addBotMessage(reply)
    } catch (err) {
      addBotMessage(`⚠️ Error: ${err.message}\n\nPastikan API key valid dan koneksi internet aktif.`)
    }
  }

  function addBotMessage(text) {
    setTyping(false)
    setMessages(prev => [...prev, { from: 'bot', text }])
  }

  return (
    <div className="fade-active">
      <div className="card">
        <h2 className="card-title">💬 AI ASSISTANT CHATBOT</h2>
        <p className="card-subtitle">
          🟢 Powered by xAI Grok — Chatbot terhubung dengan data anggota.
        </p>

        <div className="quick-actions">
          {QUICK.map(q => (
            <button key={q.text} className="quick-chip" onClick={() => send(q.msg)} disabled={typing}>
              {q.icon} {q.text}
            </button>
          ))}
        </div>

        <div className="chat-panel">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>{m.text}</div>
            ))}
            {typing && (
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="chat-input-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder={typing ? 'AI sedang berpikir...' : 'Ketik pertanyaan Anda...'}
              disabled={typing}
            />
            <button onClick={() => send(input)} disabled={typing}>
              {typing ? '⏳' : 'Kirim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
