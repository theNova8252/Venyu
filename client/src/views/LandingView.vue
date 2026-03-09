<template>
  <q-page class="venyu-landing">
    <!-- Floating Navbar -->
    <nav class="floating-navbar" :class="{ 'scrolled': scrolled }">
      <div class="navbar-content">
        <div class="navbar-logo" @click="scrollToTop">
          <img src="/src/assets/venyuUpscaled.png" alt="venyu" class="navbar-logo-img" />
        </div>

        <div class="navbar-links gt-sm">
          <a href="#features" class="nav-link">
            <span class="nav-link-text">features</span>
            <div class="link-glow"></div>
            <div class="link-underline"></div>
          </a>
          <a href="#vibes" class="nav-link">
            <span class="nav-link-text">vibes</span>
            <div class="link-glow"></div>
            <div class="link-underline"></div>
          </a>
          <a href="#squad" class="nav-link">
            <span class="nav-link-text">squad</span>
            <div class="link-glow"></div>
            <div class="link-underline"></div>
          </a>
        </div>

        <q-btn unelevated class="cta-btn-nav" @click="onSpotifyConnect">
          <span class="cta-text">let's go</span>
          <q-icon name="arrow_forward" size="18px" class="cta-arrow" />
          <div class="btn-glow"></div>
          <div class="btn-shine"></div>
        </q-btn>

        <q-btn flat round icon="menu" class="mobile-menu-btn lt-md" @click="mobileMenuOpen = !mobileMenuOpen" />
      </div>
    </nav>

    <!-- Mobile Menu -->
    <transition name="slide-down">
      <div v-if="mobileMenuOpen" class="mobile-menu-overlay" @click.self="closeMobileMenu" @touchmove.prevent @wheel.prevent>
        <div class="mobile-menu-panel" @click.stop>
          <div class="mobile-menu-header">
            <span class="menu-title">menu</span>
            <q-btn flat round icon="close" color="white" @click="closeMobileMenu" />
          </div>
          <div class="mobile-menu-links">
            <a href="#features" class="mobile-nav-link" @click="closeMobileMenu">
              <span class="mobile-link-icon">✨</span>
              <span>features</span>
            </a>
            <a href="#vibes" class="mobile-nav-link" @click="closeMobileMenu">
              <span class="mobile-link-icon">🎵</span>
              <span>vibes</span>
            </a>
            <a href="#squad" class="mobile-nav-link" @click="closeMobileMenu">
              <span class="mobile-link-icon">👥</span>
              <span>squad</span>
            </a>
          </div>
          <q-btn unelevated class="mobile-cta-btn" @click="onSpotifyConnect">
            <img src="/src/assets/spotify-logo.png" alt="" class="btn-icon" style="width:20px;height:20px;margin-right:8px" />
            <span>connect with spotify</span>
          </q-btn>
        </div>
      </div>
    </transition>

    <!-- Hero Section -->
    <section class="hero-section">
      <!-- Video Background -->
      <div class="hero-video-background">
        <video autoplay muted loop playsinline class="background-video">
          <source src="/src/assets/venyu.mp4" type="video/mp4" />
        </video>
        <div class="video-overlay"></div>
      </div>

      <div class="hero-container">

        <h1 class="hero-title" data-aos="fade-up" data-aos-delay="100">
          find your
          <span class="text-gradient animate-gradient">rhythm</span>.
          meet your
          <span class="text-gradient animate-gradient">match</span>.
        </h1>

        <p class="hero-subtitle" data-aos="fade-up" data-aos-delay="200">
          match with people who actually get your music taste.<br />
          discover live shows. make irl connections.
        </p>

        <div class="hero-cta-group" data-aos="fade-up" data-aos-delay="300">
          <q-btn unelevated size="xl" class="hero-cta-primary" @click="onSpotifyConnect">
            <img src="/src/assets/spotify-logo.png" alt="" class="btn-icon" />
            <span>connect spotify</span>
            <div class="btn-shimmer"></div>
          </q-btn>
        </div>
      </div>

      <!-- 3D Mockup -->
      <div class="hero-visual" data-aos="zoom-in" data-aos-delay="400">
        <div class="mockup-container">
          <div class="mockup-glow-ring"></div>
          <div class="phone-mockup">
            <div class="phone-screen">
              <div class="screen-header">
                <div class="notch"></div>
              </div>
              <div class="screen-content">
                <div class="match-card">
                  <div class="card-bg"></div>
                  <div class="card-content">
                    <div class="match-percentage">94%</div>
                    <div class="match-label">music match</div>
                    <div class="genre-tags">
                      <span class="tag">indie</span>
                      <span class="tag">alt rock</span>
                      <span class="tag">edm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="floating-particles">
            <div class="particle" v-for="i in 8" :key="i"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bento Grid Features -->
    <section class="features-section" id="features">
      <!-- 3D Animated Map Background -->
      <div class="map-3d-background" ref="mapBgRef">
        <canvas ref="mapCanvas" class="map-canvas"></canvas>
      </div>
      <div class="section-header" data-aos="fade-up">
        <h2 class="section-title">
          why venyu hits different
        </h2>
        <p class="section-subtitle">
          tired of basic dating apps? we built something better 💜
        </p>
      </div>

      <div class="bento-grid">
        <div class="bento-card large" data-aos="fade-up" data-aos-delay="100">
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="feature-icon">🎵</div>
            <h3 class="feature-title">music compatibility</h3>
            <p class="feature-description">
              our algorithm analyzes your spotify to find people who vibe with your exact music taste. no more awkward
              "what do you listen to?" convos
            </p>
            <div class="compatibility-visual">
              <div class="sound-wave">
                <div class="wave-bar" v-for="i in 5" :key="i"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bento-card medium" data-aos="fade-up" data-aos-delay="200">
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="feature-icon">📍</div>
            <h3 class="feature-title">live events near you</h3>
            <p class="feature-description">
              never miss a show. get personalized concert recs based on your taste
            </p>
            <div class="event-pins">
              <div class="pin" v-for="i in 3" :key="i">
                <div class="pin-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bento-card medium" data-aos="fade-up" data-aos-delay="300">
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="feature-icon">🔒</div>
            <h3 class="feature-title">e2e encrypted</h3>
            <p class="feature-description">
              your convos stay private. nobody's reading your dms, not even us
            </p>
            <div class="security-icon">
              <q-icon name="lock" size="48px" />
            </div>
          </div>
        </div>

        <div class="bento-card large" data-aos="fade-up" data-aos-delay="400">
          <div class="card-glow"></div>
          <div class="card-content">
            <div class="feature-icon">✨</div>
            <h3 class="feature-title">swipe with purpose</h3>
            <p class="feature-description">
              forget surface-level apps. match with people you'll actually want to grab coffee with (or hit a concert
              together)
            </p>
            <div class="swipe-demo">
              <div class="demo-card card-1"></div>
              <div class="demo-card card-2"></div>
              <div class="demo-card card-3"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="vibes-section" id="vibes">
      <div class="section-header" data-aos="fade-up">
        <h2 class="section-title">
          how it works
        </h2>
        <p class="section-subtitle">
          literally 3 steps to find your people
        </p>
      </div>

      <div class="steps-container">
        <div class="step-card" data-aos="fade-right" data-aos-delay="100">
          <div class="step-number">01</div>
          <div class="step-content">
            <h3>connect spotify</h3>
            <p>we analyze your top artists, tracks, and genres to build your music profile</p>
          </div>
          <div class="step-visual">
            <q-icon name="music_note" size="64px" />
          </div>
        </div>

        <div class="step-arrow" data-aos="fade-up">
          <q-icon name="arrow_downward" size="32px" />
        </div>

        <div class="step-card" data-aos="fade-left" data-aos-delay="200">
          <div class="step-number">02</div>
          <div class="step-content">
            <h3>swipe & match</h3>
            <p>see compatibility scores based on music taste. swipe on people you vibe with</p>
          </div>
          <div class="step-visual">
            <q-icon name="favorite" size="64px" />
          </div>
        </div>

        <div class="step-arrow" data-aos="fade-up">
          <q-icon name="arrow_downward" size="32px" />
        </div>

        <div class="step-card" data-aos="fade-right" data-aos-delay="300">
          <div class="step-number">03</div>
          <div class="step-content">
            <h3>link up irl</h3>
            <p>chat, discover events together, and actually meet up. build real friendships</p>
          </div>
          <div class="step-visual">
            <q-icon name="group" size="64px" />
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="squad-section" id="squad">
      <div class="section-header" data-aos="fade-up">
        <h2 class="section-title">
          real people, real vibes
        </h2>
        <p class="section-subtitle">
          don't just take our word for it 👇
        </p>
      </div>

      <div class="testimonials-grid">
        <div class="testimonial-card" data-aos="flip-left" data-aos-delay="100">
          <div class="card-shine"></div>
          <div class="testimonial-content">
            <p class="testimonial-text">
              "met my concert bestie on here and we've been to like 15 shows together. this app is goated fr 🔥"
            </p>
            <div class="user-info">
              <div class="user-avatar">
                <img src="https://i.pravatar.cc/150?img=1" alt="" />
              </div>
              <div class="user-details">
                <div class="user-name">sarah</div>
                <div class="user-genre">indie & alt rock</div>
              </div>
            </div>
          </div>
        </div>

        <div class="testimonial-card" data-aos="flip-left" data-aos-delay="200">
          <div class="card-shine"></div>
          <div class="testimonial-content">
            <p class="testimonial-text">
              "finally an app that gets it. met someone with the EXACT same music taste. we're hitting coachella
              together this year 🎵"
            </p>
            <div class="user-info">
              <div class="user-avatar">
                <img src="https://i.pravatar.cc/150?img=2" alt="" />
              </div>
              <div class="user-details">
                <div class="user-name">marcus</div>
                <div class="user-genre">hip hop & r&b</div>
              </div>
            </div>
          </div>
        </div>

        <div class="testimonial-card" data-aos="flip-left" data-aos-delay="300">
          <div class="card-shine"></div>
          <div class="testimonial-content">
            <p class="testimonial-text">
              "moved to a new city and venyu helped me find my whole friend group. we go to raves together now lol"
            </p>
            <div class="user-info">
              <div class="user-avatar">
                <img src="https://i.pravatar.cc/150?img=3" alt="" />
              </div>
              <div class="user-details">
                <div class="user-name">alex</div>
                <div class="user-genre">edm & house</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="final-cta-section">
      <div class="cta-container" data-aos="zoom-in">
        <div class="cta-glow"></div>
        <h2 class="cta-title">
          ready to find your vibe?
        </h2>
        <p class="cta-subtitle">
          join 50k+ music lovers already connecting 💜
        </p>
        <q-btn unelevated size="xl" class="cta-btn-final" @click="onSpotifyConnect">
          <img src="/src/assets/spotify-logo.png" alt="" class="btn-icon" />
          <span>get started - it's free</span>
          <div class="btn-shimmer"></div>
        </q-btn>
        <p class="cta-note">no credit card. no bs. just vibes.</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-main">
          <div class="footer-brand">
            <div class="footer-logo">
              <img src="/src/assets/venyuUpscaled.png" alt="venyu" class="footer-logo-img" />
            </div>
            <p class="footer-tagline">connecting people through music since 2025</p>
          </div>

          <div class="footer-links-grid">
            <div class="footer-column">
              <h4>product</h4>
              <a href="#features">features</a>
              <a href="#vibes">how it works</a>
              <a href="#squad">testimonials</a>
            </div>

            <div class="footer-column">
              <h4>company</h4>
              <a href="#">about</a>
              <a href="#">blog</a>
              <a href="#">careers</a>
            </div>

            <div class="footer-column">
              <h4>legal</h4>
              <a href="#">privacy</a>
              <a href="#">terms</a>
              <a href="#">cookies</a>
            </div>

            <div class="footer-column">
              <h4>socials</h4>
              <a href="#">instagram</a>
              <a href="#">tiktok</a>
              <a href="#">twitter</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2025 venyu. built with 💜 and sick beats.</p>
          <p class="spotify-notice">powered by spotify. not affiliated with spotify ab.</p>
        </div>
      </div>
    </footer>

    <SpotifySignupDialog
      v-model="spotifySignupOpen"
      :loading="spotifySignupLoading"
      @submit="handleSpotifySignup"
    />
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import SpotifySignupDialog from '@/components/SpotifySignupDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const scrolled = ref(false)
const mobileMenuOpen = ref(false)
const spotifySignupOpen = ref(false)
const spotifySignupLoading = ref(false)
const mapCanvas = ref(null)
const mapBgRef = ref(null)
let mapAnimationId = null

