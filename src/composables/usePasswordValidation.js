import { ref, computed } from 'vue'

export function usePasswordValidation() {
  // Regex pattern cho password mạnh
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  
  // Password requirements
  const requirements = {
    minLength: { test: (password) => password.length >= 8, message: 'Ít nhất 8 ký tự' },
    hasLowercase: { test: (password) => /[a-z]/.test(password), message: 'Ít nhất 1 chữ thường' },
    hasUppercase: { test: (password) => /[A-Z]/.test(password), message: 'Ít nhất 1 chữ hoa' },
    hasNumber: { test: (password) => /\d/.test(password), message: 'Ít nhất 1 số' },
    hasSpecialChar: { test: (password) => /[@$!%*?&]/.test(password), message: 'Ít nhất 1 ký tự đặc biệt (@$!%*?&)' }
  }

  const validatePassword = (password) => {
    const results = {}
    let isValid = true

    for (const [key, requirement] of Object.entries(requirements)) {
      results[key] = {
        valid: requirement.test(password),
        message: requirement.message
      }
      if (!results[key].valid) {
        isValid = false
      }
    }

    return {
      isValid,
      results,
      overallValid: passwordRegex.test(password)
    }
  }

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' }
    
    let score = 0
    const checks = Object.values(requirements)
    
    checks.forEach(check => {
      if (check.test(password)) score++
    })

    if (score <= 2) return { score, label: 'Yếu', color: 'danger' }
    if (score <= 3) return { score, label: 'Trung bình', color: 'warning' }
    if (score <= 4) return { score, label: 'Mạnh', color: 'success' }
    return { score, label: 'Rất mạnh', color: 'success' }
  }

  return {
    passwordRegex,
    requirements,
    validatePassword,
    getPasswordStrength
  }
}
