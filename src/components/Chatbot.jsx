import { useState, useRef, useEffect } from 'react'

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

function getResponse(input, data) {
  const r = buildResponses(data)
  const l = input.toLowerCase()
  if (l.includes('saldo') || l.includes('simpanan') || l.includes('tabungan')) return r.saldo
  if (l.includes('ajukan') || l.includes('syarat') || l.includes('pinjam') || l.includes('cara')) return r.pinjaman
  if (l.includes('cicilan') || l.includes('simulasi') || l.includes('angsuran') || l.includes('bayar')) return r.cicilan
  if (l.includes('skor') || l.includes('kelayakan') || l.includes('nilai') || l.includes('score')) return r.skor
  if (l.includes('jam') || l.includes('buka') || l.includes('operasional') || l.includes('tutup')) return r.jam
  if (l.includes('halo') || l.includes('hai') || l.includes('help') || l.includes('bantuan') || l.includes('hi')) return r.bantuan
  return `Terima kasih atas pertanyaan Anda!\n\nCoba tanyakan tentang:\n• "Berapa saldo saya?"\n• "Cara ajukan pinjaman"\n• "Simulasi cicilan"\n• "Berapa skor saya?"\n• "Jam buka koperasi"`
}

const QUICK = [
  { icon: '💰', text: 'Cek Saldo', msg: 'Berapa saldo simpanan saya?' },
  { icon: '📝', text: 'Ajukan Pinjaman', msg: 'Bagaimana cara mengajukan pinjaman?' },
  { icon: '🧮', text: 'Simulasi Cicilan', msg: 'Simulasi cicilan pinjaman saya' },
  { icon: '📊', text: 'Cek Skor', msg: 'Berapa skor kelayakan saya?' },
  { icon: '🕐', text: 'Jam Buka', msg: 'Jam operasional koperasi?' },
]

export default function Chatbot({ formData }) {
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Halo! 👋 Saya asisten virtual Koperasi Sejahtera Mandiri.\n\nSaya terhubung dengan data profil Anda dan bisa memberikan informasi yang personal.\n\nSilakan ketik pertanyaan atau pilih topik di atas!'
    }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = (text) => {
    if (!text.trim() || typing) return
    const userMsg = text.trim()
    setMessages(prev => [...prev, { from: 'user', text: userMsg }])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { from: 'bot', text: getResponse(userMsg, formData) }])
    }, 500 + Math.random() * 500)
  }

  return (
    <div className="fade-active">
      <div className="card">
        <h2 className="card-title">💬 CHATBOT KOPERASI</h2>
        <p className="card-subtitle">
          Chatbot terhubung dengan data anggota — jawaban dipersonalisasi berdasarkan profil Anda.
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
              placeholder="Ketik pertanyaan Anda..."
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