const stats = ref([
  { label: 'Active Users', value: 50000, display: '50K+' },
  { label: 'Matches Made', value: 250000, display: '250K+' },
  { label: 'Events Attended', value: 75000, display: '75K+' },
  { label: 'Cities', value: 150, display: '150+' }
])

const calculateAgeFromBirthDate = (birthDate) => {
  if (!birthDate) return null

  const birth = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  const dayDiff = today.getDate() - birth.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age
}

const onSpotifyConnect = () => {
  closeMobileMenu()
  spotifySignupOpen.value = true
}

const handleSpotifySignup = async (profile) => {
  if (calculateAgeFromBirthDate(profile.birthDate) < 16) {
    spotifySignupOpen.value = false
    await router.replace({ path: '/', query: { ...route.query, error: 'underage' } })
    return
  }

  spotifySignupLoading.value = true
  spotifySignupOpen.value = false

  try {
    await auth.login('/swipe', profile)
  } catch (error) {
    console.error('Spotify login error:', error)
    spotifySignupLoading.value = false
    spotifySignupOpen.value = true
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Scroll lock for mobile menu
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

watch(mobileMenuOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  } else {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }
})

watch(
  () => route.query.error,
  async (error) => {
    if (error !== 'underage') return

    $q.notify({
      color: 'negative',
      message: 'You must be 16+ to use Venyu.',
      position: 'top',
      timeout: 2500,
    })

    const query = { ...route.query }
    delete query.error
    await router.replace({ path: route.path, query })
  },
  { immediate: true },
)

