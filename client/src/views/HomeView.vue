<template>
  <div class="q-pa-xl">
    <div class="text-h5 q-mb-md">Welcome, {{ user.me?.name || 'Guest' }}</div>

    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1">Top Artists</div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div v-for="a in (user.me?.topArtists || [])" :key="a" class="col-auto q-pa-sm bg-grey-2 rounded-borders">
            {{ a }}
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="q-mb-lg">
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1">Matches</div>
        <q-btn flat dense label="Reload" @click="matches.fetchMatches()" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list bordered separator>
          <q-item v-for="m in matches.list" :key="m.id">
            <q-item-section>
              <q-item-label>Score: {{ m.score }}</q-item-label>
              <q-item-label caption>Shared: {{ m.sharedArtists.join(', ') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn size="sm" color="primary" :label="m.liked ? 'Liked' : 'Like'" :disable="m.liked"
                @click="matches.like(m.id)" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1">Nearby Events</div>
        <q-btn flat dense label="Reload" @click="events.fetchNearby()" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-table :rows="events.list" :columns="[
          { name: 'title', label: 'Title', field: 'title' },
          { name: 'date', label: 'Date', field: 'date' },
          { name: 'city', label: 'City', field: 'city' }
        ]" row-key="id" flat dense />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useMatchesStore } from '@/stores/matches';
import { useEventsStore } from '@/stores/events';

const user = useUserStore();
const matches = useMatchesStore();
const events = useEventsStore();

onMounted(async () => {
  if (!user.me) await user.fetchMe();
  if (!matches.list.length) await matches.fetchMatches();
  if (!events.list.length) await events.fetchNearby();
});
</script>
