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

      <label class="block py-2" for="confirm-password">Confirm Password</label>
      <input
        class="text-black block"
        type="password"
        id="confirm-password"
        v-model="confirmPassword"
      />
      <button
        type="submit"
        class="block mt-4 bg-blue-500 text-white py-2 px-4 rounded"
      >
        Register
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
  name: "RegisterView",
  components: {},
  setup() {
    const username = ref("");
    const password = ref("");
    const confirmPassword = ref("");
    const errorMessage = ref("");
    const successMessage = ref("");
    const router = useRouter();
    const userStore = useUserStore();
    const toast = useToast();

    if (userStore.$state.isLoggedIn) {
      router.push("/")
    }

    const apiUrl = ref(import.meta.env.VITE_BACKEND_ROUTE);

    const submitForm = async () => {
      if (password.value !== confirmPassword.value) {
        errorMessage.value = "Passwords do not match.";
        toast.error(errorMessage.value);
        return;
      }

      if (password.value.length < 8 || password.value.length > 128) {
        errorMessage.value = "Password length invalid.";
        toast.error(errorMessage.value);
        return;
      }
      if (username.value.length < 2) {
        errorMessage.value = "Username too short.";
        toast.error(errorMessage.value);
        return;
      }
      
      try {
        const response = await axios.post(`${apiUrl.value}/auth/register`, {
          username: username.value,
          password: password.value,
        });

        successMessage.value = "Successfully registered, redirecting to login page.";
        toast.success(successMessage.value);
        setTimeout(() => {
          router.push("/login");
        }, 2000);

        username.value = "";
        password.value = "";
        confirmPassword.value = "";
      } catch (error: any) {
        if (error.response && error.response.data) {
          errorMessage.value =
            error.response.data.code || "Registration failed.";
            toast.error(errorMessage.value);
        } else {
          errorMessage.value = "An error occurred.";
          
        }
        console.error(error);
      }
    };



    return {
      username,
      password,
      confirmPassword,
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