let scrollTicking = false
const handleScroll = () => {
  if (scrollTicking) return
  scrollTicking = true
  requestAnimationFrame(() => {
    scrolled.value = window.scrollY > 50
    scrollTicking = false
  })
}

// Optimized Animated Map with Pins
const initMapAnimation = () => {
  const canvas = mapCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d', { alpha: true })
  let width, height
  let resizeTimeout = null

  const resize = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      const rect = canvas.parentElement.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio, 2) // cap DPR for perf
      width = canvas.width = rect.width * dpr
      height = canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }, 100)
  }
  resize()
  window.addEventListener('resize', resize)

  // Reduced pin set for performance (16 instead of 24)
  const pinLocations = [
    { x: 0.40, y: 0.06, label: 'Billie Eilish', size: 11 },
    { x: 0.10, y: 0.10, label: 'Tame Impala', size: 9 },
    { x: 0.60, y: 0.10, label: 'The Weeknd', size: 10 },
    { x: 0.85, y: 0.14, label: 'SZA', size: 9 },
    { x: 0.15, y: 0.30, label: 'Tyler, the Creator', size: 10 },
    { x: 0.65, y: 0.26, label: 'Frank Ocean', size: 10 },
    { x: 0.90, y: 0.35, label: 'Dua Lipa', size: 9 },
    { x: 0.08, y: 0.50, label: 'Radiohead', size: 9 },
    { x: 0.35, y: 0.45, label: 'Kendrick Lamar', size: 11 },
    { x: 0.55, y: 0.42, label: 'Charli XCX', size: 9 },
    { x: 0.78, y: 0.52, label: 'Peggy Gou', size: 8 },
    { x: 0.20, y: 0.68, label: 'Jamie xx', size: 9 },
    { x: 0.48, y: 0.62, label: 'Kaytranada', size: 10 },
    { x: 0.72, y: 0.70, label: 'Fred Again..', size: 10 },
    { x: 0.50, y: 0.82, label: 'Rüfüs Du Sol', size: 10 },
    { x: 0.88, y: 0.85, label: 'Odesza', size: 9 },
  ]

  // Fewer connections (22 instead of 38)
  const connections = [
    [0, 1], [0, 2], [0, 5],
    [1, 4], [2, 3], [2, 5], [3, 6],
    [4, 5], [4, 8], [5, 6], [5, 9],
    [7, 8], [7, 11], [8, 9], [8, 12],
    [9, 10], [10, 13], [11, 12], [11, 14],
    [12, 13], [13, 15], [14, 15],
  ]

  let scrollProgress = 0

  const updateScroll = () => {
    const section = mapBgRef.value
    if (!section) return
    const rect = section.getBoundingClientRect()
    const viewH = window.innerHeight
    const progress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH + rect.height)))
    scrollProgress = Math.max(scrollProgress, progress)
  }

  const drawGrid = (w, h) => {
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)'
    ctx.lineWidth = 0.5
    const spacing = 60
    ctx.beginPath()
    for (let x = 0; x < w; x += spacing) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
    }
    for (let y = 0; y < h; y += spacing) {
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
    }
    ctx.stroke() // single stroke call for entire grid
  }

  const animate = () => {
    const dpr = Math.min(window.devicePixelRatio, 2)
    const w = width / dpr
    const h = height / dpr

    // Throttle to ~30fps for perf
    frameCount++
    if (frameCount % 2 !== 0) {
      mapAnimationId = requestAnimationFrame(animate)
      return
    }

    ctx.clearRect(0, 0, w, h)
    updateScroll()
    time += 0.016

    drawGrid(w, h)

    const visibleCount = Math.floor(scrollProgress * pinLocations.length * 1.5)

    // Draw connections - use solid colors, no per-frame gradient creation
    connections.forEach(([a, b], idx) => {
      if (a >= visibleCount || b >= visibleCount) return
      const pinA = pinLocations[a]
      const pinB = pinLocations[b]
      const ax = pinA.x * w, ay = pinA.y * h
      const bx = pinB.x * w, by = pinB.y * h

      const lineDelay = idx * 0.02
      const lineProgress = Math.max(0, Math.min(1, (scrollProgress - lineDelay) * 2.5))
      const alpha = 0.35 * lineProgress

      // Simple arc with solid color
      const dist = Math.hypot(bx - ax, by - ay)
      const arcH = Math.min(dist * 0.2, 50)
      const mx = (ax + bx) / 2
      const my = (ay + by) / 2 - arcH

      ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      const ex = ax + (bx - ax) * lineProgress
      const ey = ay + (by - ay) * lineProgress
      ctx.quadraticCurveTo(mx, my, ex, ey)
      ctx.stroke()

      // Traveling pulse dot (simplified - no radial gradient)
      if (lineProgress >= 1) {
        const t = (time * 0.35 + idx * 0.15) % 1
        const px = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * mx + t * t * bx
        const py = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * my + t * t * by
        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(236, 72, 153, 0.85)'
        ctx.fill()
      }
    })

    // Draw pins - simplified, no per-pin radial gradient glow
    pinLocations.forEach((pin, i) => {
      if (i >= visibleCount) return
      const px = pin.x * w
      const py = pin.y * h
      const entryProgress = Math.max(0, Math.min(1, (scrollProgress - i * 0.015) * 3))
      const scale = entryProgress
      const bounce = 1 + Math.sin(time * 1.8 + i) * 0.08
      const r = pin.size * scale * bounce

      // Single pulse ring
      const pulseR = r + 12 + Math.sin(time * 2 + i * 0.7) * 5
      ctx.beginPath()
      ctx.arc(px, py, pulseR, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(139, 92, 246, ${0.18 * scale})`
      ctx.lineWidth = 1.2
      ctx.stroke()

      // Soft glow (simple filled circle, no gradient)
      ctx.beginPath()
      ctx.arc(px, py, r * 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(139, 92, 246, ${0.08 * scale})`
      ctx.fill()

      // Pin dot with single gradient (cached-style solid fill)
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(200, 120, 230, ${0.95 * scale})`
      ctx.fill()

      // Bright center
      ctx.beginPath()
      ctx.arc(px, py, r * 0.45, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * scale})`
      ctx.fill()

      // Label
      if (scale > 0.5) {
        ctx.font = '600 11px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = `rgba(255, 255, 255, ${0.65 * scale})`
        ctx.textAlign = 'center'
        ctx.fillText(pin.label, px, py + r + 16)
      }
    })

    mapAnimationId = requestAnimationFrame(animate)
  }

  animate()
  return () => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('scroll', onScroll)
    clearTimeout(resizeTimeout)
    if (mapAnimationId) cancelAnimationFrame(mapAnimationId)
  }
}

