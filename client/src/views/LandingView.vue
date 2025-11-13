<template>
  <q-page class="venyu-landing">
    <!-- Animated Background -->
    <div class="animated-bg">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="mesh-gradient"></div>
      <div class="noise-overlay"></div>
    </div>

    <!-- Particles Canvas -->
    <canvas ref="particlesCanvas" class="particles-canvas"></canvas>

    <!-- Hero Section -->
    <section class="hero-section" ref="heroSection">
      <div class="container">
        <div class="text-center q-pt-xl q-pb-xl fade-in-up" :class="{ 'visible': visibleSections.has('hero') }">
          <img src="../assets/venyuUpscaled.png" alt="" class="hero-logo fade-in-up"
            :class="{ visible: visibleSections.has('hero') }">
          <h1 class="hero-title">
            Connect Through Music
          </h1>
          <p class="hero-subtitle q-mb-xl">
            Find your rhythm with Venyu – the ultimate app to discover music events and connect with like-minded fans
          </p>
          <div class="cta-buttons">
            <q-btn unelevated size="lg" class="cta-primary flex items-center justify-center gap-3" label="Start Demo"
              @click="startDemo" />
            <q-btn outline size="lg" class="cta-secondary glass-btn flex items-center justify-center gap-3"
              @click="onSpotifyConnect">
              <template v-slot:default>
                <img src="/src/assets/spotify-logo.png" alt="Spotify Logo" class="spotify-icon" />
                <span class="button-text">Connect with Spotify</span>
                <div class="button-glow"></div>
              </template>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- 3D Floating Elements -->
      <div class="floating-elements">
        <div class="float-item item-1">
          <div class="vinyl-record rotating"></div>
        </div>
        <div class="float-item item-2">
          <div class="sound-wave pulsing"></div>
        </div>
        <div class="float-item item-3">
          <div class="music-note bouncing">♪</div>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="scroll-indicator">
        <div class="mouse">
          <div class="wheel"></div>
        </div>
        <div class="arrow-down"></div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section q-py-xl" ref="featuresSection">
      <div class="container">
        <div class="text-center q-mb-xl fade-in-up" :class="{ 'visible': visibleSections.has('features') }">
          <h2 class="section-title">
            How Venyu Works
          </h2>
          <p class="section-subtitle">Your music taste is your passport to meaningful connections</p>
        </div>

        <div class="row q-col-gutter-lg">
          <div v-for="(feature, index) in features" :key="index" class="col-12 col-md-6 col-lg-3">
            <q-card class="feature-card morphism-card fade-in-up"
              :class="{ 'visible': visibleSections.has('features') }" :style="{ transitionDelay: `${index * 0.1}s` }"
              @mouseenter="onCardEnter(index)" @mousemove="onCardMove($event, index)" @mouseleave="onCardLeave(index)"
              :ref="el => { if (el) featureCards[index] = el }">
              <div class="card-glow"></div>
              <q-card-section class="text-center">
                <div class="feature-icon-wrapper q-mb-md">
                  <div class="icon-ripple"></div>
                  <q-icon :name="feature.icon" size="64px" class="feature-icon" />
                </div>
                <h3 class="feature-title q-mb-sm">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Parallax Shapes -->
      <div class="parallax-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </section>

    <!-- App Preview Section -->
    <section class="preview-section q-py-xl" ref="previewSection">
      <div class="container">
        <div class="text-center q-mb-xl fade-in-up" :class="{ 'visible': visibleSections.has('preview') }">
          <h2 class="section-title">Experience Venyu</h2>
          <p class="section-subtitle">Seamless design meets powerful connection</p>
        </div>

        <div class="preview-showcase fade-in-up" :class="{ 'visible': visibleSections.has('preview') }">
          <div class="preview-main">
            <div class="phone-mockup">
              <div class="phone-frame">
                <div class="phone-notch"></div>
                <div class="phone-screen">
                  <div class="screen-content swipe-demo">
                    <div class="profile-card card-stack">
                      <div class="profile-gradient"></div>
                      <div class="profile-info">
                        <h3>Music Compatibility</h3>
                        <div class="match-percentage">94%</div>
                        <div class="genre-tags">
                          <span class="tag">Indie Rock</span>
                          <span class="tag">Electronic</span>
                          <span class="tag">Alternative</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="preview-side preview-left">
            <div class="mini-phone">
              <div class="mini-screen event-map">
                <div class="map-pin pin-1 ping"></div>
                <div class="map-pin pin-2 ping"></div>
                <div class="map-pin pin-3 ping"></div>
              </div>
            </div>
          </div>

          <div class="preview-side preview-right">
            <div class="mini-phone">
              <div class="mini-screen chat-interface">
                <div class="chat-bubble bubble-1"></div>
                <div class="chat-bubble bubble-2"></div>
                <div class="chat-bubble bubble-3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonial Section -->
    <section class="testimonial-section q-py-xl" ref="testimonialsSection">
      <div class="container">
        <div class="text-center q-mb-xl fade-in-up" :class="{ 'visible': visibleSections.has('testimonials') }">
          <h2 class="section-title neon-text">Join the Movement</h2>
          <p class="section-subtitle">Thousands of music lovers connecting every day</p>
        </div>

        <div class="testimonial-carousel">
          <div v-for="(testimonial, index) in testimonials" :key="index" class="testimonial-card-wrapper fade-in-up"
            :class="{ 'visible': visibleSections.has('testimonials') }"
            :style="{ transitionDelay: `${index * 0.15}s` }">
            <q-card class="testimonial-card holographic-card">
              <div class="holographic-overlay"></div>
              <q-card-section>
                <div class="row items-center q-mb-md">
                  <div class="avatar-wrapper q-mr-md">
                    <q-avatar size="56px">
                      <img :src="testimonial.avatar">
                    </q-avatar>
                    <div class="avatar-ring"></div>
                  </div>
                  <div>
                    <div class="text-weight-bold text-h6">{{ testimonial.name }}</div>
                    <div class="text-caption genre-badge">{{ testimonial.genre }}</div>
                  </div>
                </div>
                <p class="testimonial-text">{{ testimonial.text }}</p>
                <div class="quote-mark">"</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section q-py-xl" ref="ctaSection">
      <div class="container text-center">
        <div class="cta-content fade-in-up" :class="{ 'visible': visibleSections.has('cta') }">
          <h2 class="cta-title">Ready to Find Your Tribe?</h2>
          <p class="cta-subtitle q-mb-xl">
            Join thousands of music lovers discovering events and making real connections
          </p>
          <div class="cta-actions">
            <q-btn unelevated size="xl" class="cta-primary-large glow-btn" label="Get Started Now" @click="scrollToTop">
              <div class="button-shine"></div>
            </q-btn>
          </div>

        </div>

        <!-- Stats Counter -->
        <div class="stats-row q-mt-xl fade-in-up" :class="{ 'visible': visibleSections.has('cta') }">
          <div class="stat-item" v-for="stat in stats" :key="stat.label">
            <div class="stat-number" :data-target="stat.value">{{ animatedStats[stat.label] }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer q-py-xl">
      <div class="container">
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-4">
            <h3 class="footer-logo q-mb-md">Venyu</h3>
            <p class="footer-text">
              Connecting people through the universal language of music
            </p>
            <div class="social-links q-mt-md">
              <a href="#" class="social-icon"><q-icon name="mdi-instagram" size="24px" /></a>
              <a href="#" class="social-icon"><q-icon name="mdi-twitter" size="24px" /></a>
              <a href="#" class="social-icon"><q-icon name="mdi-tiktok" size="24px" /></a>
              <a href="#" class="social-icon"><q-icon name="mdi-discord" size="24px" /></a>
            </div>
          </div>

          <div class="col-12 col-md-4">
            <h4 class="footer-heading q-mb-md">Company</h4>
            <div class="footer-links">
              <a href="#about">About</a>
              <a href="#team">Team</a>
              <a href="#contact">Contact</a>
              <a href="#careers">Careers</a>
            </div>
          </div>

          <div class="col-12 col-md-4">
            <h4 class="footer-heading q-mb-md">Legal</h4>
            <div class="footer-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#spotify">Spotify API Notice</a>
            </div>
          </div>
        </div>

        <q-separator class="q-my-lg footer-separator" />

        <div class="text-center text-grey-6">
          <p>&copy; 2025 Letzte Reihe GmbH. All rights reserved. Made with music and code.</p>
          <p class="text-caption q-mt-sm">
            This product uses the Spotify API but is not endorsed or certified by Spotify.
          </p>
        </div>
      </div>
    </footer>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { scroll } from 'quasar'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMatchesStore } from '@/stores/matches'
