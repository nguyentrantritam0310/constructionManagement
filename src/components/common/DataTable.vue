<script setup>
defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    required: true
  }
})

// defineEmits(['row-click'])

</script>

<template>
  <div class="table-responsive">
    <table class="table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">
            {{ column.label }}
          </th>
          <th v-if="$slots.actions">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item.id" @click="$emit('row-click', item)" class="cursor-pointer">
          <template v-for="column in columns" :key="column.key">
            <td>
              <slot :name="column.key" :item="item">
                <span v-if="column.key === 'employeeName'" v-html="item[column.key]"></span>
                <span v-else>{{ item[column.key] }}</span>
              </slot>
            </td>
          </template>
          <td v-if="$slots.actions" @click.stop>
            <slot name="actions" :item="item"></slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table th {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  min-width: 100px;
}

.table td,
.table th {
  padding: 0.75rem;
  vertical-align: middle;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.875rem;
  white-space: nowrap;
  min-width: 120px;
}

.date-info i {
  width: 1rem;
  text-align: center;
  flex-shrink: 0;
}

/* Column width utilities */
.col-date {
  min-width: 120px;
  max-width: 120px;
}

.col-status {
  min-width: 120px;
  max-width: 120px;
}

.col-actions {
  min-width: 100px;
  max-width: 100px;
  text-align: center;
}
</style>
