<template>
  <div v-for="pointer in pointers" :key="pointer.username">
    <div
      :style="{
        position: 'absolute',
        top: `${pointer.y}px`,
        left: `${pointer.x + 15}px`,
        backgroundColor: pointer.color,
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        pointerEvents: 'none',
        color: 'white',
        fontSize: '1.5rem',
        textShadow: '0 0 3px black, 0 0 5px black',
      }"
    >
      {{ pointer.username }}
    </div>
  </div>
  
  <div class="flex justify-center">
    <input class="text-black text-center" v-model="picName" :disabled="false" />
    <p class="bg-blue-700 text-white">Author: {{ picAuthor }}</p>
  </div>
  <div
    @mousemove="handleMouseMove"
    class="grid-container"
    @mousedown.prevent="isClicked = true"
    @mouseup="isClicked = false"
    @mouseleave="isClicked = false"
  >
    <div class="w-full bg-slate-200 text-zinc-800 flex justify-evenly">
      <div :class="borderClass" class="border-4 my-5 cursor-pointer rounded-xl">
        <img
          @click="togglePen"
          class="pen-tool p-2"
          src="https://static.vecteezy.com/system/resources/thumbnails/019/023/680/small_2x/fountain-pen-icon-png.png"
        />
      </div>
      <div
        :class="borderClassEraser"
        class="border-4 my-5 cursor-pointer rounded-xl"
      >
        <img
          @click="toggleEraser"
          class="pen-tool p-2"
          src="https://pngimg.com/uploads/eraser/eraser_PNG43.png"
        />
      </div>
      <div class="border-4 my-5 border-lime-700 cursor-pointer rounded-xl">
        <img
          @click="deleteAll"
          class="pen-tool p-2"
          src="https://i.pinimg.com/originals/04/64/3e/04643e60b6168e21ba8351397fd5be46.png"
        />
      </div>
      <div
        class="flex items-center border-4 my-5 border-lime-700 cursor-pointer rounded-xl"
      >
        <input type="color" v-model="selectedColor" class="cursor-pointer" />
      </div>
      <div
        class="flex items-center border-4 my-5 border-lime-700 cursor-pointer rounded-xl"
      >
        <button
          @click="changeSize('+')"
          class="w-10 border-4 border-blue-700 mx-2 rounded-xl"
        >
          +
        </button>
        <section class="w-5 text-center">{{ size }}</section>
        <button
          @click="changeSize('-')"
          class="w-10 border-4 border-red-700 mx-2 rounded-xl"
        >
          -
        </button>
      </div>
      <div
        class="flex items-center border-4 my-5 border-lime-700 cursor-pointer rounded-xl"
      >
        <img
          @click="savePicture"
          class="pen-tool p-2"
          src="https://static-00.iconduck.com/assets.00/save-icon-2048x2048-iovw4qr4.png"
        />
      </div>
    </div>
    <div>
      <div class="flex justify-center min-h-screen">
        <section class="h-full w-full">
          <div v-for="(col, i) in map[0]" :key="i" class="grid-row">
            <div
              v-for="(cell, j) in map"
              :key="`${i}-${j}`"
              :style="{ backgroundColor: cell[i] }"
              class="grid-item"
              @mouseenter="handleMouseEnter(i, j)"
              @mousedown.prevent="handleMouseDown(i, j)"
            ></div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import axios from "axios";
