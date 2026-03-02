import { useState, useEffect, useCallback } from 'react'

// ─── SCORING ENGINE (fixed logic, unique per factor) ─────────────
function computeScore(d) {
  const factors = []
  let raw = 0

  // 1. Membership: 0–60 months → 0–20 pts
  const f1 = Math.min(d.membership / 60, 1) * 20
  factors.push({ name: 'Lama Keanggotaan', pts: f1, detail: `${d.membership} bulan`, max: 20 })
  raw += f1

  // 2. Savings: 0–30M → 0–18 pts (log scale so small savers still get credit)
  const savNorm = Math.min(Math.log10(d.savings + 1) / Math.log10(30000001), 1)
  const f2 = savNorm * 18
  factors.push({ name: 'Total Simpanan', pts: f2, detail: `Rp ${d.savings.toLocaleString('id-ID')}`, max: 18 })
  raw += f2

  // 3. Consistency: 0–10 → 0–15 pts
  const f3 = (d.consistency / 10) * 15
  factors.push({ name: 'Konsistensi Menabung', pts: f3, detail: `${d.consistency}/10`, max: 15 })
  raw += f3

  // 4. Payment rate: 0–100% → 0–25 pts (highest weight)
  const f4 = (d.paymentRate / 100) * 25
  factors.push({ name: 'Ketepatan Pembayaran', pts: f4, detail: `${d.paymentRate}%`, max: 25 })
  raw += f4

  // 5. Loan-to-savings ratio: low is good, high is bad → 0–12 pts
  const ratio = d.savings > 0 ? d.loanAmount / d.savings : 10
  const f5 = Math.max(0, 1 - (ratio - 0.5) / 4) * 12
  factors.push({ name: 'Rasio Pinjaman/Simpanan', pts: f5, detail: `${ratio.toFixed(1)}x`, max: 12 })
  raw += f5

  // 6. Purpose bonus: 0–10 pts
  const purposeScores = { usaha: 10, pendidikan: 8, kesehatan: 7, renovasi: 5, konsumtif: 2 }
  const f6 = purposeScores[d.purpose] || 5
  factors.push({ name: 'Tujuan Pinjaman', pts: f6, detail: d.purpose.charAt(0).toUpperCase() + d.purpose.slice(1), max: 10 })
  raw += f6

  const score = Math.round(Math.max(0, Math.min(100, raw)))
  return { score, factors }
}

