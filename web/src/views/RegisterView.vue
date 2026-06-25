<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { register } from '../api/auth'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  phone: '',
  email: '',
  schoolName: '校园示例大学',
  collegeName: '',
  grade: '',
  campus: '主校区',
})

const loading = ref(false)
const message = ref('注册后会自动登录。')
const isError = ref(false)

function formatRegisterError(error: any) {
  const serverMessage = error?.response?.data?.message
  const serverErrors = error?.response?.data?.errors

  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage
  }

  if (Array.isArray(serverMessage) && serverMessage.length > 0) {
    return serverMessage.join('；')
  }

  if (Array.isArray(serverErrors) && serverErrors.length > 0) {
    return serverErrors.join('；')
  }

  return '注册失败，请检查输入信息'
}

async function handleSubmit() {
  loading.value = true
  isError.value = false

  try {
    const result = await register({
      ...form,
      phone: form.phone || undefined,
      email: form.email || undefined,
      collegeName: form.collegeName || undefined,
      grade: form.grade || undefined,
    })
    authStore.setAuth(result)
    message.value = '注册成功，正在进入首页...'
    await router.push('/')
  } catch (error: any) {
    message.value = formatRegisterError(error)
    isError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-shell">
    <section class="panel publish-layout">
      <div class="panel-header">
        <h2>注册账号</h2>
        <span>注册后即可发布商品和查看我的商品</span>
      </div>
      <form class="publish-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span>用户名</span>
          <input v-model="form.username" type="text" placeholder="至少 3 位，例如：zhangsan" />
        </label>
        <label class="field">
          <span>昵称</span>
          <input v-model="form.nickname" type="text" placeholder="例如：张三同学" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="form.password" type="password" placeholder="至少 6 位" />
        </label>
        <label class="field">
          <span>手机号</span>
          <input v-model="form.phone" type="text" placeholder="选填，用于登录" />
        </label>
        <label class="field">
          <span>邮箱</span>
          <input v-model="form.email" type="email" placeholder="选填，用于登录" />
        </label>
        <label class="field">
          <span>学校</span>
          <input v-model="form.schoolName" type="text" />
        </label>
        <label class="field">
          <span>学院</span>
          <input v-model="form.collegeName" type="text" placeholder="选填" />
        </label>
        <label class="field">
          <span>年级</span>
          <input v-model="form.grade" type="text" placeholder="例如：2024级" />
        </label>
        <label class="field full">
          <span>校区</span>
          <input v-model="form.campus" type="text" placeholder="例如：主校区" />
        </label>
        <p :class="['form-message', { error: isError }]">{{ message }}</p>
        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '立即注册' }}
        </button>
      </form>
    </section>
  </div>
</template>
