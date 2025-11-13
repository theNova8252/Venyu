<template>
  <q-page padding class="column">

    <h4>Your Chats</h4>

    <div v-if="loading" class="text-grey">Loading...</div>

    <div v-if="!loading && list.length === 0" class="text-grey">
      No chats yet. Match someone!
    </div>

    <q-list bordered separator v-if="list.length > 0">
      <q-item
        v-for="c in list"
        :key="c.roomId"
        clickable
        @click="openChat(c.roomId)"
      >
        <q-item-section avatar>
          <q-avatar>
            <img :src="c.user.avatar">
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ c.user.name }}</q-item-label>
          <q-item-label caption>{{ c.user.bio }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-icon name="chevron_right"/>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue';
import { useChatsStore } from '@/stores/chats';
import { useRouter } from 'vue-router';

const chats = useChatsStore();
const router = useRouter();

onMounted(() => {
  chats.fetchChats();
});

const list = chats.list;
const loading = chats.loading;

function openChat(roomId) {
  router.push({ name: 'ChatView', params: { roomId } });
}
</script>
