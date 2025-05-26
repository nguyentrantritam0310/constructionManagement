<template>
  <div class="nyan-cat-loader">
    <div class="kawaii-container">
      <div class="cloud cloud-1">☁️</div>
      <div class="cloud cloud-2">☁️</div>
      <div class="animation-container">
        <canvas ref="canvas" />
      </div>
      <div class="cloud cloud-3">☁️</div>
      <div class="cloud cloud-4">☁️</div>
    </div>
    <div class="loading-text">
      <span class="kawaii-emoji">🌈</span>
      Để mèo đi lấy dữ liệu cho bạn nhé 🐾
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'

const props = defineProps({
  noticeText: {
    type: String,
    default: ''
  }
})

const canvas = ref(null)
const noise2D = createNoise2D()

// const picCat = 'https://yufengjie97.github.io/nova/assets/nyan-cat-C7BIGZXh.png'
const picCat = '../../../public/nyan-cat-C7BIGZXh.png'

function loadImg(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      resolve(img)
    }
  })
}

async function createImgCanvasIdle(canvasSize, imgSrc, idleNum, interval = 60) {
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize.w
  canvas.height = canvasSize.h
  const ctx = canvas.getContext('2d')

  const img = await loadImg(imgSrc)

  let i = 0
  const idleW = img.width / idleNum
  const idleH = img.height
  const timer = setInterval(() => {
    i += 1
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h)
    ctx.drawImage(img, i % idleNum * idleW, 0, idleW, idleH, 0, 0, canvasSize.w, canvasSize.h)
  }, interval)

  return { timer, canvas, img }
}

const { floor, random } = Math
const curveWidth = 20
const yRange = 30
const xRange = 40

let animateId = 0
let timer

class Star {
  size = 10
  type = 0
  pos
  isLive = true
  lastTime = 0
  interval = 0.1

  constructor(width, height) {
    this.pos = new THREE.Vector2(random() * width + width, random() * height)
    this.type = floor(random() * 4)
  }

  update(t, ctx) {
    if (t - this.lastTime > this.interval) {
      this.type = (this.type + 1) % 4
      this.lastTime = t
    }
    this.pos.x -= 10
    if (this.pos.x < -10)
      this.isLive = false

    this.draw(ctx)
  }

  draw(ctx) {
    const p = this.pos
    const s = this.size
    ctx.fillStyle = '#fff'
    if (this.type === 0)
      ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size)

    if (this.type === 1) {
      ctx.fillRect(p.x, p.y, s, s)
      ctx.fillRect(p.x - s, p.y, s, s)
      ctx.fillRect(p.x + s, p.y, s, s)
      ctx.fillRect(p.x, p.y - s, s, s)
      ctx.fillRect(p.x, p.y + s, s, s)
    }
    if (this.type === 2) {
      ctx.fillRect(p.x, p.y, s, s)
      ctx.fillRect(p.x - s, p.y, s, s)
      ctx.fillRect(p.x - 2 * s, p.y, s, s)
      ctx.fillRect(p.x + s, p.y, s, s)
      ctx.fillRect(p.x + 2 * s, p.y, s, s)
      ctx.fillRect(p.x, p.y - s, s, s)
      ctx.fillRect(p.x, p.y - 2 * s, s, s)
      ctx.fillRect(p.x, p.y + s, s, s)
      ctx.fillRect(p.x, p.y + 2 * s, s, s)
    }
    if (this.type === 3) {
      ctx.fillRect(p.x - 1.5 * s, p.y - 1.5 * s, s, s)
      ctx.fillRect(p.x + 1.5 * s, p.y + 1.5 * s, s, s)
      ctx.fillRect(p.x + 1.5 * s, p.y - 1.5 * s, s, s)
      ctx.fillRect(p.x - 1.5 * s, p.y + 1.5 * s, s, s)

      ctx.fillRect(p.x - 2 * s, p.y, s, s)
      ctx.fillRect(p.x + 2 * s, p.y, s, s)
      ctx.fillRect(p.x, p.y - 2 * s, s, s)
      ctx.fillRect(p.x, p.y + 2 * s, s, s)
    }
  }
}

class Curve {
  points = []
  color = '#fff'

  constructor(color) {
    this.color = color
  }

  draw(ctx) {
    ctx.beginPath()
    ctx.moveTo(this.points[0].x, this.points[0].y)
    for (let i = 1; i < this.points.length - 1; i += 1) {
      const cur = this.points[i]
      const next = this.points[i + 1]
      const center = new THREE.Vector2().copy(cur).add(next).multiplyScalar(0.5)
      ctx.quadraticCurveTo(cur.x, cur.y, center.x, center.y)
    }
    const last = this.points[this.points.length - 1]
    ctx.lineTo(last.x, last.y)
    const start = this.points[0]
    const end = this.points[this.points.length - 1]
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y)
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(0.5, this.color)
    gradient.addColorStop(1, this.color)
    ctx.strokeStyle = gradient
    ctx.stroke()
  }
}

class Rainbow {
  points = []
  curves = []
  colors = ['#e12523', '#dc8d30', '#deeb44', '#01eb3e', '#138ee9', '#7127ee']
  catCanvas
  width
  height
  catCanvasW
  catCanvasH