// Smooth scroll for anchor links
const handleAnchorClick = (e) => {
  const href = e.target.closest('a')?.getAttribute('href')
  if (href && href.startsWith('#')) {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      closeMobileMenu()
    }
  }
}

// Close mobile menu on Escape
const handleKeydown = (e) => {
  if (e.key === 'Escape' && mobileMenuOpen.value) {
    closeMobileMenu()
  }
}

// Initialize AOS-like animations
const initAnimations = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate')
        }
      })
    },
    { threshold: 0.1 }
  )

  document.querySelectorAll('[data-aos]').forEach((el) => {
    observer.observe(el)
  })
}

let cleanupMap = null

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', handleAnchorClick)
  document.addEventListener('keydown', handleKeydown)

  // Init animations after a brief delay
  setTimeout(() => {
    initAnimations()
  }, 100)

  nextTick(() => {
    cleanupMap = initMapAnimation()
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleAnchorClick)
  document.removeEventListener('keydown', handleKeydown)
  // Restore body scroll if menu was open
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
  if (cleanupMap) cleanupMap()
})
</script>

<style scoped lang="scss">
/* Modern Gen Z Dark Mode Landing Page */

.venyu-landing {
  background: #0a0a0f;
  color: #ffffff;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

/* Video Background - Hero Section Only */
.hero-video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.background-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
}

