<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    // Each item should have: { text: string, to?: string }
  }
})

const route = useRoute()

const isLastItem = (index) => {
  return index === props.items.length - 1
}
</script>

<template>
  <nav aria-label="breadcrumb" class="breadcrumb-wrapper">
    <ol class="breadcrumb">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="breadcrumb-item"
        :class="{ 'active': isLastItem(index) }"
      >
        <router-link
          v-if="!isLastItem(index) && item.to"
          :to="item.to"
          class="breadcrumb-link"
        >
          <i v-if="index === 0" class="fas fa-home"></i>
          {{ item.text }}
        </router-link>
        <span v-else class="breadcrumb-text">
          {{ item.text }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb-wrapper {
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 1.5rem;
}

.breadcrumb {
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: inline-flex;
  align-items: center;
}

.breadcrumb-item:not(:last-child)::after {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-right: 2px solid #6c757d;
  border-bottom: 2px solid #6c757d;
  transform: rotate(-45deg);
  margin: 0 0.75rem;
}

.breadcrumb-link {
  color: #0d6efd;
  text-decoration: none;
  transition: color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-link:hover {
  color: #0a58ca;
  text-decoration: none;
}

.breadcrumb-text {
  color: #6c757d;
  font-weight: 500;
}

.breadcrumb-item.active .breadcrumb-text {
  color: #212529;
}

i {
  font-size: 0.9rem;
}
</style>