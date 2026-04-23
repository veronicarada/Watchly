<!-- ToastContainer.vue -->
<template>
  <Teleport to="body">
    <div class="toast-container">
      <div v-for="t in toast.toasts" :key="t.id" :class="['toast', t.type]">
        {{ t.message }}
      </div>
    </div>
  </Teleport>
</template>
<script setup>
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()
</script>
