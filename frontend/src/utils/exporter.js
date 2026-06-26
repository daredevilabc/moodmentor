export const EXPORT_THEMES = [
  {
    id: 'dark-obsidian',
    name: 'Dark Obsidian',
    colors: ['#0f172a', '#020617'],
    text: '#f8fafc',
    pillBg: 'rgba(255, 255, 255, 0.08)',
    pillBorder: 'rgba(255, 255, 255, 0.12)'
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    colors: ['#7c2d12', '#3b0764'],
    text: '#faf5ff',
    pillBg: 'rgba(255, 255, 255, 0.1)',
    pillBorder: 'rgba(255, 255, 255, 0.15)'
  },
  {
    id: 'emerald-serenity',
    name: 'Emerald Serenity',
    colors: ['#064e3b', '#022c22'],
    text: '#f0fdf4',
    pillBg: 'rgba(255, 255, 255, 0.08)',
    pillBorder: 'rgba(255, 255, 255, 0.12)'
  },
  {
    id: 'mystic-amethyst',
    name: 'Mystic Amethyst',
    colors: ['#4c1d95', '#1e1b4b'],
    text: '#faf5ff',
    pillBg: 'rgba(255, 255, 255, 0.1)',
    pillBorder: 'rgba(255, 255, 255, 0.15)'
  },
  {
    id: 'cosmic-dawn',
    name: 'Cosmic Dawn',
    colors: ['#0369a1', '#581c87'],
    text: '#f0f9ff',
    pillBg: 'rgba(255, 255, 255, 0.09)',
    pillBorder: 'rgba(255, 255, 255, 0.14)'
  }
]

function getLines(ctx, text, maxWidth) {
  const words = text.split(' ')
  let lines = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + " " + word).width
    if (width < maxWidth) {
      currentLine += " " + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  return lines
}

export function exportWisdomCard(wisdomText, moodLabel, moodEmoji, philosophyName, themeId = 'dark-obsidian') {
  const theme = EXPORT_THEMES.find(t => t.id === themeId) || EXPORT_THEMES[0]

  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 1200
  const ctx = canvas.getContext('2d')

  // 1. Draw rich background gradient
  const grad = ctx.createLinearGradient(0, 0, 1200, 1200)
  grad.addColorStop(0, theme.colors[0])
  grad.addColorStop(1, theme.colors[1])
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1200, 1200)

  // 2. Draw beautiful background glows (simulating glassmorphism radial blurs)
  const radial1 = ctx.createRadialGradient(950, 250, 50, 950, 250, 550)
  radial1.addColorStop(0, 'rgba(14, 165, 233, 0.22)')
  radial1.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radial1
  ctx.fillRect(0, 0, 1200, 1200)

  const radial2 = ctx.createRadialGradient(250, 950, 50, 250, 950, 550)
  radial2.addColorStop(0, 'rgba(168, 85, 247, 0.18)')
  radial2.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = radial2
  ctx.fillRect(0, 0, 1200, 1200)

  // 3. Draw glassmorphism card container in center with shadow
  const cardX = 100
  const cardY = 100
  const cardW = 1000
  const cardH = 1000
  const cardRadius = 40

  ctx.save()
  // Premium drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 24
  ctx.shadowOffsetX = 0

  ctx.beginPath()
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius)
  // Transparent dark card overlay
  ctx.fillStyle = 'rgba(10, 15, 30, 0.55)'
  ctx.fill()

  // Thin elegant border
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.stroke()
  ctx.restore() // Resets shadows for subsequent drawing

  // 4. Header block setup
  const headerEndY = 330

  // Draw Emoji
  ctx.font = '64px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(moodEmoji, 600, 210)

  // Draw Subtitle / Tag text
  const tagText = `${moodLabel.toUpperCase()}  •  ${philosophyName.toUpperCase()}`
  ctx.font = 'bold 16px "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.fillText(tagText, 600, 285)

  // Draw elegant short header separator line
  ctx.beginPath()
  ctx.moveTo(560, 320)
  ctx.lineTo(640, 320)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 2
  ctx.stroke()

  // 5. Footer block setup
  const footerStartY = 880

  // Draw separator above footer
  ctx.beginPath()
  ctx.moveTo(540, 890)
  ctx.lineTo(660, 890)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Draw MoodMentor Logo
  ctx.font = 'bold 18px "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.fillText('✨  M O O D M E N T O R', 600, 945)

  // Draw tagline
  ctx.font = 'italic 14px "Georgia", serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.fillText('AI Wisdom for Every Mood', 600, 975)

  // 6. Dynamic Quote Block Layout (between headerEndY and footerStartY)
  const centerY = (headerEndY + footerStartY) / 2 // Center of the text space (605px)
  const maxTextHeight = 440 // Comfortably fits inside the text space
  const wrapWidth = 760

  let fontSize = 42
  let lines = []
  let lineHeight = 0
  let totalHeight = 0

  // Dynamically shrink font size down to a minimum to ensure quote fits perfectly without overlapping headers/footers
  do {
    ctx.font = `italic ${fontSize}px "Georgia", "Playfair Display", serif`
    lines = getLines(ctx, wisdomText, wrapWidth)
    lineHeight = Math.round(fontSize * 1.55)
    totalHeight = lines.length * lineHeight
    if (totalHeight <= maxTextHeight || fontSize <= 24) {
      break
    }
    fontSize -= 2
  } while (fontSize > 24)

  // Recalculate max width for quotation mark placing
  ctx.font = `italic ${fontSize}px "Georgia", "Playfair Display", serif`
  let maxLineWidth = 0
  lines.forEach(line => {
    const w = ctx.measureText(line).width
    if (w > maxLineWidth) maxLineWidth = w
  })

  const textStartY = centerY - (totalHeight / 2) + (lineHeight / 2)
  const boxTop = centerY - (totalHeight / 2)
  const boxBottom = centerY + (totalHeight / 2)
  const boxLeft = 600 - (maxLineWidth / 2)
  const boxRight = 600 + (maxLineWidth / 2)

  // 7. Draw large quotation marks flanking the quote block beautifully
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.font = '160px "Georgia", serif'
  ctx.textBaseline = 'middle'

  // Left quote mark (align right, positioned gracefully next to the top-left corner of text box)
  ctx.textAlign = 'right'
  ctx.fillText('“', Math.max(160, boxLeft - 40), boxTop + 10)

  // Right quote mark (align left, positioned gracefully next to the bottom-right corner of text box)
  ctx.textAlign = 'left'
  ctx.fillText('”', Math.min(1040, boxRight + 40), boxBottom + 50)

  // 8. Draw wrapped quote lines
  ctx.fillStyle = theme.text
  ctx.font = `italic ${fontSize}px "Georgia", "Playfair Display", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  lines.forEach((line, i) => {
    ctx.fillText(line, 600, textStartY + (i * lineHeight))
  })

  // 9. Trigger browser download of high-quality image card
  const url = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = `moodmentor-${moodLabel.toLowerCase()}-${philosophyName.toLowerCase().replace(' ', '-')}.png`
  link.href = url
  link.click()
}
