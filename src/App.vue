<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useUserStore } from './stores/authorizationStore';
const userStore = useUserStore();
const router = useRouter();   
function handleLogout() {
  userStore.logout();
  router.push("/login");
}
</script>

<template>
  <header>
    <div class="wrapper">
      <nav class="mb-10">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/drawing">Drawing</RouterLink>
        <RouterLink to="/gallery">Gallery</RouterLink>
        <template v-if="userStore.isLoggedIn">
          <RouterLink to="/my-gallery">My Gallery</RouterLink>
          <section class="w-min inline-block px-10">{{ userStore.username }}</section>
          <button @click="handleLogout">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login">Login</RouterLink>
          <RouterLink to="/register">Register</RouterLink>
        </template>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

</style>