.video-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.45));
  z-index: 1;
}

/* Floating Navbar */
.floating-navbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: calc(100% - 40px);
  max-width: 1200px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar-content {
  background: rgba(16, 16, 32, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 100px;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-navbar.scrolled .navbar-content {
  background: rgba(12, 12, 28, 0.92);
  border-color: rgba(139, 92, 246, 0.25);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(139, 92, 246, 0.08);
}

.navbar-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  user-select: none;
}

.navbar-logo-img {
  height: 32px;
  width: auto;
  object-fit: contain;
  filter: brightness(1.1);
  transition: transform 0.3s ease, filter 0.3s ease;

  &:hover {
    transform: scale(1.05);
    filter: brightness(1.3) drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
  }
}

.navbar-links {
  display: flex;
  gap: 32px;
  align-items: center;
}

.nav-link {
  position: relative;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 6px 4px;
  transition: all 0.3s ease;

  .nav-link-text {
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;
  }

  .link-glow {
    position: absolute;
    inset: -4px -8px;
    background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.2), transparent 70%);
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  &:hover {
    color: #ffffff;

    .nav-link-text {
      text-shadow: 0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(236, 72, 153, 0.3);
    }

    .link-glow {
      opacity: 1;
    }

    .link-underline {
      width: 100%;
      opacity: 1;
    }
  }
}

