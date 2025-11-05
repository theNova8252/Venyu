import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api';

export const useMyStore = defineStore('myStore', () => {
  const message = ref('Viel Erfolg!');
  return { message };
});
