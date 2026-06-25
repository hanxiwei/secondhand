<script setup lang="ts">
import axios from 'axios'
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { login } from '../api/auth'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  account: '',
  password: '',
})

const loading = ref(false)
const message = ref('请输入你的账号和密码。')
const isError = ref(false)

async function handleSubmit() {
  loading.value = true
  isError.value = false

  try {
    const result = await login(form)
    authStore.setAuth(result)
    message.value = `登录成功，欢迎你回来：${result.userInfo.nickname}`
    await router.push('/')
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      message.value = '登录失败，当前无法连接服务器，请稍后再试。'
    } else if (axios.isAxiosError(error) && error.response?.status === 401) {
      message.value = '登录失败，请检查账号密码是否正确。'
    } else {
      message.value = '登录失败，服务器暂时不可用，请稍后重试。'
    }
    isError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-shell">
    <section class="auth-layout">
      <div class="auth-info panel">
        <div class="panel-header">
          <h2>欢迎登录</h2>
          <span>校园集市</span>
        </div>
        <span class="tag">校园二手账号登录</span>
        <p class="auth-intro">登录后可以发布闲置、收藏商品、联系卖家，开始你的校内二手交易。</p>
        <RouterLink class="secondary-button auth-link" to="/register">没有账号？去注册</RouterLink>
      </div>

      <form class="auth-form panel" @submit.prevent="handleSubmit">
        <div class="panel-header">
          <h2>账号登录</h2>
          <span>欢迎回来</span>
        </div>
        <label class="field">
          <span>账号</span>
          <input v-model="form.account" type="text" placeholder="请输入用户名、手机号或邮箱" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="form.password" type="password" placeholder="请输入密码" />
        </label>
        <p :class="['form-message', { error: isError }]">{{ message }}</p>
        <button class="primary-button" type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '立即登录' }}
        </button>
      </form>
    </section>
  </div>
</template>
