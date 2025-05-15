<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  modelValue: {
    type: [String, Number, Date],
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => [] // Danh sách các tùy chọn cho select
  },
  disabled: { // <-- thêm dòng này
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="mb-3">
    <label class="form-label">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>

    <select v-if="type === 'select'" class="form-select" :class="{ 'is-invalid': error }" :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)" :required="required" :disabled="disabled">
      <option value="" disabled>Chọn...</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <textarea v-else-if="type === 'textarea'" class="form-control" :class="{ 'is-invalid': error }" :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)" :required="required" :disabled="disabled"></textarea>

    <input v-else-if="type === 'file'" type="file" class="form-control" :class="{ 'is-invalid': error }"
      @change="$emit('update:modelValue', $event.target.files[0])" :required="required" :disabled="disabled" />

    <input v-else-if="['text', 'number', 'date'].includes(type)" :type="type" class="form-control"
      :class="{ 'is-invalid': error }" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"
      :required="required" :disabled="disabled" />

    <div v-if="error" class="invalid-feedback">
      {{ error }}
    </div>
  </div>
</template>