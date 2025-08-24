<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const openMenus = ref({}) // { 'nhan-su': true, ... }
const route = useRoute()

const openAllSubmenus = (menuKey) => {
  // Giả sử menuKey là 'nhan-su'
  openMenus.value[menuKey] = true
  // Nếu có nhiều submenu con, lặp qua và mở hết
  // openMenus.value = { ...openMenus.value, ...allSubmenuKeys.reduce((acc, k) => ({ ...acc, [k]: true }), {}) }
}

onMounted(() => {
  if (route.name === 'NhanSu' || route.path.startsWith('/nhan-su')) {
    openAllSubmenus('nhan-su')
  }
})

watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/nhan-su')) {
    openAllSubmenus('nhan-su')
  }
})
</script>

<template>
  <Menu :open-menus="openMenus" />
</template>