'use client'
import { useEffect, useRef } from 'react'

interface ChartData {
  label: string
  total: number
}

export default function SalesChart({ data }: { data: ChartData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const pad = { top: 20, right: 20, bottom: 40, left: 70 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom
    const maxVal = Math.max(...data.map((d) => d.total), 1)

    ctx.clearRect(0, 0, w, h)

    ctx.strokeStyle = '#f3f4f6'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH * (4 - i)) / 4
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + chartW, y)
      ctx.stroke()

      ctx.fillStyle = '#9ca3af'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'right'
      const val = (maxVal * i) / 4
      ctx.fillText(
        val >= 1000000 ? `${(val / 1000000).toFixed(1)}jt` : val >= 1000 ? `${(val / 1000).toFixed(0)}rb` : `${val}`,
        pad.left - 6,
        y + 4
      )
    }

    const barW = Math.min(40, chartW / data.length - 8)
    data.forEach((d, i) => {
      const x = pad.left + (i * chartW) / data.length + (chartW / data.length - barW) / 2
      const barH = d.total > 0 ? (d.total / maxVal) * chartH : 0
      const y = pad.top + chartH - barH

      const grad = ctx.createLinearGradient(0, y, 0, pad.top + chartH)
      grad.addColorStop(0, '#f43f5e')
      grad.addColorStop(1, '#fda4af')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, 4)
      ctx.fill()

      ctx.fillStyle = '#6b7280'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(d.label, x + barW / 2, pad.top + chartH + 16)
    })
  }, [data])

  return <canvas ref={canvasRef} width={700} height={220} className="w-full h-auto" />
}