import { useEventsStore } from '@/stores/events'

const $q = useQuasar()
const router = useRouter()
const user = useUserStore()
const matches = useMatchesStore()
const events = useEventsStore()

// Refs used in template
const particlesCanvas = ref(null)
const heroSection = ref(null)
const featuresSection = ref(null)
const previewSection = ref(null)
const testimonialsSection = ref(null)
const ctaSection = ref(null)
const featureCards = ref([])
const visibleSections = ref(new Set())

/* ---------- Static data ---------- */
// ---------- Static data ----------
const features = ref([
  {
    icon: 'headphones',
    title: 'Music Compatibility',
    description: 'Connect with people who share your musical DNA through advanced compatibility matching'
  },
  {
    icon: 'event',
    title: 'Event Discovery',
    description: 'Find concerts, festivals, and music events happening near you'
  },
  {
    icon: 'group',
    title: 'Music Communities',
    description: 'Join groups of like-minded music enthusiasts in your area'
  },
  {
    icon: 'favorite',
    title: 'Meaningful Connections',
    description: 'Build lasting friendships and relationships through shared musical experiences'
  }
])

const testimonials = ref([
  {
    name: 'Sarah M.',
    genre: 'Indie Rock Enthusiast',
    avatar: 'https://i.pravatar.cc/150?img=1',
    text: 'I found my concert buddy through Venyu! We\'ve been to 12 shows together and discovered so many new artists.'
  },
  {
    name: 'Mike D.',
    genre: 'Electronic Music Producer',
    avatar: 'https://i.pravatar.cc/150?img=2',
    text: 'The music compatibility feature is incredible. I\'ve connected with people I never would have met otherwise.'
  },
  {
    name: 'Jessica L.',
    genre: 'Festival Lover',
    avatar: 'https://i.pravatar.cc/150?img=3',
    text: 'As someone who moved to a new city, Venyu helped me find my people. Now I have a whole friend group that gets my music taste. Game changer.'
  }
])

