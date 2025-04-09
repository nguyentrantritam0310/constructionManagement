<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  const pathArray = route.path.split('/').filter(Boolean)
  const items = []
  let path = ''

  // Trang chủ
  items.push({
    text: 'Trang chủ',
    path: '/',
    active: pathArray.length === 0
  })

  // Các trang khác
  pathArray.forEach((item, index) => {
    path += `/${item}`
    let text = ''

    switch (item) {
      case 'project-management':
        text = 'Quản lý dự án'
        break
      case 'construction-plan-management':
        text = 'Quản lý kế hoạch thi công'
        break
      default:
        text = item
    }

    items.push({
      text,
      path,
      active: index === pathArray.length - 1
    })
  })

  return items
})
</script>

<template>
  <nav aria-label="breadcrumb" class="breadcrumb-wrapper">
    <ol class="breadcrumb">
      <li
        v-for="(item, index) in breadcrumbs"
        :key="index"
        class="breadcrumb-item"
        :class="{ active: item.active }"
      >
        <router-link
          v-if="!item.active"
          :to="item.path"
          class="text-decoration-none"
        >
          {{ item.text }}
        </router-link>
        <span v-else>{{ item.text }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb-wrapper {
  background-color: #fff;
  padding: 0.75rem 0;
  margin-bottom: 1.5rem;
  border-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.breadcrumb {
  margin: 0;
  padding: 0 1rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0 0.5rem;
}

.breadcrumb-item a {
  color: #007bff;
}

.breadcrumb-item a:hover {
  color: #0056b3;
}

.breadcrumb-item.active {
  color: #6c757d;
}
</style>
