<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { scroll } from 'quasar'

// ---------- Refs used in template ----------
const particlesCanvas = ref(null)
const heroSection = ref(null)
const featuresSection = ref(null)
const previewSection = ref(null)
const testimonialsSection = ref(null)
const ctaSection = ref(null)
const featureCards = ref([])
const visibleSections = ref(new Set())

// ---------- Static data ----------
const features = ref([
  {
    icon: 'headphones',
    title: 'Spotify Integration',
    description:
      'Connect your Spotify account and let us analyze your top artists, genres, and listening patterns to find your perfect musical matches.',
  },
  {
    icon: 'favorite',
    title: 'Music-Based Matching',
    description:
      'Discover people who share your sound. Our algorithm matches you with others based on musical compatibility and shared tastes.',
  },
  {
    icon: 'map',
    title: 'Event Discovery',
    description:
      'See concerts, festivals, and music events near you. Find out who else is going and connect before the show even starts.',
  },
  {
    icon: 'chat',
    title: 'Real-Time Chat',
    description:
      'Match with someone? Start chatting instantly. Plan meetups at events, share playlists, and build your music community.',
  },
])

const testimonials = ref([
  {
    name: 'Alex Rivera',
    genre: 'Indie Rock Enthusiast',
    avatar: 'https://i.pravatar.cc/150?img=33',
    text:
      'Found my concert crew through Venyu. We have gone to 12 shows together in the past 6 months. This app changed how I experience live music.',
  },
  {
    name: 'Maya Chen',
    genre: 'Electronic Music Lover',
    avatar: 'https://i.pravatar.cc/150?img=45',
    text:
      'The matching algorithm is incredible. Every person I have met through Venyu has introduced me to amazing new artists. My Spotify has never been better.',
  },
  {
    name: 'Jordan Blake',
    genre: 'Hip-Hop Head',
    avatar: 'https://i.pravatar.cc/150?img=68',
    text:
      'As someone who moved to a new city, Venyu helped me find my people. Now I have a whole friend group that gets my music taste. Game changer.',
  },
])

// 👉 immer echter Backend-Login, kein Demo-Mode mehr
const API = import.meta.env.VITE_API_BASE || ''

const onSpotifyConnect = () => {
  const state = btoa(
    JSON.stringify({
      returnTo: `${location.origin}/profile`, // oder '/swipe', wenn du lieber dorthin willst
    }),
  )

  const base = API || ''
  window.location.href = `${base}/api/spotify/auth/login?state=${encodeURIComponent(
    state,
  )}`
}

const stats = ref([
  { label: 'Active Users', value: 50000 },
  { label: 'Matches Made', value: 250000 },
  { label: 'Events Discovered', value: 10000 },
])

const animatedStats = ref({
  'Active Users': '0',
  'Matches Made': '0',
  'Events Discovered': '0',
})

let particles = []
let animationFrame = null
let observer = null

const setupIntersectionObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const sectionId = entry.target.getAttribute('data-section')
        if (!sectionId) return
        visibleSections.value.add(sectionId)
        if (sectionId === 'cta') animateStats()
      })
    },
    { threshold: 0.15 },
  )

  ;[
    { ref: heroSection, id: 'hero' },
    { ref: featuresSection, id: 'features' },
    { ref: previewSection, id: 'preview' },
    { ref: testimonialsSection, id: 'testimonials' },
    { ref: ctaSection, id: 'cta' },
  ].forEach(({ ref: r, id }) => {
    if (!r.value) return
    r.value.setAttribute('data-section', id)
    observer.observe(r.value)
  })
}

const initParticles = () => {
  const canvas = particlesCanvas.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const ctx = canvas.getContext('2d')

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width
      this.y = Math.random() * canvas.height
      this.size = Math.random() * 2 + 1
      this.speedX = Math.random() * 0.5 - 0.25
      this.speedY = Math.random() * 0.5 - 0.25
      this.color = `hsla(${Math.random() * 60 + 260}, 70%, 60%, ${
        Math.random() * 0.5 + 0.2
      })`
    }
    update() {
      this.x += this.speedX
      this.y += this.speedY
      if (this.x > canvas.width) this.x = 0
      if (this.x < 0) this.x = canvas.width
      if (this.y > canvas.height) this.y = 0
      if (this.y < 0) this.y = canvas.height
    }
    draw() {
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  particles = Array.from({ length: 100 }, () => new Particle())

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach((p) => {
      p.update()
      p.draw()
    })

    particles.forEach((a, i) => {
      particles.slice(i + 1).forEach((b) => {
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distance = Math.hypot(dx, dy)
        if (distance < 100) {
          ctx.strokeStyle = `hsla(280, 70%, 60%, ${
            0.2 * (1 - distance / 100)
          })`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      })
    })

    animationFrame = requestAnimationFrame(animate)
  }

  animate()
}

const animateStats = () => {
  stats.value.forEach((stat) => {
    let current = 0
    const increment = stat.value / 100
    const timer = setInterval(() => {
      current += increment
      if (current >= stat.value) {
        current = stat.value
        clearInterval(timer)
      }
      animatedStats.value[stat.label] =
        Math.floor(current).toLocaleString() + '+'
    }, 20)
  })
}

const onCardEnter = (index) => {
  const card = featureCards.value[index]
  if (card) card.$el.style.transition = 'transform 0.1s ease'
}
const onCardMove = (e, index) => {
  const card = featureCards.value[index]
  if (!card) return
  const rect = card.$el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = (y - centerY) / 10
  const rotateY = (centerX - x) / 10
  card.$el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
}
const onCardLeave = (index) => {
  const card = featureCards.value[index]
  if (card) card.$el.style.transform =
    'perspective(1000px) rotateX(0) rotateY(0) scale(1)'
}

const { getScrollTarget, setVerticalScrollPosition } = scroll

function scrollToTop() {
  const el = document.scrollingElement || document.documentElement
  const target = getScrollTarget(el)
  setVerticalScrollPosition(target, 0, 600)
}

/* ---------- Lifecycle ---------- */
onMounted(() => {
  initParticles()
  setupIntersectionObserver()

  const handleResize = () => {
    if (!particlesCanvas.value) return
    particlesCanvas.value.width = window.innerWidth
    particlesCanvas.value.height = window.innerHeight
  }
  window.addEventListener('resize', handleResize)
  onUnmounted(() => window.removeEventListener('resize', handleResize))
})

onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame)
  if (observer) observer.disconnect()
})
</script>
