<template>
  <div class="flex justify-center">
    <form @submit.prevent="submitForm">
      <label class="block py-2" for="username">Username</label>
      <input
        class="text-black block"
        type="text"
        id="username"
        v-model="username"
      />
      <label class="block py-2" for="password">Password</label>
      <input
        class="text-black block"
        type="password"
        id="password"
        v-model="password"
      />
      <button
        type="submit"
        class="block mt-4 bg-blue-500 text-white py-2 px-4 rounded"
      >
        Login
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import { useUserStore } from "@/stores/authorizationStore";
import axios from "axios";
import { ref } from "vue";
import { useRouter } from "vue-router";
import {useToast} from 'vue-toast-notification';

export default {
  name: "LoginView",
  setup() {
    const username = ref("");
    const password = ref("");
    const errorMessage = ref("");
    const userStore = useUserStore();
    const router = useRouter();
    const toast = useToast();

    if (userStore.$state.isLoggedIn) {
      router.push("/")
    }

    const apiUrl = ref(import.meta.env.VITE_BACKEND_ROUTE);

    const submitForm = async () => {
      try {
        const response = await axios.post(`${apiUrl.value}/auth/login`, {
          username: username.value,
          password: password.value,
        });
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.user_id);
        localStorage.setItem("username", response.data.username);
        userStore.login();
        router.push("/");
      } catch (error: any) {
        if (error.response && error.response.data) {
          errorMessage.value = error.response.data.code || "Login failed.";
          toast.error(errorMessage.value);
        } else {
          errorMessage.value = "An error occurred.";
          toast.error(errorMessage.value);
        }
        console.error(error);
      }
    };



    return {
      username,
      password,
      submitForm,
    };
  },
};
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
