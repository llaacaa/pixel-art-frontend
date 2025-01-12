import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    isLoggedIn: false, // Tracks if the user is logged in
    username: "", // Stores the username of the user
    token: "", // Stores the JWT token
    userId: "", // Stores the user ID
  }),
  actions: {
    login() {
      if (localStorage.getItem("token")) {
        this.isLoggedIn = true;
        this.username = localStorage.getItem("username") || "";
        this.token = localStorage.getItem("token") || "";
        this.userId = localStorage.getItem("userId") || "";
      }
    },
    logout() {
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      this.isLoggedIn = false;
      this.username = "";
      this.token = "";
      this.userId = "";
    },
  },
});
