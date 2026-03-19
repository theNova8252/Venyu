<template>
  <q-page class="stub-page">
    <q-icon name="library_music" size="48px" color="purple-4" />
    <h2 class="stub-title">Music</h2>
    <p class="stub-sub">Coming soon</p>
  </q-page>
</template>

<script setup></script>

<style scoped>
.stub-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 52px);
  gap: 12px;
  color: rgba(255, 255, 255, 0.6);
}
.stub-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}
.stub-sub {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}
</style>