.link-underline {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease;
  border-radius: 2px;
  opacity: 0;
}

.cta-btn-nav {
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 40%, #ec4899 100%);
  color: white;
  border-radius: 100px;
  padding: 10px 26px;
  font-weight: 700;
  font-size: 14px;
  text-transform: lowercase;
  letter-spacing: 0.03em;
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow:
    0 4px 15px rgba(139, 92, 246, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-2px) scale(1.06);
    box-shadow:
      0 8px 25px rgba(139, 92, 246, 0.5),
      0 0 30px rgba(236, 72, 153, 0.2);

    .cta-arrow {
      transform: translateX(3px);
    }
  }

  .cta-text {
    position: relative;
    z-index: 1;
  }

  .cta-arrow {
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease;
  }
}

.btn-glow {
  display: none;
}

.btn-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 40%, rgba(255, 255, 255, 0.12) 50%, transparent 60%);
  pointer-events: none;
  z-index: 1;
}

.mobile-menu-btn {
  color: white;
}

/* Mobile Menu */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;

  .mobile-menu-panel {
    transform: translateY(-30px) scale(0.95);
    opacity: 0;
  }
}

.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80px;
  overflow: hidden;
  overscroll-behavior: contain;
  touch-action: none;
}

.mobile-menu-panel {
  background: rgba(20, 20, 40, 0.98);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 28px;
  padding: 28px;
  width: calc(100% - 40px);
  max-width: 400px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(139, 92, 246, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  .menu-title {
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.01em;
  }
}

.mobile-menu-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.mobile-nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 17px;
  font-weight: 600;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 12px;

  .mobile-link-icon {
    font-size: 20px;
  }

  &:hover,
  &:active {
    background: rgba(139, 92, 246, 0.15);
    border-color: rgba(139, 92, 246, 0.3);
    transform: translateX(6px);
  }
}

.mobile-cta-btn {
  width: 100%;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  border-radius: 16px;
  padding: 16px;
  font-weight: 700;
  font-size: 15px;
  text-transform: lowercase;
  letter-spacing: 0.02em;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(139, 92, 246, 0.45);
  }
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 20px 60px;
  position: relative;
  z-index: 1;
}

.hero-container {
  max-width: 1200px;
  width: 100%;
  text-align: center;
  margin-bottom: 60px;
  position: relative;
  z-index: 2;
}

.hero-badge {
  display: inline-block;
  background: rgba(139, 92, 246, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.7);
  border-radius: 100px;
  padding: 8px 20px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  .badge-text {
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, #a78bfa, #f9a8d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
    z-index: 1;
  }
}

.badge-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%);
  pointer-events: none;
}

.hero-title {
  font-size: clamp(40px, 8vw, 96px);
  font-weight: 800;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8), 0 4px 40px rgba(0, 0, 0, 0.5);
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 24px;
  color: #ffffff;
}

.text-gradient {
  background: linear-gradient(135deg, #c084fc 0%, #f472b6 50%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  filter: brightness(1.2);
}

.animate-gradient {
  background-size: 200% 200%;
  background-position: 50% 50%;
}

.hero-subtitle {
  font-size: clamp(16px, 2vw, 20px);
  line-height: 1.6;
  color: #ffffff;
  margin-bottom: 48px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.8);
}