function getCategory(s) {
  if (s >= 80) return { label: 'SANGAT LAYAK', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
  if (s >= 60) return { label: 'LAYAK', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' }
  if (s >= 40) return { label: 'PERLU TINJAUAN', color: '#f97316', bg: 'rgba(249,115,22,0.12)' }
  return { label: 'BERISIKO TINGGI', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
}

function getRecommendation(s) {
  if (s >= 80) return '💡 Pengajuan sangat direkomendasikan untuk disetujui. Profil anggota menunjukkan kredibilitas dan konsistensi yang sangat baik.'
  if (s >= 60) return '💡 Pengajuan layak disetujui dengan catatan. Disarankan pengurus memverifikasi beberapa data pendukung sebelum keputusan final.'
  if (s >= 40) return '💡 Perlu tinjauan lebih lanjut oleh pengurus koperasi. Beberapa indikator memerlukan evaluasi manual dan klarifikasi dari anggota.'
  return '💡 Pengajuan memiliki profil risiko tinggi. Disarankan menunda pengajuan atau mengurangi jumlah pinjaman yang diminta.'
}

// ─── SVG GAUGE ───────────────────────────────────────────────────
function Gauge({ score, color }) {
  const r = 80
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75 // 270-degree arc
  const offset = arc - (score / 100) * arc

  return (
    <svg width="200" height="180" viewBox="0 0 200 180">
      {/* background arc */}
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.04)"
        strokeWidth="10" strokeDasharray={`${arc} ${circ}`}
        strokeLinecap="round" transform="rotate(135 100 100)" />
      {/* value arc */}
      <circle cx="100" cy="100" r={r} fill="none" stroke={color}
        strokeWidth="10" strokeDasharray={`${arc} ${circ}`}
        strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(135 100 100)"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }} />
      {/* score text */}
      <text x="100" y="95" textAnchor="middle" fontFamily="'JetBrains Mono'" fontSize="38"
        fontWeight="700" fill={color}>{score}</text>
      <text x="100" y="116" textAnchor="middle" fontFamily="'Nunito'" fontSize="11"
        fontWeight="600" fill="rgba(255,255,255,0.35)">dari 100</text>
    </svg>
  )
}

// ─── PIPELINE STEPS ──────────────────────────────────────────────
const STEPS = [
  { icon: '📥', text: 'Menerima Data' },
  { icon: '🔍', text: 'Analisis Fitur' },
  { icon: '🤖', text: 'Prediksi Model' },
  { icon: '📊', text: 'Generate Skor' },
]

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export default function CreditScoring({ formData, setFormData }) {
  const { score: liveScore } = computeScore(formData)
  const liveCat = getCategory(liveScore)

  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(-1)

  const update = useCallback((key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }))
  }, [setFormData])

  const runAnalysis = () => {
    setProcessing(true)
    setResult(null)
    setPipelineStep(0)

    let step = 0
    const iv = setInterval(() => {
      step++
      setPipelineStep(step)
      if (step >= STEPS.length) {
        clearInterval(iv)
        setTimeout(() => {
          setProcessing(false)
          setResult(computeScore(formData))
        }, 400)
      }
    }, 600)
  }

  return (
    <div className="fade-active">
      <div className="card">
        <h2 className="card-title">📊 AI CREDIT SCORING</h2>
        <p className="card-subtitle">Geser slider untuk melihat skor berubah secara real-time, lalu klik "Analisis" untuk melihat detail lengkap.</p>

        {/* Live preview bar */}
        <div className="live-preview">
          <span className="lp-label">Live Score</span>
          <span className="lp-score" style={{ color: liveCat.color }}>{liveScore}</span>
          <div className="lp-bar">
            <div className="lp-bar-fill" style={{ width: `${liveScore}%`, background: liveCat.color }} />
          </div>
        </div>

        {/* Sliders */}
        <Slider label="Lama Keanggotaan" unit=" bulan" min={0} max={120} value={formData.membership}
          onChange={v => update('membership', v)} />
        <Slider label="Total Simpanan" prefix="Rp " min={0} max={50000000} step={500000}
          value={formData.savings} onChange={v => update('savings', v)} format={v => v.toLocaleString('id-ID')} />
        <Slider label="Konsistensi Menabung" unit="/10" min={0} max={10}
          value={formData.consistency} onChange={v => update('consistency', v)} />
        <Slider label="Pinjaman Sebelumnya" unit=" pinjaman" min={0} max={10}
          value={formData.loanHistory} onChange={v => update('loanHistory', v)} />
        <Slider label="Ketepatan Pembayaran" unit="%" min={0} max={100}
          value={formData.paymentRate} onChange={v => update('paymentRate', v)} />
        <Slider label="Jumlah Pinjaman" prefix="Rp " min={1000000} max={50000000} step={500000}
          value={formData.loanAmount} onChange={v => update('loanAmount', v)} format={v => v.toLocaleString('id-ID')} />

        <div className="select-wrap">
          <div className="slider-header">
            <span className="slider-label">Tujuan Pinjaman</span>
          </div>
          <select value={formData.purpose} onChange={e => update('purpose', e.target.value)}>
            <option value="usaha">Modal Usaha</option>
            <option value="pendidikan">Biaya Pendidikan</option>
            <option value="kesehatan">Biaya Kesehatan</option>
            <option value="renovasi">Renovasi Rumah</option>
            <option value="konsumtif">Konsumtif</option>
          </select>
        </div>

        <button className="btn btn-gold" onClick={runAnalysis} disabled={processing}>
          {processing ? '⏳ Memproses...' : '🚀 Jalankan Analisis AI'}
        </button>
      </div>

      {/* Pipeline animation */}
      {processing && (
        <div className="pipeline">
          {STEPS.map((s, i) => (
            <div key={i} className={`pipeline-step${i < pipelineStep ? ' done' : i === pipelineStep ? ' active' : ''}`}>
              <div className="ps-icon">{i < pipelineStep ? '✅' : s.icon}</div>
              <div className="ps-text">{s.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result && !processing && <ResultCard result={result} />}
    </div>
  )
}

// ─── SLIDER COMPONENT ───────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, onChange, unit = '', prefix = '', format }) {
  const display = format ? format(value) : value
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{prefix}{display}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((value - min) / (max - min)) * 100}%, #222228 ${((value - min) / (max - min)) * 100}%, #222228 100%)`
        }}
      />
    </div>
  )
}

// ─── RESULT CARD ─────────────────────────────────────────────────
function ResultCard({ result }) {
  const { score, factors } = result
  const cat = getCategory(score)

  // Sort factors by contribution (descending)
  const sorted = [...factors].sort((a, b) => b.pts - a.pts)

  return (
    <div className="card fade-active">
      <h2 className="card-title">🎯 HASIL ANALISIS AI</h2>

      <div className="gauge-wrap">
        <Gauge score={score} color={cat.color} />
        <span className="gauge-label" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
      </div>

      <h2 className="card-title" style={{ fontSize: '1.1rem', marginTop: 20 }}>📋 EXPLAINABLE AI — FAKTOR</h2>
      <div className="factor-list">
        {sorted.map((f, i) => {
          const pct = (f.pts / f.max) * 100
          const isGood = pct >= 50
          return (
            <div key={f.name} className="factor-item" style={{ animationDelay: `${i * 0.08}s` }}>
              <span style={{ fontSize: '1rem' }}>{isGood ? '✅' : '⚠️'}</span>
              <span className="fi-name">
                {f.name} <small style={{ color: 'var(--text-500)' }}>({f.detail})</small>
              </span>
              <div className="fi-bar">
                <div className="fi-bar-fill" style={{
                  width: `${pct}%`,
                  background: isGood ? 'var(--green)' : 'var(--red)',
                }} />
              </div>
              <span className={`fi-val ${isGood ? 'positive' : 'negative'}`}>
                {f.pts.toFixed(1)}/{f.max}
              </span>
            </div>
          )
        })}
      </div>

      <div className="recommendation-box">{getRecommendation(score)}</div>
      <p className="disclaimer">⚠️ Ini adalah simulasi. Skor hanya rekomendasi — keputusan akhir tetap oleh pengurus koperasi.</p>
    </div>
  )
}