const stats = ref([
  { label: 'Active Users', value: 50000 },
  { label: 'Matches Made', value: 250000 },
  { label: 'Events Attended', value: 75000 },
  { label: 'Cities Connected', value: 150 }
])

const animatedStats = ref({})

async function startDemo() {
  try {
    $q.loading?.show()
    await user.fetchMe()
    await matches.fetchMatches()
    await events.fetchNearby()
    router.push({ name: 'DemoLogin' })
  } finally {
    $q.loading?.hide()
  }
}

const API = import.meta.env.VITE_API_BASE || ''

const onSpotifyConnect = () => {
  if (IS_DEMO) {
    $q.notify({
      type: 'info',
      message: 'Demo mode is active — use "Start Demo" to explore without Spotify.'
    })
    return
  }

  const state = btoa(JSON.stringify({
    returnTo: `${location.origin}/profile`
  }))

  const base = API || ''
  window.location.href = `${base}/api/spotify/auth/login?state=${encodeURIComponent(state)}`
}

const setupIntersectionObserver = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.getAttribute('data-section')
        if (entry.isIntersecting) {
          visibleSections.value.add(sectionId)
          if (sectionId === 'cta') {
            animateStats()
          }
        }
      })
    },
    { threshold: 0.15 }
  )

    ;[
      { ref: heroSection, id: 'hero' },
      { ref: featuresSection, id: 'features' },
      { ref: previewSection, id: 'preview' },
      { ref: testimonialsSection, id: 'testimonials' },
      { ref: ctaSection, id: 'cta' }
    ].forEach(({ ref: r, id }) => {
      if (!r.value) return
      r.value.setAttribute('data-section', id)
      observer.observe(r.value)
    })
}