.hero-cta-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.hero-cta-primary {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  border-radius: 100px;
  padding: 16px 40px;
  font-weight: 700;
  font-size: 18px;
  text-transform: lowercase;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 24px 80px rgba(139, 92, 246, 0.6);
  }

  .btn-icon {
    width: 24px;
    height: 24px;
  }

  span {
    position: relative;
    z-index: 1;
  }
}

.btn-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%);
  pointer-events: none;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 20px;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 800;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.04em;
  }

  .stat-divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
  }
}

/* Hero Visual */
.hero-visual {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  z-index: 2;
}

.mockup-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mockup-glow-ring {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%);
}

.phone-mockup {
  position: relative;
  width: 280px;
  height: 560px;
  background: linear-gradient(145deg, #1a1a2e, #0f0f1e);
  border-radius: 40px;
  padding: 12px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 50px 100px rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 32px;
  overflow: hidden;
  position: relative;
}

.screen-header {
  position: relative;
  height: 40px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
}

.notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 30px;
  background: #000;
  border-radius: 0 0 20px 20px;
}

.screen-content {
  padding: 20px;
  height: calc(100% - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.match-card {
  width: 100%;
  height: 400px;
  background: linear-gradient(145deg, #1a1a2e, #252540);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  transform: rotate(-1deg);
}

.card-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
  opacity: 0.5;
}

.card-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .match-percentage {
    font-size: 72px;
    font-weight: 900;
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .match-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 24px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .genre-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .tag {
    background: rgba(139, 92, 246, 0.3);
    border: 1px solid rgba(139, 92, 246, 0.5);
    padding: 6px 16px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    color: #a78bfa;
  }
}

.floating-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(139, 92, 246, 0.5);
    border-radius: 50%;

    @for $i from 1 through 8 {
      &:nth-child(#{$i}) {
        top: random(100) * 1%;
        left: random(100) * 1%;
        opacity: 0.3 + random(5) * 0.1;
      }
    }
  }
}

/* AOS Animations */
[data-aos] {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

[data-aos].aos-animate {
  opacity: 1;
  transform: translateY(0);
}

[data-aos="fade-right"] {
  transform: translateX(-40px);
}

[data-aos="fade-right"].aos-animate {
  transform: translateX(0);
}

[data-aos="fade-left"] {
  transform: translateX(40px);
}

[data-aos="fade-left"].aos-animate {
  transform: translateX(0);
}

[data-aos="zoom-in"] {
  transform: scale(0.8);
}

[data-aos="zoom-in"].aos-animate {
  transform: scale(1);
}

[data-aos="flip-left"] {
  transform: perspective(1000px) rotateY(-45deg);
}

[data-aos="flip-left"].aos-animate {
  transform: perspective(1000px) rotateY(0);
}

/* 3D Map Background */
.map-3d-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.map-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* Sections */
.features-section {
  position: relative;
  z-index: 1;
  padding: 120px 20px;
  overflow: hidden;
}

.vibes-section,
.squad-section {
  position: relative;
  z-index: 1;
  padding: 120px 20px;
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
  position: relative;
  z-index: 2;
}

.section-title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
  color: #ffffff;
  -webkit-text-fill-color: #ffffff;
}

.section-subtitle {
  font-size: clamp(16px, 2vw, 20px);
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.01em;
}

/* Bento Grid */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.bento-card {
  background: rgba(22, 22, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
  padding: 40px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);

  &:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: rgba(139, 92, 246, 0.5);
    box-shadow: 0 16px 48px rgba(139, 92, 246, 0.15);
  }

  &.large {
    grid-column: span 2;

    @media (max-width: 768px) {
      grid-column: span 1;
    }
  }
}

.card-glow {
  display: none;
}

.card-content {
  position: relative;
  z-index: 1;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
  display: inline-block;
  transition: transform 0.3s ease;
}

.bento-card:hover .feature-icon {
  transform: translateY(-6px);
}

.feature-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #ffffff;
  text-transform: lowercase;
}

.feature-description {
  font-size: 15px;
  line-height: 1.7;
  color: #ffffff;
  margin-bottom: 24px;
  font-weight: 400;
}

/* Feature Visuals */
.compatibility-visual {
  margin-top: 40px;
}

.sound-wave {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  height: 80px;
}

