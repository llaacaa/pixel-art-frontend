<script setup lang="ts">
import router from "@/router";
import axios from "axios";
import { ref, onMounted } from "vue";
const errorMessage = ref("");
const apiUrl = ref(import.meta.env.VITE_BACKEND_ROUTE);
import {useToast} from 'vue-toast-notification';

const allPictures = ref([]); // Store pictures for the current page
const currentPage = ref(1); // Track the current page
const totalPages = ref(1); // Total number of pages (from backend response)
const picturesPerPage = 8; // Define how many pictures per page

const filteredAuthor = ref<string | null>(null); // Track the selected author filter
const toast = useToast();

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



// Update the filter for a specific author
function showAuthorPictures(author: string) {
  filteredAuthor.value = author; // Set the filter
  currentPage.value = 1; // Reset to the first page
  fetchPictures(currentPage.value); // Fetch pictures with the filter
}

// Fetch pictures for the specified page
const fetchPictures = async (page = 1) => {
  try {
    const response = await axios.get(`${apiUrl.value}/pictures`, {
      params: {
        page,
        limit: picturesPerPage,
        author: filteredAuthor.value || undefined, // Include author filter if set
      },
    });

    allPictures.value = response.data.pictures || [];
    totalPages.value = Math.ceil(response.data.total / picturesPerPage);
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

// Navigate to the edit page for a picture
function editPicture(picture) {
  router.push("/drawing?pictureId=" + picture.picture_id);
}

// Change the page and fetch data for the new page
const changePage = async (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page; // Update current page
    await fetchPictures(page); // Fetch data for the selected page
  }
};

function goBack() {
  window.location.reload();
}

// Fetch initial data when the component is mounted
onMounted(() => {
  fetchPictures(currentPage.value);
});
</script>

<template>
  <section
    v-if="filteredAuthor"
    class="text-red-600 absolute z-50 left-5 top-2 p-3 bg-slate-300 font-serif text-xl rounded-xl hover:scale-105 transition-all cursor-pointer"
    @click="goBack"
  >
    <img
      src="https://cdn-icons-png.freepik.com/512/190/190238.png"
      class="w-8"
    />
    <b>BACK TO ALL</b>
  </section>
  <div>
    <!-- Pictures Grid -->
    <div v-if="allPictures.length" class="grid grid-cols-4 gap-4">
      <div v-for="(pic, index) in allPictures" :key="index" class="m-5">
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
            <input
              class="text-black bg-slate-500"
              v-model="allPictures[index].name"
              disabled="true"
            />
            <section
              class="cursor-pointer hover:scale-105 hover:translate-x-2 hover:text-yellow-500 transition-all"
              @click="showAuthorPictures(pic.author.user_id)"
            >
              {{ pic.author.username }}
            </section>
          </div>
          <section>{{ daysSince(pic.updated_at) }}</section>
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
