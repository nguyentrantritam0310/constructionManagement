<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Kế Hoạch Vật Tư</h1>
      <ActionButton
        icon="fas fa-plus"
        type="primary"
        @click="openCreateForm"
      >
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <ListLayout :items="materialPlans">
      <template #default="{ items }">
        <MaterialPlanList
          :plans="items"
          @update-plan-status="handleUpdatePlanStatus"
        />
      </template>
    </ListLayout>

    <!-- ... rest of the template ... -->
  </div>
</template>