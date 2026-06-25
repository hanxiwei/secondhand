<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { useAuthStore } from './stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const guestNavItems = [
  { to: '/', label: '首页' },
  { to: '/products', label: '逛商品' },
]

const userNavItems = [
  { to: '/', label: '首页' },
  { to: '/products', label: '逛商品' },
  { to: '/publish', label: '发布闲置' },
  { to: '/messages', label: '消息中心' },
]

const navItems = computed(() => (authStore.isLoggedIn ? userNavItems : guestNavItems))
const utilityNavItems = computed(() =>
  authStore.isLoggedIn
    ? [
        { to: '/orders', label: '订单' },
        { to: '/profile', label: '个人中心' },
      ]
    : [
        { to: '/login', label: '登录' },
        { to: '/register', label: '注册' },
      ],
)
const currentUserName = computed(() => authStore.userInfo?.nickname || '未登录')
const currentUserInitial = computed(() => currentUserName.value.slice(0, 1))
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="site-header__inner">
        <div class="site-brand-wrap">
          <RouterLink class="site-brand" to="/">
            <span class="site-brand__mark">CM</span>
            <span>
              <strong>校园集市</strong>
              <small>校园二手</small>
            </span>
          </RouterLink>
        </div>

        <nav class="site-nav">
          <div class="site-nav__pill">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              :class="['nav-link', { active: route.path === item.to }]"
            >
              {{ item.label }}
            </RouterLink>
          </div>
        </nav>

        <div class="site-user-wrap">
          <div class="site-utility-nav">
            <RouterLink
              v-for="item in utilityNavItems"
              :key="item.to"
              :to="item.to"
              :class="['utility-link', { active: route.path === item.to }]"
            >
              {{ item.label }}
            </RouterLink>
          </div>
          <div class="site-user-card">
            <div class="site-user-avatar">{{ currentUserInitial }}</div>
            <div class="site-user-copy">
              <strong>{{ currentUserName }}</strong>
            </div>
          </div>
        </div>
      </div>
    </header>

    <router-view />
  </div>
</template>
