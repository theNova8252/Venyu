import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMyStore = defineStore('myStore', () => {
  const message = ref('Viel Erfolg!');
  return { message };
});
