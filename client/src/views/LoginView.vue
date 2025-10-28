<template>
  <q-page class="login-page">
    <!-- Animated Background -->
    <div class="background-animation">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="gradient-orb orb-4"></div>
    </div>

    <!-- Floating Music Notes -->
    <div class="music-notes">
      <div class="note note-1">♪</div>
      <div class="note note-2">♫</div>
      <div class="note note-3">♩</div>
      <div class="note note-4">♬</div>
      <div class="note note-5">♪</div>
      <div class="note note-6">♫</div>
    </div>

    <!-- Main Content -->
    <div class="content-wrapper">
      <!-- Logo Animation -->
      <div class="logo-container">
        <div class="logo-circle">
          <div class="vinyl-record">
            <div class="vinyl-center"></div>
            <div class="vinyl-groove"></div>
            <div class="vinyl-groove"></div>
            <div class="vinyl-groove"></div>
          </div>
          <div class="pulse-ring"></div>
          <div class="pulse-ring delay-1"></div>
          <div class="pulse-ring delay-2"></div>
        </div>
      </div>

      <!-- Brand Title -->
      <div class="brand-section">
        <h1 class="brand-title">
          <span class="letter" style="--i:1">v</span>
          <span class="letter" style="--i:2">e</span>
          <span class="letter" style="--i:3">n</span>
          <span class="letter" style="--i:4">y</span>
          <span class="letter" style="--i:5">u</span>
        </h1>
        <p class="brand-tagline">Where Your Soundtrack Meets Your Soulmate</p>
      </div>

      <!-- Glass Card -->
      <div class="glass-card">
        <div class="card-glow"></div>

        <div class="card-content">
          <h2 class="welcome-text">Willkommen zurück</h2>
          <p class="subtitle">Lass uns deine perfekte Melodie finden</p>

          <!-- Features Grid -->
          <div class="features-grid">
            <div class="feature-item">
              <div class="feature-icon">
                <div class="icon-bg"></div>
                <span>🎵</span>
              </div>
              <span class="feature-text">Musikbasierte Matches</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <div class="icon-bg"></div>
                <span>💜</span>
              </div>
              <span class="feature-text">Echte Verbindungen</span>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <div class="icon-bg"></div>
                <span>🎧</span>
              </div>
              <span class="feature-text">Shared Playlists</span>
            </div>
          </div>

          <!-- Spotify Button -->
          <button @click="auth.login()" class="spotify-button">
            <div class="button-glow"></div>
            <span class="button-content">
              <svg class="spotify-icon" viewBox="0 0 24 24" width="28" height="28">
                <path fill="currentColor"
                  d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span class="button-text">Mit Spotify anmelden</span>
            </span>
            <div class="button-shine"></div>
          </button>

          <!-- Trust Indicators -->
          <div class="trust-section">
            <div class="trust-item">
              <span class="trust-icon">✓</span>
              <span>100% Datenschutz</span>
            </div>
            <div class="trust-item">
              <span class="trust-icon">✓</span>
              <span>Verifizierte Profile</span>
            </div>
            <div class="trust-item">
              <span class="trust-icon">✓</span>
              <span>Sichere Anmeldung</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-text">
        Durch die Anmeldung akzeptierst du unsere
        <a href="#" class="footer-link">AGB</a> und
        <a href="#" class="footer-link">Datenschutzrichtlinien</a>
      </div>
    </div>
    </q-page>
    
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js'
const auth = useAuthStore()
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0f;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* Animated Background */
.background-animation {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -250px;
  left: -250px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -200px;
  right: -200px;
  animation-delay: 2s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 4s;
}

.orb-4 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  top: 20%;
  right: 10%;
  animation-delay: 1s;
}

@keyframes float {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  33% {
    transform: translate(50px, -50px) scale(1.1);
  }

  66% {
    transform: translate(-50px, 50px) scale(0.9);
  }
}