.wave-bar {
  width: 8px;
  background: linear-gradient(180deg, #8b5cf6, #ec4899);
  border-radius: 4px;
  transition: transform 0.3s ease;

  @for $i from 1 through 5 {
    &:nth-child(#{$i}) {
      height: (20 + random(60)) * 1%;
    }
  }
}

.bento-card:hover .wave-bar {
  transform: scaleY(1.3);
}

.event-pins {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 40px;
}

.pin {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  position: relative;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);

  .pin-pulse {
    display: none;
  }
}

.security-icon {
  margin-top: 40px;
  text-align: center;
  color: #8b5cf6;
}

.swipe-demo {
  margin-top: 40px;
  position: relative;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-card {
  position: absolute;
  width: 120px;
  height: 160px;
  background: linear-gradient(145deg, #1a1a2e, #252540);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &.card-1 {
    transform: rotate(-5deg) translateX(-20px);
    z-index: 1;
  }

  &.card-2 {
    transform: rotate(0deg);
    z-index: 2;
  }

  &.card-3 {
    transform: rotate(5deg) translateX(20px);
    z-index: 1;
  }
}

/* Steps */
.steps-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.step-card {
  background: rgba(22, 22, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 32px;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);

  &:hover {
    transform: translateX(8px);
    border-color: rgba(139, 92, 246, 0.5);
    box-shadow: 0 12px 40px rgba(139, 92, 246, 0.15);
  }
}

.step-number {
  font-size: 48px;
  font-weight: 900;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  min-width: 80px;
}

.step-content {
  flex: 1;

  h3 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
    text-transform: lowercase;
    color: #ffffff;
  }

  p {
    color: rgba(255, 255, 255, 0.95);
    line-height: 1.7;
  }
}

.step-visual {
  color: #8b5cf6;
  opacity: 0.5;
}

.step-arrow {
  text-align: center;
  color: rgba(139, 92, 246, 0.5);
}

/* Testimonials */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.testimonial-card {
  background: rgba(22, 22, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-8px) rotate(2deg);
    border-color: rgba(139, 92, 246, 0.5);

    .card-shine {
      transform: translateX(300%);
    }
  }
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(0);
  transition: transform 0.6s ease;
  pointer-events: none;
}

.testimonial-content {
  position: relative;
  z-index: 1;
}

.testimonial-text {
  font-size: 16px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
  font-style: italic;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(139, 92, 246, 0.5);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-name {
  font-weight: 700;
  font-size: 16px;
}

.user-genre {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

/* Final CTA */
.final-cta-section {
  position: relative;
  z-index: 1;
  padding: 120px 20px;
}

.cta-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  background: rgba(22, 22, 42, 0.9);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 40px;
  padding: 80px 40px;
  position: relative;
  overflow: hidden;
}

.cta-glow {
  position: absolute;
  inset: -30%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  opacity: 0.7;
}

.cta-title {
  font-size: clamp(36px, 6vw, 56px);
  font-weight: 800;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.cta-subtitle {
  font-size: clamp(16px, 2vw, 20px);
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.cta-btn-final {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  border-radius: 100px;
  padding: 20px 48px;
  font-weight: 700;
  font-size: 18px;
  text-transform: lowercase;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
  z-index: 1;

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 24px 80px rgba(139, 92, 246, 0.6);
  }

  .btn-icon {
    width: 24px;
    height: 24px;
  }
}

.cta-note {
  margin-top: 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
}

/* Footer */
.footer {
  position: relative;
  z-index: 1;
  background: rgba(10, 10, 15, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 60px 20px 32px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-main {
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: 60px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

.footer-brand {
  .footer-logo {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .footer-logo-img {
    height: 40px;
    width: auto;
    object-fit: contain;
    filter: brightness(1.1);
    transition: filter 0.3s ease;

    &:hover {
      filter: brightness(1.3) drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
    }
  }

  .footer-tagline {
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    line-height: 1.6;
  }
}

.footer-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 32px;
}

.footer-column {
  h4 {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 16px;
    text-transform: lowercase;
    color: #ffffff;
  }

  a {
    display: block;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    font-size: 13px;
    margin-bottom: 12px;
    transition: all 0.3s ease;

    &:hover {
      color: #8b5cf6;
      transform: translateX(4px);
    }
  }
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
  text-align: center;

  p {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 8px;
  }

  .spotify-notice {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .floating-navbar {
    top: 10px;
    width: calc(100% - 20px);
  }

  .navbar-links {
    display: none;
  }

  .hero-section {
    padding-top: 100px;
  }

  .step-card {
    flex-direction: column;
    text-align: center;
  }

  .step-visual {
    order: -1;
  }

  .bento-grid .bento-card.large {
    grid-column: span 1;
  }
}
</style>