const initParticles = () => {
  const canvas = particlesCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const particles = []

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width
      this.y = Math.random() * canvas.height
      this.size = Math.random() * 2 + 1
      this.speedX = Math.random() * 0.5 - 0.25
      this.speedY = Math.random() * 0.5 - 0.25
      this.color = `hsla(${Math.random() * 60 + 260}, 70%, 60%, ${Math.random() * 0.5 + 0.2})`
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

  for (let i = 0; i < 100; i++) {
    particles.push(new Particle())
  }

  function animate() {
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
          ctx.strokeStyle = `hsla(280, 70%, 60%, ${0.2 * (1 - distance / 100)})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      })
    })

    requestAnimationFrame(animate)
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
      animatedStats.value[stat.label] = Math.floor(current).toLocaleString() + '+'
    }, 20)
  })
}

const onCardEnter = (index) => {
  const card = featureCards.value[index]
  if (card) card.$el.style.transition = 'transform 0.1s ease'
}

const onCardMove = (e, index) => {
  const card = featureCards.value[index]
  if (card) {
    const rect = card.$el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rotateX = (y / rect.height) * 10
    const rotateY = -(x / rect.width) * 10
    card.$el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
  }
}

const onCardLeave = (index) => {
  const card = featureCards.value[index]
  if (card) {
    card.$el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)'
  }
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
    if (particlesCanvas.value) {
      particlesCanvas.value.width = window.innerWidth
      particlesCanvas.value.height = window.innerHeight
    }
  }

  window.addEventListener('resize', handleResize)
  onUnmounted(() => window.removeEventListener('resize', handleResize))
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped lang="scss">
.fade-in-up {
  opacity: 0;
  transform: translateY(60px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.venyu-landing {
  background: #0a0a0f;
  color: #ffffff;
  position: relative;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

/* Animated Background */
.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
  animation: float 20s infinite ease-in-out;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #667eea 0%, transparent 70%);
  top: -10%;
  left: -10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #764ba2 0%, transparent 70%);
  top: 50%;
  right: -10%;
  animation-delay: -7s;
}

.orb-3 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #f093fb 0%, transparent 70%);
  bottom: -20%;
  left: 30%;
  animation-delay: -14s;
}

@keyframes float {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  33% {
    transform: translate(100px, -100px) scale(1.1);
  }

  66% {
    transform: translate(-100px, 100px) scale(0.9);
  }
}

.mesh-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(at 27% 37%, hsla(280, 70%, 30%, 0.3) 0px, transparent 50%),
    radial-gradient(at 97% 21%, hsla(260, 70%, 40%, 0.3) 0px, transparent 50%),
    radial-gradient(at 52% 99%, hsla(290, 70%, 35%, 0.3) 0px, transparent 50%),
    radial-gradient(at 10% 29%, hsla(270, 70%, 30%, 0.3) 0px, transparent 50%);
  animation: meshMove 15s ease infinite;
}

@keyframes meshMove {

  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

.spotify-icon {
  width: 30px;
  height: 30px;
  margin-right: 8px;
}

.noise-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
  mix-blend-mode: overlay;
}

.particles-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* Hero Section */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.hero-logo {
  display: block;
  margin: 0 auto 0.2rem;
  width: clamp(220px, 32vw, 560px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 30px rgba(0, 0, 0, .35));
  z-index: 2;
}


@media (max-width: 480px) {
  .hero-logo {
    height: clamp(48px, 12vw, 100px);
  }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.1;
  background: linear-gradient(135deg, #eaeaea 0%, #bfc8ff 60%, #8ea0ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.15);
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: clamp(1.125rem, 2.2vw, 1.375rem);
  color: rgba(255, 255, 255, 0.82);
  max-width: 760px;
  margin: 0.75rem auto 2rem;
}

/* CTA Buttons */
.cta-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-primary,
.cta-primary-large {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
  }
}

.magnetic-btn {
  cursor: pointer;
}

.glass-btn {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  border-radius: 50px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
}

.button-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.glass-btn:hover .button-glow {
  left: 100%;
}

/* Floating Elements */
.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.float-item {
  position: absolute;
  animation: floatItem 6s infinite ease-in-out;
}

.item-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.item-2 {
  top: 60%;
  right: 15%;
  animation-delay: -2s;
}

.item-3 {
  bottom: 20%;
  left: 15%;
  animation-delay: -4s;
}

@keyframes floatItem {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-30px) rotate(5deg);
  }
}

.vinyl-record {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background: #0a0a0f;
    border-radius: 50%;
  }
}

.rotating {
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.sound-wave {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f093fb 0%, #667eea 100%);
  border-radius: 50%;
}

.pulsing {
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

.music-note {
  font-size: 3rem;
  color: #f093fb;
}

.bouncing {
  animation: bounce 2s infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-20px);
  }
}

/* Scroll Indicator */
.scroll-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: fadeInUp 1s ease 2s both;
}

.mouse {
  width: 26px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 13px;
  position: relative;
}

.wheel {
  width: 4px;
  height: 8px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 2px;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  animation: scroll 2s infinite;
}

@keyframes scroll {
  0% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(16px);
  }
}

.arrow-down {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid rgba(255, 255, 255, 0.5);
  animation: arrowBounce 2s infinite;
}

@keyframes arrowBounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(5px);
  }
}

/* Features */
.features-section {
  position: relative;
  z-index: 2;
  padding: 120px 0;
}

.section-title {
  font-size: clamp(2.25rem, 5vw, 3.25rem);
  font-weight: 800;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
  background: linear-gradient(135deg, #ffffff 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 600px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2rem;
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
  }
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.feature-card:hover .card-glow {
  opacity: 1;
}

.feature-icon-wrapper {
  position: relative;
  display: inline-block;
}

.icon-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: 2px solid rgba(102, 126, 234, 0.5);
  border-radius: 50%;
  animation: ripple 2s infinite;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }

  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.feature-icon {
  color: #667eea;
  position: relative;
  z-index: 1;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.feature-description {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

/* Parallax Shapes */
.parallax-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.shape {
  position: absolute;
  opacity: 0.1;
}

.shape-1 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  top: 10%;
  right: 5%;
  animation: morphShape 10s infinite;
}

.shape-2 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #f093fb, #667eea);
  border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
  bottom: 20%;
  left: 10%;
  animation: morphShape 8s infinite reverse;
}

.shape-3 {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #764ba2, #f093fb);
  border-radius: 50% 50% 30% 70% / 50% 30% 70% 50%;
  top: 50%;
  left: 50%;
  animation: morphShape 12s infinite;
}

@keyframes morphShape {

  0%,
  100% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: rotate(0deg);
  }

  50% {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    transform: rotate(180deg);
  }
}

/* Preview */
.preview-section {
  position: relative;
  z-index: 2;
  padding: 120px 0;
}

.preview-showcase {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  margin-top: 60px;
}

.phone-mockup {
  position: relative;
  z-index: 3;
}

.phone-frame {
  width: 320px;
  height: 650px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 40px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
  padding: 12px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 40px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    pointer-events: none;
  }
}

.phone-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 30px;
  background: #0a0a0f;
  border-radius: 0 0 20px 20px;
  z-index: 2;
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 32px;
  overflow: hidden;
  position: relative;
}

.screen-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-card {
  width: 90%;
  height: 80%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: cardSlide 3s infinite;
}

@keyframes cardSlide {

  0%,
  100% {
    transform: translateX(0) rotate(0deg);
  }

  50% {
    transform: translateX(10px) rotate(2deg);
  }
}

.profile-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.profile-info {
  position: absolute;
  bottom: 40px;
  left: 24px;
  right: 24px;
  color: #1a1a2e;

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
}

.match-percentage {
  font-size: 3rem;
  font-weight: 900;
  color: #667eea;
  margin: 1rem 0;
}

.genre-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #667eea;
}

.preview-side {
  position: absolute;
  z-index: 2;
}

.preview-left {
  left: 10%;
  top: 20%;
  animation: float 6s infinite ease-in-out;
}

.preview-right {
  right: 10%;
  bottom: 20%;
  animation: float 6s infinite ease-in-out reverse;
}

.mini-phone {
  width: 180px;
  height: 360px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.mini-screen {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
}

.event-map {
  background: linear-gradient(135deg, #2d3561 0%, #1a1a2e 100%);
}

.map-pin {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #667eea;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
}

.pin-1 {
  top: 30%;
  left: 40%;
}

.pin-2 {
  top: 60%;
  left: 60%;
  animation-delay: 0.3s;
}

.pin-3 {
  top: 45%;
  left: 25%;
  animation-delay: 0.6s;
}

.ping {
  animation: ping 2s infinite;
}

@keyframes ping {
  0% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
  }

  70% {
    box-shadow: 0 0 0 20px rgba(102, 126, 234, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0);
  }
}

.chat-interface {
  background: #16213e;
  padding: 20px;
}

.chat-bubble {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 18px;
  height: 40px;
  margin-bottom: 12px;
  animation: bubbleAppear 0.5s ease both;
}

.bubble-1 {
  width: 70%;
  animation-delay: 0s;
}

.bubble-2 {
  width: 60%;
  margin-left: auto;
  background: rgba(240, 147, 251, 0.3);
  animation-delay: 0.5s;
}

.bubble-3 {
  width: 80%;
  animation-delay: 1s;
}

@keyframes bubbleAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Testimonials */
.testimonial-section {
  position: relative;
  z-index: 2;
  padding: 120px 0;
}

.testimonial-carousel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 60px;
}

.testimonial-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-10px);
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 30px 80px rgba(102, 126, 234, 0.3);
  }
}

.holographic-overlay {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(102, 126, 234, 0.1) 50%, transparent 70%);
  transform: rotate(45deg);
  pointer-events: none;
  transition: all 0.6s;
}

.testimonial-card:hover .holographic-overlay {
  top: 100%;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.avatar-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid;
  border-color: #667eea transparent #764ba2 transparent;
  border-radius: 50%;
  animation: rotate 3s linear infinite;
}

.genre-badge {
  color: rgba(102, 126, 234, 1);
  font-weight: 600;
}

.testimonial-text {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.8;
  font-size: 1.05rem;
  position: relative;
  z-index: 1;
}

.quote-mark {
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-size: 5rem;
  color: rgba(102, 126, 234, 0.1);
  font-family: Georgia, serif;
  line-height: 0;
}

/* CTA */
.cta-section {
  position: relative;
  z-index: 2;
  padding: 120px 0;
}

.cta-content {
  max-width: 800px;
  margin: 0 auto;
}

.cta-title {
  font-size: clamp(2.25rem, 5vw, 3.25rem);
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.cta-subtitle {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.7);
}

.glow-btn {
  position: relative;
  overflow: hidden;

  &:hover {
    animation: glow 1.5s infinite;
  }
}

@keyframes glow {

  0%,
  100% {
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4), 0 0 40px rgba(102, 126, 234, 0.2);
  }

  50% {
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.8), 0 0 60px rgba(102, 126, 234, 0.4);
  }
}

.button-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-25deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }

  50%,
  100% {
    left: 200%;
  }
}

/* Stats */
.stats-row {
  display: flex;
  justify-content: center;
  gap: 4rem;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: clamp(2.25rem, 5vw, 3.25rem);
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.stat-label {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
  font-weight: 500;
}

/* Footer */
.footer {
  position: relative;
  z-index: 2;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-logo {
  font-size: 2rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-text {
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
    transform: translateY(-3px);
  }
}

.footer-heading {
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  a {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #667eea;
    }
  }
}

.footer-separator {
  background: rgba(255, 255, 255, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .preview-left,
  .preview-right {
    display: none;
  }

  .stats-row {
    gap: 2rem;
  }

  .testimonial-carousel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .phone-frame {
    width: 280px;
    height: 570px;
  }
}
</style>