import { io } from "socket.io-client";
import { ref, computed, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import {useToast} from 'vue-toast-notification';

export default {
  name: "DrawingView",
  setup() {
    const isClicked = ref(false);
    const penActive = ref(false);
    const eraserActive = ref(false);
    const selectedColor = ref("#000000");
    const size = ref(16);
    const socket = ref();
    const picId = useRoute().query?.pictureId;
    const errorMessage = ref("");
    const toast = useToast();
    const picAuthor = ref("");
    const apiUrl = ref(import.meta.env.VITE_BACKEND_ROUTE);
    const map = ref(
      Array.from({ length: size.value }, () =>
        Array.from({ length: size.value }, () => "#FFFFFF")
      )
    );
    const picName = ref("");
    const colorCursor = getRandomHexColor();

    const pointers = ref([
    ]);

    function changeSize(char: string) {
      if (char == "-" && size.value > 1) {
        size.value--;
      } else if (char == "+" && size.value < 24) {
        size.value++;
      }
    }

    watch(size, (newSize) => {
      if (newSize > 0) {
        if (map.value.length > newSize) {
          map.value.forEach((e) => {
            e.pop();
          });
          map.value.pop();
        } else {
          map.value.forEach((e) => {
            e.push("#ffffff");
          });
          map.value.push(Array.from({ length: size.value }, () => "#ffffff"));
        }
      }
    });

    function getRandomHexColor() {
      return `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`;
    }

    const handleMouseMove = (evt) => {
      const payload = {
        username: localStorage.getItem("username"),
        x: evt.x,
        y: evt.y,
        color: colorCursor,
      };
      socket?.value?.emit(`cursorMove`, {
        payload,
      });
    };

    onUnmounted(() => {
      socket?.value?.emit("remove-pointer", localStorage.getItem('username'));
      socket?.value?.disconnect();
    });


    async function getPictureData() {
      if (!picId) {
        return;
      }
      try {
        const response = await axios.get(`${apiUrl.value}/pictures/${picId}`);

        if (!response.data.failed) {
          picName.value = response.data.picture.name;
          picAuthor.value = response.data.picture.author.username;

          const token = localStorage.getItem("token");
          const username = localStorage.getItem("username");

          socket.value = io(`${apiUrl.value}`, {
            query: {
              token,
              username,
              pictureId: response.data.picture.picture_id,
              pictureData: response.data.picture.picture_data,
            },
          });

          socket?.value?.on("cursorMove", (payload) => {
            if (payload.payload.username !== username) {
              pointers.value = pointers.value.filter(
                (p) => p.username !== payload.payload.username
              );
              pointers.value.push(payload.payload);
            }
          });

          socket?.value?.on(`${picId}`, (update) => {
            map.value = update;
            size.value = update.length;
          });
          socket?.value?.on("connect", () => {
          });

          socket?.value?.on("message", (msg) => {
          });

          socket?.value?.on("disconnect", () => {
          });
          
          socket?.value?.on("remove-pointer", (username) => {
            pointers.value = pointers.value.filter(
                (p) => p.username !== username
              );
          });

          return response.data.picture.picture_data;
        } else {
          errorMessage.value = "Failed to fetch picture data.";
          toast.error(errorMessage.value)
        }
      } catch (error: any) {
        if (error.response && error.response.data) {
          const serverError = error.response.data.code;

          if (serverError === "NO_SUCH_ENTITY") {
            errorMessage.value = "The requested picture does not exist.";
            toast.error(errorMessage.value)
          } else {
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

    getPictureData().then((data) => {
      if (data) {
        map.value = data;
      }
    });

    const handleMouseEnter = (j: number, i: number) => {
      if (isClicked.value && penActive.value) {
        map.value[i][j] = selectedColor.value;
        socket?.value?.emit(`${picId}`, {
          pictureData: map.value,
        });
      }
      if (isClicked.value && eraserActive.value) {
        map.value[i][j] = "#FFFFFF";
        socket?.value?.emit(`${picId}`, {
          pictureData: map.value,
        });
      }
    };

    const handleMouseDown = (j: number, i: number) => {
      if (penActive.value) {
        map.value[i][j] = selectedColor.value;
        isClicked.value = true;

        socket?.value?.emit(`${picId}`, {
          pictureData: map.value,
        });
      }
      if (eraserActive.value) {
        map.value[i][j] = "#FFFFFF";
        isClicked.value = true;

        socket?.value?.emit(`${picId}`, {
          pictureData: map.value,
        });
      }
    };

    const togglePen = () => {
      penActive.value = !penActive.value;
      eraserActive.value = false;
    };

    const toggleEraser = () => {
      eraserActive.value = !eraserActive.value;
      penActive.value = false;
    };

    const deleteAll = () => {
      map.value = Array.from({ length: size.value }, () =>
        Array.from({ length: size.value }, () => "#FFFFFF")
      );
    };

    const borderClass = computed(() =>
      penActive.value ? "border-sky-500" : "border-red-700"
    );

    const borderClassEraser = computed(() =>
      eraserActive.value ? "border-sky-500" : "border-red-700"
    );

    const savePicture = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        errorMessage.value = "Not authenticated";
        toast.error(errorMessage.value)
        return;
      }
      try {
        if (!picId && !picName.value) {
          errorMessage.value = "Picture needs a name.";
          toast.error(errorMessage.value)
          return;
        }

        const response = picId
          ? await axios.patch(
              `${apiUrl.value}/pictures/${picId}`,
              {
                name: picName.value,
                picture_data: map.value,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
          : await axios.post(
              `${apiUrl.value}/pictures`,
              {
                name: picName.value,
                picture_data: map.value,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

        if (!response.data.failed) {
          toast.success("Successfully updated!");
        } else {
          errorMessage.value = "Failed to fetch picture data.";
          toast.error(errorMessage.value)
        }
      } catch (error: any) {
        if (error.response && error.response.data) {
          const serverError = error.response.data.code;
          if (serverError === "NO_SUCH_ENTITY") {
            errorMessage.value = "The requested picture does not exist.";
            toast.error(errorMessage.value)
          } else {
            errorMessage.value = serverError || "An unknown error occurred.";
            toast.error(errorMessage.value)
          }
        } else {
          errorMessage.value = "Failed to connect to the server.";
          toast.error(errorMessage.value)
        }

        console.error(error);
      }
    };



    return {
      isClicked,
      savePicture,
      picAuthor,
      changeSize,
      size,
      penActive,
      picId,
      selectedColor,
      map,
      handleMouseEnter,
      handleMouseDown,
      togglePen,
      toggleEraser,
      borderClass,
      deleteAll,
      borderClassEraser,
      picName,
      apiUrl,
      handleMouseMove,
      pointers,
    };
  },
};
</script>

<style scoped>
input {
  pointer-events: auto; 
}

.grid-container {
  display: flex;
  flex-direction: column;
  user-select: none;
}
.grid-row {
  display: flex;
  justify-content: center;
}
.grid-item {
  &:hover {
    box-sizing: border-box; 
    border: 1px solid blue; 
    background-color: lightgray;
  }
  width: 4%;
  height: auto;
  aspect-ratio: 1;
  border: 1px solid #ccc;
  background-color: white;
}

.pen-tool {
  width: 50px;
  height: auto;
}
</style>
