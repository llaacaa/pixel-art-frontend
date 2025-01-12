<script setup lang="ts">
import { useUserStore } from "@/stores/authorizationStore";
import axios from "axios";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {useToast} from 'vue-toast-notification';

const router = useRouter();
const errorMessage = ref("");
const successMessage = ref("");
const userStore = useUserStore();
const apiUrl = ref(import.meta.env.VITE_BACKEND_ROUTE);
const allPictures = ref([]); // Store all pictures
const currentPage = ref(1); // Track the current page
const picturesPerPage = 8; // Define 8 pictures per page
const toast = useToast();

// Compute total pages dynamically based on allPictures length
const totalPages = computed(() =>
  Math.ceil(allPictures.value.length / picturesPerPage)
);

// Get pictures for the current page
const paginatedPictures = computed(() =>
  allPictures.value.slice(
    (currentPage.value - 1) * picturesPerPage,
    currentPage.value * picturesPerPage
  )
);

function daysSince(timestamp: string): string {
  const now: Date = new Date();
  const past: Date = new Date(timestamp);
  const differenceInMilliseconds: number = now.getTime() - past.getTime();

  const differenceInMinutes: number = Math.floor(
    differenceInMilliseconds / (1000 * 60)
  );
  const differenceInHours: number = Math.floor(differenceInMinutes / 60);

  if (differenceInMinutes < 60) {
    return differenceInMinutes === 1
      ? "1 minute ago"
      : `${differenceInMinutes} minutes ago`;
  }

  if (differenceInHours < 24) {
    return differenceInHours === 1
      ? "1 hour ago"
      : `${differenceInHours} hours ago`;
  }

  const daysPast: number = Math.floor(
    differenceInMilliseconds / (1000 * 60 * 60 * 24)
  );

  if (daysPast === 1) {
    return "Yesterday";
  } else {
    return `${daysPast} days ago`;
  }
}

const inputDisabled = ref([]); // Initialize an empty array

onMounted(() => {
  fetchPictures().then(() => {
    // Initialize inputDisabled based on allPictures length after fetching data
    inputDisabled.value = Array.from(
      { length: allPictures.value.length },
      () => true
    );
  });
});

function handlePenClick(index: number, picture: any) {
  // Toggle the disabled state of the specific input

  inputDisabled.value[index] = !inputDisabled.value[index];
  if (inputDisabled.value[index]) {
    handleForm(index, picture);
  }
}

async function handleForm(index: number, picture: any) {
  const updatedName = allPictures.value[index].name;
  const id = picture.picture_id;
  const token = localStorage.getItem("token");
  if (!token) {
    errorMessage.value = "No token available. Please log in.";
    toast.error(errorMessage.value)
    return;
  }
  try {
    const response = await axios.patch(
      `${apiUrl.value}/pictures/${id}`,
      allPictures.value[index],
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data && response.data.failed === false) {
      successMessage.value = "Picture updated successfully!";
      toast.success("Updated picture:", response.data.picture);
    }
  } catch (error: any) {
    if (error.response && error.response.data) {
      const serverError = error.response.data.code;

      switch (serverError) {
        case "NOT_YOURS":
          errorMessage.value = "You do not own this picture.";
          toast.error(errorMessage.value)
          break;
        case "NO_SUCH_ENTITY":
          errorMessage.value = "The specified picture does not exist.";
          toast.error(errorMessage.value)
          break;
        case "INVALID_DATA":
          errorMessage.value = "The provided data is invalid.";
          toast.error(errorMessage.value)
          break;
        case "BAD_PICTURE_DATA":
          errorMessage.value = "The picture data format is incorrect.";
          toast.error(errorMessage.value)
          break;
        case "NOT_AUTHENTICATED":
          errorMessage.value = "You are not authenticated.";
          toast.error(errorMessage.value)
          break;
        default:
          errorMessage.value = serverError || "An unknown error occurred.";
          toast.error(errorMessage.value)
      }
    } else {
      errorMessage.value = "Failed to connect to the server.";
      toast.error(errorMessage.value)
    }

    console.error(error);
  }
}

