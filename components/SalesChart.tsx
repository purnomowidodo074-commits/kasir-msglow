'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface ChartData {
  label: string
  total: number
}

interface BarRect {
  x: number
  y: number
  w: number
  h: number
  index: number
}

function formatRupiah(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(2)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default function SalesChart({ data }: { data: ChartData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barsRef = useRef<BarRect[]>([])
  const [tooltip, setTooltip] = useState<{ x: number; y: number; index: number } | null>(null)

  const draw = useCallback((hoveredIndex: number | null) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cssW = canvas.offsetWidth
    const cssH = canvas.offsetHeight

    canvas.width = cssW * dpr
    canvas.height = cssH * dpr
    ctx.scale(dpr, dpr)

    const w = cssW
    const h = cssH
    const pad = { top: 24, right: 24, bottom: 48, left: 80 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom
    const maxVal = Math.max(...data.map((d) => d.total), 1)

    ctx.clearRect(0, 0, w, h)

    // Grid lines & Y labels
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH * (4 - i)) / 4
      ctx.strokeStyle = i === 0 ? '#e5e7eb' : '#f3f4f6'
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + chartW, y)
      ctx.stroke()

      const val = (maxVal * i) / 4
      const label =
        val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}jt`
        : val >= 1_000 ? `${(val / 1_000).toFixed(0)}rb`
        : `${Math.round(val)}`
      ctx.fillStyle = '#9ca3af'
      ctx.font = '600 11px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, pad.left - 10, y)
    }

    // Bars
    const slotW = chartW / data.length
    const barW = Math.min(44, slotW * 0.55)
    const bars: BarRect[] = []

    data.forEach((d, i) => {
      const x = pad.left + i * slotW + (slotW - barW) / 2
      const barH = d.total > 0 ? Math.max(4, (d.total / maxVal) * chartH) : 0
      const y = pad.top + chartH - barH
      const isHovered = hoveredIndex === i

      bars.push({ x, y, w: barW, h: barH, index: i })

      // Highlight slot background on hover
      if (isHovered) {
        ctx.fillStyle = 'rgba(244,63,94,0.06)'
        ctx.beginPath()
        ctx.roundRect(x - 6, pad.top, barW + 12, chartH, 6)
        ctx.fill()
      }

      ctx.shadowColor = isHovered ? 'rgba(244,63,94,0.30)' : 'rgba(244,63,94,0.18)'
      ctx.shadowBlur = isHovered ? 14 : 8
      ctx.shadowOffsetY = isHovered ? 5 : 3

      const grad = ctx.createLinearGradient(0, y, 0, pad.top + chartH)
      grad.addColorStop(0, isHovered ? '#e11d48' : '#f43f5e')
      grad.addColorStop(1, isHovered ? '#fb7185' : '#fecdd3')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, [6, 6, 2, 2])
      ctx.fill()

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Value label on top of bar
      if (d.total > 0 && barH > 20) {
        const valLabel =
          d.total >= 1_000_000 ? `${(d.total / 1_000_000).toFixed(1)}jt`
          : d.total >= 1_000 ? `${(d.total / 1_000).toFixed(0)}rb`
          : `${d.total}`
        ctx.fillStyle = isHovered ? '#e11d48' : '#f43f5e'
        ctx.font = `${isHovered ? '700' : '600'} 10px system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(valLabel, x + barW / 2, y - 4)
      }

      // X label
      ctx.fillStyle = isHovered ? '#f43f5e' : '#6b7280'
      ctx.font = `${isHovered ? '600' : '400'} 11px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(d.label, x + barW / 2, pad.top + chartH + 10)
    })

    barsRef.current = bars
  }, [data])

  useEffect(() => {
    draw(null)
  }, [draw])

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const hit = barsRef.current.find(
      (b) => mouseX >= b.x - 6 && mouseX <= b.x + b.w + 6 && mouseY >= b.y && mouseY <= b.y + b.h
    )

    if (hit) {
      canvas.style.cursor = 'pointer'
      setTooltip({ x: e.clientX - rect.left, y: hit.y, index: hit.index })
      draw(hit.index)
    } else {
      canvas.style.cursor = 'default'
      if (tooltip !== null) {
        setTooltip(null)
        draw(null)
      }
    }
  }

  function handleMouseLeave() {
    setTooltip(null)
    draw(null)
    const canvas = canvasRef.current
    if (canvas) canvas.style.cursor = 'default'
  }

  const tooltipData = tooltip !== null ? data[tooltip.index] : null

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '220px', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {tooltip && tooltipData && (
        <div
          className="absolute pointer-events-none z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            whiteSpace: 'nowrap',
          }}
        >
          <p className="font-semibold text-rose-300 mb-0.5">{tooltipData.label}</p>
          <p>{formatRupiah(tooltipData.total)}</p>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