/* Floating Music Notes */
.music-notes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.note {
  position: absolute;
  font-size: 40px;
  color: rgba(255, 255, 255, 0.15);
  animation: noteFloat 15s ease-in-out infinite;
}

.note-1 {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.note-2 {
  top: 20%;
  right: 15%;
  animation-delay: 2s;
}

.note-3 {
  bottom: 15%;
  left: 20%;
  animation-delay: 4s;
}

.note-4 {
  top: 60%;
  right: 25%;
  animation-delay: 1s;
}

.note-5 {
  bottom: 30%;
  right: 10%;
  animation-delay: 3s;
}

.note-6 {
  top: 40%;
  left: 15%;
  animation-delay: 5s;
}

@keyframes noteFloat {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.15;
  }

  50% {
    transform: translateY(-30px) rotate(10deg);
    opacity: 0.3;
  }
}

/* Content Wrapper */
.content-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 500px;
  width: 100%;
}

/* Logo Container */
.logo-container {
  margin-bottom: 30px;
  position: relative;
}

.logo-circle {
  width: 120px;
  height: 120px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vinyl-record {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  position: relative;
  animation: spin 8s linear infinite;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.5);
}

.vinyl-center {
  width: 40px;
  height: 40px;
  background: #0a0a0f;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.vinyl-groove {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.vinyl-groove:nth-child(2) {
  width: 70%;
  height: 70%;
}

.vinyl-groove:nth-child(3) {
  width: 85%;
  height: 85%;
}

.vinyl-groove:nth-child(4) {
  width: 95%;
  height: 95%;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border: 2px solid rgba(102, 126, 234, 0.5);
  border-radius: 50%;
  animation: pulse 2s ease-out infinite;
}

.pulse-ring.delay-1 {
  animation-delay: 0.5s;
}

.pulse-ring.delay-2 {
  animation-delay: 1s;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }

  100% {
    transform: translate(-50%, -50%) scale(1.8);
    opacity: 0;
  }
}

/* Brand Section */
.brand-section {
  text-align: center;
  margin-bottom: 40px;
}

.brand-title {
  font-size: 72px;
  font-weight: 800;
  letter-spacing: -3px;
  margin: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.letter {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: letterFloat 3s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes letterFloat {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.brand-tagline {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 10px;
  font-weight: 400;
  letter-spacing: 1px;
}

/* Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
  padding: 40px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%);
  animation: glowRotate 10s linear infinite;
}

@keyframes glowRotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.card-content {
  position: relative;
  z-index: 1;
}

.welcome-text {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-align: center;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin: 0 0 32px 0;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-4px);
}

.feature-icon {
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.icon-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-radius: 50%;
  filter: blur(10px);
}

.feature-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  line-height: 1.3;
}

/* Spotify Button */
.spotify-button {
  width: 100%;
  padding: 18px 32px;
  background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
  border: none;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(29, 185, 84, 0.4);
}

.spotify-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(29, 185, 84, 0.6);
}

.spotify-button:active {
  transform: translateY(0);
}

.button-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
}

.spotify-button:hover .button-glow {
  animation: buttonGlow 1.5s ease-in-out;
}

@keyframes buttonGlow {
  to {
    transform: translateX(100%);
  }
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.spotify-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.button-text {
  letter-spacing: 0.5px;
}

.button-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shine 3s ease-in-out infinite;
}

@keyframes shine {
  to {
    left: 200%;
  }
}

/* Trust Section */
.trust-section {
  display: flex;
  justify-content: space-around;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.trust-icon {
  color: #1DB954;
  font-weight: bold;
  font-size: 14px;
}

/* Footer */
.footer-text {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.6;
}

.footer-link {
  color: rgba(102, 126, 234, 0.8);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #667eea;
}

/* Responsive */
@media (max-width: 600px) {
  .brand-title {
    font-size: 56px;
  }

  .glass-card {
    padding: 30px 24px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .welcome-text {
    font-size: 28px;
  }

  .trust-section {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
}
</style>