import { createRouter, createWebHistory } from 'vue-router';
import Registration from './src/components/register.vue';
import chat from './src/components/chat.vue';

const routes = [
  { path: '/', component: Registration },
  { path: '/chat', component: chat },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
