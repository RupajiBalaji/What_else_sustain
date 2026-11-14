/**
 * Generates an educational share card image using Canvas.
 * Produces a downloadable PNG blob or triggers Web Share API.
 */
export async function generateShareCardBlob({
  rank = 'A',
  rankTitle = 'Sustainable Steward',
  seasonIndex = 1,
  balance = 12000,
  soilHealth = 70,
  villageHealth = 75,
  siteUrl = 'https://what-else-sustain.web.app'
}) {
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Dark background
  ctx.fillStyle = '#0F151B'
  ctx.fillRect(0, 0, 1200, 630)

  // Subtle gradient accent
  const grad = ctx.createLinearGradient(0, 0, 1200, 630)
  grad.addColorStop(0, 'rgba(46, 125, 50, 0.15)')
  grad.addColorStop(1, 'rgba(21, 101, 192, 0.10)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1200, 630)

  // Border frame
  ctx.strokeStyle = '#2E7D32'
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, 1152, 582)

  // Header Title
  ctx.fillStyle = '#A5D6A7'
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('WHAT ELSE SUSTAIN — Season Honor Card', 64, 96)

  // Rank badge container
  ctx.fillStyle = 'rgba(27, 94, 32, 0.65)'
  ctx.strokeStyle = '#81C784'
  ctx.lineWidth = 3
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(64, 136, 140, 140, [16])
  } else {
    ctx.rect(64, 136, 140, 140)
  }
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 76px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(rank, 134, 236)
  ctx.textAlign = 'left'

  // Summary Metrics
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(`Season ${seasonIndex} • ${rankTitle}`, 234, 185)

  ctx.fillStyle = '#CFD8DC'
  ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(`Bank: ₹${Number(balance).toLocaleString()}  |  Soil: ${soilHealth}/100  |  Clean Air: ${villageHealth}/100`, 234, 235)

  // One-sentence takeaway
  ctx.fillStyle = '#E8F5E9'
  ctx.font = 'italic 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('“Every alternative to stubble burning restores topsoil and protects village health.”', 64, 370)

  // Pledge note
  ctx.fillStyle = '#81C784'
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('✓ Pledged: I choose sustainable alternatives to burning straw.', 64, 430)

  // Footer & Disclaimer
  ctx.fillStyle = '#64B5F6'
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(siteUrl, 64, 530)

  ctx.fillStyle = '#78909C'
  ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Game estimate results for educational simulation (not real farm laboratory data).', 64, 565)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

/**
 * Triggers a download or Web Share for the season card.
 */
export async function shareOrDownloadCard(cardData) {
  const blob = await generateShareCardBlob(cardData)
  if (!blob) return false

  const file = new File([blob], 'wes-season-report.png', { type: 'image/png' })

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'What Else Sustain — Season Card',
        text: 'I pledged a clean sky and sustainable soil in What Else Sustain!',
        files: [file]
      })
      return true
    } catch {
      // User cancelled or share failed, fallback to download
    }
  }

  // Fallback to browser download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wes-season-${cardData.seasonIndex || 1}-report.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return true
}
