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
    <section class="hero-section">
      <div class="container">
        <div class="text-center q-pt-xl q-pb-xl">
          <div class="glitch-wrapper">
            <h1 class="hero-title glitch" data-text="Connect Through Music">
              Connect Through Music
            </h1>
          </div>
          <p class="hero-subtitle q-mb-xl type-animation">
            <span ref="typeText"></span>
            <span class="cursor">|</span>
          </p>
          <div class="cta-buttons">
            <q-btn unelevated size="lg" class="cta-primary magnetic-btn" label="Join Venyu" @click="onJoinClick"
              @mouseenter="onMagneticEnter" @mousemove="onMagneticMove" @mouseleave="onMagneticLeave" />
            <q-btn outline size="lg" class="cta-secondary glass-btn" label="Connect with Spotify"
              @click="onSpotifyConnect">
              <template v-slot:default>
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
        <div class="text-center q-mb-xl">
          <h2 class="section-title reveal-text">
            <span v-for="(word, i) in 'How Venyu Works'.split(' ')" :key="i" class="word">
              <span v-for="(char, j) in word.split('')" :key="j" class="char">{{ char }}</span>
              <span v-if="i < 2">&nbsp;</span>
            </span>
          </h2>
          <p class="section-subtitle">Your music taste is your passport to meaningful connections</p>
        </div>

        <div class="row q-col-gutter-lg">
          <div v-for="(feature, index) in features" :key="index" class="col-12 col-md-6 col-lg-3">
            <q-card class="feature-card morphism-card" :class="`card-${index + 1}`" @mouseenter="onCardEnter(index)"
              @mousemove="onCardMove($event, index)" @mouseleave="onCardLeave(index)"
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
    <section class="preview-section q-py-xl">
      <div class="container">
        <div class="text-center q-mb-xl">
          <h2 class="section-title split-text">Experience Venyu</h2>
          <p class="section-subtitle">Seamless design meets powerful connection</p>
        </div>

        <div class="preview-showcase">
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
    <section class="testimonial-section q-py-xl">
      <div class="container">
        <div class="text-center q-mb-xl">
          <h2 class="section-title neon-text">Join the Movement</h2>
          <p class="section-subtitle">Thousands of music lovers connecting every day</p>
        </div>

        <div class="testimonial-carousel">
          <div v-for="(testimonial, index) in testimonials" :key="index" class="testimonial-card-wrapper">
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
    <section class="cta-section q-py-xl">
      <div class="container text-center">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Find Your Tribe?</h2>
          <p class="cta-subtitle q-mb-xl">
            Join thousands of music lovers discovering events and making real connections
          </p>
          <q-btn unelevated size="xl" class="cta-primary-large glow-btn" label="Get Started Now" @click="onJoinClick">
            <div class="button-shine"></div>
          </q-btn>
        </div>

        <!-- Stats Counter -->
        <div class="stats-row q-mt-xl">
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
          <p>&copy; 2025 Venyu. All rights reserved. Made with music and code.</p>
          <p class="text-caption q-mt-sm">
            This product uses the Spotify API but is not endorsed or certified by Spotify.
          </p>
        </div>
      </div>
    </footer>
  </q-page>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'VenyuLanding',

  setup() {
    const particlesCanvas = ref(null)
    const typeText = ref(null)
    const featuresSection = ref(null)
    const featureCards = ref([])

    const features = ref([
      {
        icon: 'headphones',
        title: 'Spotify Integration',
        description: 'Connect your Spotify account and let us analyze your top artists, genres, and listening patterns to find your perfect musical matches.'
      },
      {
        icon: 'favorite',
        title: 'Music-Based Matching',
        description: 'Discover people who share your sound. Our algorithm matches you with others based on musical compatibility and shared tastes.'
      },
      {
        icon: 'map',
        title: 'Event Discovery',
        description: 'See concerts, festivals, and music events near you. Find out who else is going and connect before the show even starts.'
      },
      {
        icon: 'chat',
        title: 'Real-Time Chat',
        description: 'Match with someone? Start chatting instantly. Plan meetups at events, share playlists, and build your music community.'
      }
    ])

    const testimonials = ref([
      {
        name: 'Alex Rivera',
        genre: 'Indie Rock Enthusiast',
        avatar: 'https://i.pravatar.cc/150?img=33',
        text: 'Found my concert crew through Venyu. We have gone to 12 shows together in the past 6 months. This app changed how I experience live music.'
      },
      {
        name: 'Maya Chen',
        genre: 'Electronic Music Lover',
        avatar: 'https://i.pravatar.cc/150?img=45',
        text: 'The matching algorithm is incredible. Every person I have met through Venyu has introduced me to amazing new artists. My Spotify has never been better.'
      },
      {
        name: 'Jordan Blake',
        genre: 'Hip-Hop Head',
        avatar: 'https://i.pravatar.cc/150?img=68',
        text: 'As someone who moved to a new city, Venyu helped me find my people. Now I have a whole friend group that gets my music taste. Game changer.'
      }
    ])

    const stats = ref([
      { label: 'Active Users', value: 50000 },
      { label: 'Matches Made', value: 250000 },
      { label: 'Events Discovered', value: 10000 }
    ])

    const animatedStats = ref({
      'Active Users': '0',
      'Matches Made': '0',
      'Events Discovered': '0'
    })

    let particles = []
    let animationFrame = null

    // Typewriter effect
    const typewriterText = "Discover events, meet people, build your tribe through shared Spotify tastes"
    let typewriterIndex = 0

    const typeWriter = () => {
      if (typewriterIndex < typewriterText.length && typeText.value) {
        typeText.value.textContent = typewriterText.substring(0, typewriterIndex + 1)
        typewriterIndex++
        setTimeout(typeWriter, 50)
      }
    }

    // Particles animation
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

      particles = []
      for (let i = 0; i < 100; i++) {
        particles.push(new Particle())
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        particles.forEach(particle => {
          particle.update()
          particle.draw()
        })

        // Connect particles
        particles.forEach((a, i) => {
          particles.slice(i + 1).forEach(b => {
            const dx = a.x - b.x
            const dy = a.y - b.y
            const distance = Math.sqrt(dx * dx + dy * dy)

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

        animationFrame = requestAnimationFrame(animate)
      }

      animate()
    }

    // Stats counter animation
    const animateStats = () => {
      stats.value.forEach(stat => {
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

    // Magnetic button effect
    const onMagneticEnter = (e) => {
      e.target.style.transition = 'transform 0.3s ease'
    }

    const onMagneticMove = (e) => {
      const btn = e.target
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`
    }

    const onMagneticLeave = (e) => {
      e.target.style.transform = 'translate(0, 0)'
    }

    // Card tilt effect
    const onCardEnter = (index) => {
      const card = featureCards.value[index]
      if (card) {
        card.$el.style.transition = 'transform 0.1s ease'
      }
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
      if (card) {
        card.$el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)'
      }
    }

    const onJoinClick = () => {
      console.log('Join Venyu clicked')
    }

    const onSpotifyConnect = () => {
      console.log('Spotify connect clicked')
    }

    onMounted(() => {
      setTimeout(typeWriter, 1000)
      initParticles()

      // Observe features section for animation
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateStats()
            observer.unobserve(entry.target)
          }
        })
      })

      if (featuresSection.value) {
        observer.observe(featuresSection.value)
      }

      // Handle resize
      const handleResize = () => {
        if (particlesCanvas.value) {
          particlesCanvas.value.width = window.innerWidth
          particlesCanvas.value.height = window.innerHeight
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    })

    onUnmounted(() => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    })

    return {
      particlesCanvas,
      typeText,
      featuresSection,
      featureCards,
      features,
      testimonials,
      stats,
      animatedStats,
      onMagneticEnter,
      onMagneticMove,
      onMagneticLeave,
      onCardEnter,
      onCardMove,
      onCardLeave,
      onJoinClick,
      onSpotifyConnect
    }
  }
}
</script>

<style scoped lang="scss">
.venyu-landing {
  background: #0a0a0f;
  color: #ffffff;
  position: relative;
  overflow-x: hidden;
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

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Glitch Effect */
.glitch-wrapper {
  position: relative;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
  position: relative;
  animation: glitchSkew 5s infinite;
}

.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glitch::before {
  left: 2px;
  text-shadow: -2px 0 #ff00de;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim 3s infinite linear alternate-reverse;
}

.glitch::after {
  left: -2px;
  text-shadow: -2px 0 #00fff9, 2px 2px #ff00de;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim 2s infinite linear alternate-reverse;
}

@keyframes glitch-anim {
  0% {
    clip: rect(10px, 9999px, 31px, 0);
  }

  20% {
    clip: rect(70px, 9999px, 71px, 0);
  }

  40% {
    clip: rect(60px, 9999px, 90px, 0);
  }

  60% {
    clip: rect(20px, 9999px, 50px, 0);
  }

  80% {
    clip: rect(80px, 9999px, 20px, 0);
  }

  100% {
    clip: rect(50px, 9999px, 100px, 0);
  }
}

@keyframes glitchSkew {
  0% {
    transform: skew(0deg);
  }

  10% {
    transform: skew(-2deg);
  }

  20% {
    transform: skew(0deg);
  }
}

/* Typewriter */
.type-animation {
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  color: #b4b4b4;
  max-width: 700px;
  margin: 0 auto;
}

.cursor {
  animation: blink 0.7s infinite;
  color: #667eea;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

/* Buttons */
.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.magnetic-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 48px;
  font-weight: 700;
  border-radius: 50px;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
}

.glass-btn {
  border: 2px solid rgba(102, 126, 234, 0.5);
  background: rgba(102, 126, 234, 0.1);
  backdrop-filter: blur(10px);
  color: #667eea;
  padding: 16px 48px;
  font-weight: 700;
  border-radius: 50px;
  font-size: 1.1rem;
position: relative;
  overflow: hidden;

  .button-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.6), transparent);
    border-radius: 50%;
    transition: width 0.6s, height 0.6s;
  }

  &:hover .button-glow {
    width: 300px;
    height: 300px;
  }
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
}

.item-1 {
  top: 20%;
  left: 10%;
  animation: floatUp 6s infinite ease-in-out;
}

.item-2 {
  top: 60%;
  right: 15%;
  animation: floatUp 8s infinite ease-in-out 1s;
}

.item-3 {
  bottom: 20%;
  left: 20%;
  animation: floatUp 7s infinite ease-in-out 2s;
}

@keyframes floatUp {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-30px) rotate(10deg);
  }
}

.vinyl-record {
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, #1a1a1a 30%, #667eea 31%, #667eea 35%, #0a0a0f 36%);
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
  animation: rotate 4s linear infinite;
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
  display: flex;
  gap: 4px;
  align-items: center;

  &::before,
  &::after {
    content: '';
    width: 4px;
    background: linear-gradient(180deg, #667eea, #764ba2);
    border-radius: 2px;
    animation: wave 1s infinite ease-in-out;
  }

  &::before {
    height: 40px;
  }

  &::after {
    height: 60px;
    animation-delay: 0.2s;
  }
}

.pulsing::before,
.pulsing::after {
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {

  0%,
  100% {
    transform: scaleY(1);
  }

  50% {
    transform: scaleY(1.5);
  }
}

.music-note {
  font-size: 48px;
  color: #f093fb;
  text-shadow: 0 0 20px rgba(240, 147, 251, 0.5);
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
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  animation: scrollFade 2s infinite;
}

.mouse {
  width: 30px;
  height: 50px;
  border: 2px solid rgba(102, 126, 234, 0.5);
  border-radius: 15px;
  position: relative;
  margin-bottom: 10px;
}

.wheel {
  width: 4px;
  height: 8px;
  background: #667eea;
  border-radius: 2px;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  animation: wheelScroll 2s infinite;
}

@keyframes wheelScroll {
  0% {
    top: 8px;
    opacity: 1;
  }

  100% {
    top: 28px;
    opacity: 0;
  }
}

.arrow-down {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid rgba(102, 126, 234, 0.5);
  margin: 0 auto;
}

@keyframes scrollFade {

  0%,
  100% {
    opacity: 0.4;
  }

  50% {
    opacity: 1;
  }
}

/* Features Section */
.features-section {
  position: relative;
  z-index: 2;
}

.section-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.reveal-text .word {
  display: inline-block;
  margin: 0 0.2em;
}

.reveal-text .char {
  display: inline-block;
  animation: revealChar 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation-delay: calc(var(--char-index) * 0.05s);
}

@keyframes revealChar {
  0% {
    transform: translateY(100px) rotateX(-90deg);
    opacity: 0;
  }

  100% {
    transform: translateY(0) rotateX(0);
    opacity: 1;
  }
}

.section-subtitle {
  font-size: 1.25rem;
  color: #b4b4b4;
  max-width: 600px;
  margin: 0 auto;
}

/* Feature Cards */
.morphism-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

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
  background: radial-gradient(circle, rgba(102, 126, 234, 0.2), transparent 70%);
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
}

.morphism-card:hover .card-glow {
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
  width: 100px;
  height: 100px;
  border: 2px solid #667eea;
  border-radius: 50%;
  animation: ripple 2s infinite;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }

  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.feature-icon {
  color: #667eea;
  filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.5));
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
}

.feature-description {
  font-size: 1rem;
  color: #b4b4b4;
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
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  animation: morphShape 10s infinite ease-in-out;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  right: 10%;
}

.shape-2 {
  width: 300px;
  height: 300px;
  bottom: 20%;
  left: 5%;
  animation-delay: -3s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  animation-delay: -6s;
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

/* Preview Section */
.preview-section {
  position: relative;
  z-index: 2;
  overflow: hidden;
}

.preview-showcase {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  position: relative;
  min-height: 600px;
}

.phone-mockup {
  perspective: 1000px;
}

.phone-frame {
  width: 320px;
  height: 640px;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 40px;
  padding: 12px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  animation: phoneFloat 6s ease-in-out infinite;
}

@keyframes phoneFloat {

  0%,
  100% {
    transform: translateY(0) rotateY(-5deg);
  }

  50% {
    transform: translateY(-20px) rotateY(5deg);
  }
}

.phone-notch {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 28px;
  background: #0a0a0f;
  border-radius: 0 0 20px 20px;
  z-index: 10;
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a0f, #1a1a2e);
  border-radius: 32px;
  overflow: hidden;
  position: relative;
}

.screen-content {
  padding: 40px 20px;
}

.profile-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  animation: cardSlide 3s ease-in-out infinite;
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
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0.3;
}

.profile-info {
  position: relative;
  z-index: 2;
  text-align: center;

  h3 {
    font-size: 1.5rem;
    margin-bottom: 16px;
    color: #ffffff;
  }
}

.match-percentage {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 20px 0;
  animation: scaleNumber 2s ease-in-out infinite;
}

@keyframes scaleNumber {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.genre-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 20px;
}

.tag {
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.4);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  color: #667eea;
}

.preview-side {
  position: absolute;
}

.preview-left {
  left: 10%;
  top: 20%;
}

.preview-right {
  right: 10%;
  bottom: 20%;
}

.mini-phone {
  width: 180px;
  height: 360px;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  border-radius: 24px;
  padding: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  animation: miniFloat 4s ease-in-out infinite;
}

@keyframes miniFloat {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-15px);
  }
}

.mini-screen {
  width: 100%;
  height: 100%;
  background: #0a0a0f;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
}

.event-map {
  background: linear-gradient(135deg, #1a1a2e, #2a2a3e);
  position: relative;
}

.map-pin {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #667eea;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
  }
}

.pin-1 {
  top: 30%;
  left: 40%;
}

.pin-2 {
  top: 50%;
  right: 30%;
  animation-delay: 0.5s;
}

.pin-3 {
  bottom: 30%;
  left: 50%;
  animation-delay: 1s;
}

@keyframes ping {

  75%,
  100% {
    transform: rotate(-45deg) scale(2);
    opacity: 0;
  }
}

.chat-interface {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-bubble {
  height: 40px;
  border-radius: 20px;
  animation: bubbleAppear 1s ease-in-out infinite;
}

.bubble-1 {
  width: 70%;
  background: rgba(102, 126, 234, 0.3);
  align-self: flex-start;
}

.bubble-2 {
  width: 60%;
  background: rgba(118, 75, 162, 0.3);
  align-self: flex-end;
  animation-delay: 0.3s;
}

.bubble-3 {
  width: 80%;
  background: rgba(102, 126, 234, 0.3);
  align-self: flex-start;
  animation-delay: 0.6s;
}

@keyframes bubbleAppear {

  0%,
  100% {
    opacity: 0.5;
    transform: scale(0.95);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Testimonial Section */
.testimonial-section {
  position: relative;
  z-index: 2;
}

.neon-text {
  text-shadow: 0 0 10px rgba(102, 126, 234, 0.5),
    0 0 20px rgba(102, 126, 234, 0.3),
    0 0 30px rgba(102, 126, 234, 0.2);
}

.testimonial-carousel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-top: 48px;
}

.holographic-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 30px 60px rgba(102, 126, 234, 0.3);
  }
}

.holographic-overlay {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg,
      transparent 30%,
      rgba(102, 126, 234, 0.1) 50%,
      transparent 70%);
  animation: holoRotate 6s linear infinite;
  pointer-events: none;
}

@keyframes holoRotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.avatar-wrapper {
  position: relative;
}

.avatar-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid #667eea;
  border-radius: 50%;
  animation: ringPulse 2s ease-in-out infinite;
}

@keyframes ringPulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.5;
  }
}

.genre-badge {
  color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  display: inline-block;
}

.testimonial-text {
  font-size: 1rem;
  color: #d4d4d4;
  line-height: 1.8;
  position: relative;
  z-index: 2;
}

.quote-mark {
  position: absolute;
  top: 20px;
  right: 30px;
  font-size: 8rem;
  color: rgba(102, 126, 234, 0.1);
  font-family: Georgia, serif;
  pointer-events: none;
}

/* CTA Section */
.cta-section {
  position: relative;
  z-index: 2;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 32px;
  margin: 80px 24px;
  overflow: hidden;
}

.cta-content {
  position: relative;
  z-index: 2;
}

.cta-title {
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 900;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff, #667eea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cta-subtitle {
  font-size: 1.25rem;
  color: #b4b4b4;
}

.glow-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 20px 60px;
  font-weight: 700;
  border-radius: 50px;
  font-size: 1.25rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 0 50px rgba(102, 126, 234, 0.8);
    transform: scale(1.05);
  }
}

.button-shine {
  position: absolute;
  top: -50%;
  left: -100%;
  width: 100%;
  height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-20deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  to {
    left: 200%;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: clamp(2.5rem, 4vw, 4rem);
  font-weight: 900;
  background: linear-gradient(135deg, #667eea, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 1rem;
  color: #b4b4b4;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Footer */
.footer {
  position: relative;
  z-index: 2;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(20px);
}

.footer-logo {
  font-size: 2rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-text {
  color: #b4b4b4;
  line-height: 1.6;
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.3);
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
}

.footer-heading {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 12px;

  a {
    color: #b4b4b4;
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
  .preview-side {
    display: none;
  }

  .cta-buttons {
    flex-direction: column;
    width: 100%;

    .q-btn {
      width: 100%;
    }
  }

  .stats-row {
    grid-template-columns: 1fr;
  }

  .phone-frame {
    width: 280px;
    height: 560px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .feature-card {
    padding: 24px;
  }
}

</style>