  constructor(catCanvas, width, height) {
    this.catCanvas = catCanvas
    this.width = width
    this.height = height

    // Set cat canvas dimensions
    const scale = 105 / 68
    this.catCanvasH = curveWidth * 5
    this.catCanvasW = this.catCanvasH * scale

    for (let i = 0; i < this.colors.length; i += 1) {
      const curve = new Curve(this.colors[i])
      this.curves.push(curve)
    }
  }

  updateCurvePoints() {
    const centerX = this.width / 2
    const centerY = this.height / 2

    this.curves.forEach((c, ci, carr) => {
      c.points = this.points.map((p) => {
        return new THREE.Vector2(p.x, p.y + (ci - carr.length / 2) * curveWidth + curveWidth / 2)
      })
      const tail = new THREE.Vector2(centerX + 100, centerY + (ci - carr.length / 2) * curveWidth + curveWidth / 2)
      c.points.push(tail)
    })
  }

  update(t, ctx) {
    this.points.length = 0
    const centerY = this.height / 2
    const yStart = centerY - yRange

    for (let x = -xRange; x < this.width / 2 + 100; x += xRange) {
      const y = yStart + noise2D(x * 0.01 + t * 2, 0) * yRange * 2
      this.points.push(new THREE.Vector2(x, y))
    }
    this.updateCurvePoints()
    this.draw(ctx)
  }

  draw(ctx) {
    this.curves.forEach(c => c.draw(ctx))
    ctx.drawImage(
      this.catCanvas,
      this.width / 2 + 50 - this.catCanvasW / 2,
      this.height / 2 - this.catCanvasH / 2
    )
  }
}

onMounted(async () => {
  const canvasEl = canvas.value
  const container = canvasEl.parentElement
  const { width, height } = container.getBoundingClientRect()

  canvasEl.width = width
  canvasEl.height = height
  const ctx = canvasEl.getContext('2d')

  // Set up cat canvas - make it smaller
  const scale = 105 / 68
  const catCanvasH = curveWidth * 5 // Reduced from 9 to 5 to make cat smaller
  const catCanvasW = catCanvasH * scale

  const { canvas: catCanvas, timer: tim } = await createImgCanvasIdle(
    { w: catCanvasW, h: catCanvasH },
    picCat,
    6
  )
  timer = tim

  const rainbow = new Rainbow(catCanvas, width, height)

  const starNum = 15 // Increased number of stars
  const stars = []
  for (let i = 0; i < starNum; i++)
    stars.push(new Star(width, height))

  function animate() {
    const t = performance.now() / 1000

    ctx.fillStyle = '#ffffff' // Changed to white background
    ctx.fillRect(0, 0, width, height)
    ctx.lineWidth = curveWidth * 0.7 // Made rainbow thinner

    rainbow.update(t, ctx)

    let i = 0
    while (i < starNum) {
      const s = stars[i]
      s.update(t, ctx)
      if (!s.isLive) {
        stars.splice(i, 1)
        stars.push(new Star(width, height))
      }
      else {
        i++
      }
    }

    animateId = requestAnimationFrame(animate)
  }

  animate()
})

onBeforeUnmount(() => {
  if (animateId) {
    cancelAnimationFrame(animateId)
  }
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.nyan-cat-loader {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.kawaii-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.animation-container {
  width: 400px;
  height: 200px;
  position: relative;
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 30px;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(255, 182, 193, 0.2);
  backdrop-filter: blur(5px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: float 6s ease-in-out infinite;
}

.cloud {
  position: absolute;
  font-size: 2rem;
  opacity: 0.8;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  animation: floatCloud 8s ease-in-out infinite;
}

.cloud-1 {
  top: 10%;
  left: 10%;
  animation-delay: -2s;
}

.cloud-2 {
  top: 20%;
  right: 15%;
  animation-delay: -1s;
}

.cloud-3 {
  bottom: 25%;
  left: 5%;
  animation-delay: -3s;
}

.cloud-4 {
  bottom: 15%;
  right: 10%;
  animation-delay: -4s;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 20px;
}

.loading-text {
  margin-top: 0.5rem;
  font-size: 1.3rem;
  color: #ff6b6b;
  font-weight: 600;
  text-align: center;
  padding: 1.2rem 2.5rem;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 25px;
  box-shadow: 0 8px 25px rgba(255, 182, 193, 0.3);
  animation: bounce 2s infinite;
  position: relative;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  letter-spacing: 0.5px;
  border: 2px solid rgba(255, 192, 203, 0.3);
  backdrop-filter: blur(5px);
}

.kawaii-emoji {
  display: inline-block;
  margin: 0 8px;
  animation: spin 3s linear infinite;
}

.loading-text::after {
  content: '...';
  position: absolute;
  right: -8px;
  animation: ellipsis 1.5s infinite;
}

/* Add cute heart decorations */
.loading-text::before {
  content: '♥';
  color: #ff9999;
  margin-right: 8px;
  display: inline-block;
  animation: heartbeat 1.5s infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes floatCloud {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-15px) scale(1.05);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-5px) scale(1.02);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes ellipsis {
  0% {
    content: '.';
  }
  33% {
    content: '..';
  }
  66% {
    content: '...';
  }
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

/* Add sparkle effect */
.animation-container::after {
  content: '✨';
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 1.5rem;
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2) rotate(180deg);
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .animation-container {
    width: 300px;
    height: 150px;
  }

  .loading-text {
    font-size: 1.1rem;
    padding: 1rem 2rem;
  }

  .cloud {
    font-size: 1.5rem;
  }
}
</style>
