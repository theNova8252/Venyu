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
            <img :src="c.user.avatar" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>
            {{ c.user.name }}
            <span v-if="isUserOnline(c.user.id)" class="online-dot"></span>
          </q-item-label>

          <q-item-label caption>
            {{ c.user.bio }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { onMounted, computed } from "vue";
import { useChatsStore } from "@/stores/chats";
import { useRouter } from "vue-router";
import { usePresenceStore } from "@/stores/active";

const chats = useChatsStore();
const router = useRouter();
const presenceStore = usePresenceStore();

onMounted(() => {
  presenceStore.connect();
  chats.fetchChats();
});

const list = computed(() => chats.list);
const loading = computed(() => chats.loading);

const isUserOnline = (userId) => presenceStore.isOnline(userId);

function openChat(roomId) {
  router.push({ name: "ChatView", params: { roomId } });
}
</script>

<style scoped>
.online-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: 6px;
  border-radius: 50%;
  background: #21ba45;
}
</style>