const deletePicture = async (picture: any) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.delete(
      `${apiUrl.value}/pictures/${picture.picture_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // Send the JWT in Authorization header
        },
      }
    );

    console.log("Picture deleted successfully:", response.data);
    alert("Picture deleted successfully!");
    window.location.reload();
  } catch (error: any) {
    // Handle possible errors
    if (error.response) {
      const errorCode = error.response.data?.code;
      if (errorCode === "NOT_YOURS") {
        alert("You don't own this picture!");
      } else if (errorCode === "NO_SUCH_ENTITY") {
        alert("Picture not found!");
      } else if (errorCode === "NOT_AUTHENTICATED") {
        alert("You must be logged in to delete a picture!");
      } else {
        alert("An unexpected error occurred.");
      }
    } else {
      console.error("Error:", error);
      alert("Failed to delete the picture. Please try again.");
    }
  }
};

function editPicture(picture) {
  router.push("/drawing?pictureId=" + picture.picture_id);
}

const fetchPictures = async () => {
  try {
    const response = await axios.get(`${apiUrl.value}/pictures`, {
      params: {
        author: userStore.$state.userId,
        older_first: false, // Default value
      },
    });

    allPictures.value = response.data.pictures || []; // Store all pictures
  } catch (error: any) {
    if (error.response && error.response.data) {
      errorMessage.value =
        error.response.data.code || "Fetching pictures failed.";
        toast.error(errorMessage.value)
    } else {
      errorMessage.value = "An error occurred.";
      toast.error(errorMessage.value)
    }
    console.error(error);
  }
};

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page; // Update current page
  }
};

// Redirect to login if the user is not logged in
if (!userStore.$state.isLoggedIn) {
  router.push("/login");
} else {
  onMounted(() => {
    fetchPictures();
  });
}
</script>

<template>
  <div>

    <!-- Pictures Grid -->
    <div v-if="paginatedPictures" class="grid grid-cols-4 gap-4">
      <div v-for="(pic, index) in paginatedPictures" :key="index" class="m-5">
        <div
          class="hover:-translate-y-6 transition-all"
          @click="editPicture(pic)"
        >
          <div
            v-for="(col, j) in pic.picture_data[0]"
            :key="j"
            class="grid-row"
          >
            <div
              v-for="(row, i) in pic.picture_data"
              :key="`${i}-${j}`"
              :style="{ backgroundColor: row[j] }"
              class="grid-item"
            ></div>
          </div>
        </div>
        <div class="flex justify-between bg-slate-500">
          <div>
            <form @submit.prevent="handleForm(index, pic)">
              <input
                class="text-black bg-slate-500"
                v-model="allPictures[index].name"
                :disabled="inputDisabled[index]"
              />
            </form>
            <section>{{ pic.author.username }}</section>
          </div>
          <section>{{ daysSince(pic.updated_at) }}</section>
        </div>
        <div class="bg-slate-500 flex justify-around">
          <img
            class="w-1/5 cursor-pointer"
            src="https://cdn-icons-png.flaticon.com/512/323/323609.png"
            alt="Delete"
            @click.stop="deletePicture(pic)"
          />
          <img
            class="w-1/5 cursor-pointer"
            @click.stop="handlePenClick(index, pic)"
            src="https://static.vecteezy.com/system/resources/thumbnails/019/023/680/small_2x/fountain-pen-icon-png.png"
            alt="Delete"
          />
        </div>
      </div>
    </div>

    <!-- Pagination Navigator -->
    <div v-if="totalPages > 1" class="flex justify-center mt-4">
      <button
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
        class="px-4 py-2 text-black bg-gray-300 rounded disabled:opacity-50 mr-2"
      >
        Previous
      </button>
      <span class="px-4 py-2">Page {{ currentPage }} of {{ totalPages }}</span>
      <button
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
        class="px-4 py-2 text-black bg-gray-300 rounded disabled:opacity-50 ml-2"
      >
        Next
      </button>
    </div>
  </div>
</template>

<style scoped>
.grid-row {
  display: flex;
  justify-content: center;
}
.grid-item {
  width: 50%;
  height: auto;
  aspect-ratio: 1;
  border: 1px solid #ccc;
}
</style>
