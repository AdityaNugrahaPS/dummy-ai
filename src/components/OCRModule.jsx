import { useState, useRef } from 'react'

// Multiple KTP data samples for variation
const KTP_SAMPLES = [
  {
    label: 'Contoh KTP 1 — Sari Dewi Lestari',
    header: { province: 'PROVINSI JAWA BARAT', city: 'KOTA BANDUNG' },
    photo: '👩',
    fields: [
      { field: 'NIK', value: '3201234567890001', confidence: 98 },
      { field: 'Nama', value: 'SARI DEWI LESTARI', confidence: 97 },
      { field: 'Tempat/Tgl Lahir', value: 'BANDUNG, 15-03-1990', confidence: 95 },
      { field: 'Jenis Kelamin', value: 'PEREMPUAN', confidence: 99 },
      { field: 'Alamat', value: 'JL. MERDEKA NO. 10 RT 003/005', confidence: 91 },
      { field: 'Kel/Desa', value: 'SUKAMAJU', confidence: 93 },
      { field: 'Kecamatan', value: 'CIBEUNYING KIDUL', confidence: 94 },
      { field: 'Agama', value: 'ISLAM', confidence: 99 },
      { field: 'Pekerjaan', value: 'WIRASWASTA', confidence: 96 },
    ],
  },
  {
    label: 'Contoh KTP 2 — Budi Santoso',
    header: { province: 'PROVINSI DKI JAKARTA', city: 'KOTA JAKARTA SELATAN' },
    photo: '👨',
    fields: [
      { field: 'NIK', value: '3174056708850003', confidence: 96 },
      { field: 'Nama', value: 'BUDI SANTOSO', confidence: 99 },
      { field: 'Tempat/Tgl Lahir', value: 'JAKARTA, 27-08-1985', confidence: 93 },
      { field: 'Jenis Kelamin', value: 'LAKI-LAKI', confidence: 99 },
      { field: 'Alamat', value: 'JL. SUDIRMAN NO. 45 RT 007/002', confidence: 88 },
      { field: 'Kel/Desa', value: 'SENAYAN', confidence: 95 },
      { field: 'Kecamatan', value: 'KEBAYORAN BARU', confidence: 92 },
      { field: 'Agama', value: 'KRISTEN', confidence: 99 },
      { field: 'Pekerjaan', value: 'KARYAWAN SWASTA', confidence: 94 },
    ],
  },
  {
    label: 'Contoh KTP 3 — Rina Amelia',
    header: { province: 'PROVINSI JAWA TIMUR', city: 'KOTA SURABAYA' },
    photo: '👩‍💼',
    fields: [
      { field: 'NIK', value: '3578012303920005', confidence: 97 },
      { field: 'Nama', value: 'RINA AMELIA PUTRI', confidence: 95 },
      { field: 'Tempat/Tgl Lahir', value: 'SURABAYA, 23-03-1992', confidence: 94 },
      { field: 'Jenis Kelamin', value: 'PEREMPUAN', confidence: 99 },
      { field: 'Alamat', value: 'JL. DARMO PERMAI NO. 8 RT 001/010', confidence: 86 },
      { field: 'Kel/Desa', value: 'DARMO', confidence: 91 },
      { field: 'Kecamatan', value: 'WONOKROMO', confidence: 90 },
      { field: 'Agama', value: 'ISLAM', confidence: 99 },
      { field: 'Pekerjaan', value: 'PNS', confidence: 98 },
    ],
  },
]

export default function OCRModule() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [extractedRows, setExtractedRows] = useState([])
  const [done, setDone] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef(null)

  const sample = KTP_SAMPLES[selectedIdx]

  const startScan = () => {
    setScanning(true)
    setExtractedRows([])
    setDone(false)
    setProgress(0)

    const fields = sample.fields
    let i = 0

    intervalRef.current = setInterval(() => {
      if (i >= fields.length) {
        clearInterval(intervalRef.current)
        setScanning(false)
        setDone(true)
        setProgress(100)
        return
      }
      setExtractedRows(prev => [...prev, fields[i]])
      setProgress(((i + 1) / fields.length) * 100)
      i++
    }, 380)
  }

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setScanning(false)
    setExtractedRows([])
    setDone(false)
    setProgress(0)
  }

  const switchSample = (idx) => {
    reset()
    setSelectedIdx(idx)
  }

  const confColor = (c) => c >= 95 ? 'var(--green)' : c >= 90 ? 'var(--amber-400)' : 'var(--red)'

  return (
    <div className="fade-active">
      <div className="card">
        <h2 className="card-title">🪪 OCR VERIFIKASI DOKUMEN</h2>
        <p className="card-subtitle">Simulasi ekstraksi data KTP menggunakan teknologi OCR. Pilih contoh KTP lalu klik untuk memulai scan.</p>

        {/* Sample selector */}
        <div className="quick-actions" style={{ marginBottom: 20 }}>
          {KTP_SAMPLES.map((s, i) => (
            <button key={i} className="quick-chip" onClick={() => switchSample(i)}
              style={i === selectedIdx ? { borderColor: 'var(--amber-500)', color: 'var(--amber-400)' } : {}}>
              {s.photo} {s.label.split('—')[1]}
            </button>
          ))}
        </div>

        {/* KTP Mock Card */}
        <div className="ktp-mock" onClick={!scanning && !done ? startScan : undefined}>
          <div className={`scan-line${scanning ? ' active' : ''}`} />
          <div className="header-band">
            <div>
              <div className="republic">REPUBLIK INDONESIA</div>
              <div className="province">{sample.header.province} — {sample.header.city}</div>
            </div>
            <span style={{ fontSize: '2rem' }}>🪪</span>
          </div>
          <div className="ktp-grid">
            <div className="photo-placeholder">{sample.photo}</div>
            <div>
              {sample.fields.slice(0, 5).map(f => (
                <div key={f.field} style={{ marginBottom: 6 }}>
                  <div className="ktp-field-label">{f.field}</div>
                  <div className="ktp-field-value">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
          {!scanning && !done && (
            <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-400)', fontSize: '0.82rem' }}>
              👆 Klik kartu KTP ini untuk memulai scan OCR
            </p>
          )}
        </div>

        {(scanning || done) && (
          <button className="btn btn-gold" onClick={startScan} disabled={scanning} style={{ marginBottom: 16 }}>
            {scanning ? '⏳ Scanning...' : '🔄 Scan Ulang'}
          </button>
        )}
      </div>

      {/* Results */}
      {(extractedRows.length > 0 || done) && (
        <div className="card fade-active">
          <h2 className="card-title">📝 HASIL EKSTRAKSI OCR</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span className="ocr-status"
              style={{
                background: done ? 'var(--green-glow)' : 'var(--blue-glow)',
                color: done ? 'var(--green)' : 'var(--blue)',
              }}>
              {done ? '✅ Ekstraksi Selesai' : '⏳ Memproses...'}
            </span>
          </div>

          <div className="ocr-progress">
            <div className="ocr-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <table className="ocr-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Hasil Ekstraksi</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {extractedRows.map((r, i) => (
                <tr key={i} className="fade-active">
                  <td style={{ fontWeight: 600 }}>{r.field}</td>
                  <td>{r.value}</td>
                  <td style={{ color: confColor(r.confidence), fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {r.confidence}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {done && (
            <div className="ocr-note">
              ⚠️ <strong>Catatan:</strong> Hasil OCR bersifat sebagai alat bantu verifikasi awal. Data tetap harus dikonfirmasi oleh anggota dan diverifikasi oleh petugas koperasi sebelum disimpan ke sistem.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
