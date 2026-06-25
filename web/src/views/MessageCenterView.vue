<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import {
  getMessageSessions,
  getSessionMessages,
  sendSessionMessage,
  type MessageSessionListItem,
  type SessionMessagesResponse,
} from '../api/message'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const sending = ref(false)
const hint = ref('正在加载消息中心...')
const actionMessage = ref('')
const sessions = ref<MessageSessionListItem[]>([])
const activeSessionId = ref('')
const activeSession = ref<SessionMessagesResponse['session'] | null>(null)
const messages = ref<SessionMessagesResponse['messages']>([])
const formMessage = ref('')

onMounted(async () => {
  await loadSessions()
})

async function loadSessions() {
  loading.value = true

  try {
    const response = await getMessageSessions()
    sessions.value = response.list
    hint.value =
      response.total > 0 ? `你有 ${response.total} 个会话，未读 ${response.unreadTotal} 条` : '还没有消息会话'

    const preferredSessionId =
      String(route.query.sessionId || '') || activeSessionId.value || sessions.value[0]?.id || ''

    if (preferredSessionId) {
      await openSession(preferredSessionId)
    } else {
      activeSession.value = null
      messages.value = []
    }
  } catch {
    hint.value = '消息加载失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

async function openSession(sessionId: string) {
  activeSessionId.value = sessionId

  try {
    const response = await getSessionMessages(sessionId)
    activeSession.value = response.session
    messages.value = response.messages
    sessions.value = sessions.value.map((item) =>
      item.id === sessionId
        ? {
            ...item,
            unreadCount: 0,
          }
        : item,
    )
    await router.replace({ path: '/messages', query: { sessionId } })
  } catch {
    actionMessage.value = '会话内容加载失败，请稍后再试'
  }
}

async function handleSendMessage() {
  if (!activeSessionId.value || !formMessage.value.trim()) {
    return
  }

  sending.value = true
  actionMessage.value = ''

  try {
    await sendSessionMessage(activeSessionId.value, formMessage.value)
    formMessage.value = ''
    await openSession(activeSessionId.value)
    await loadSessions()
  } catch {
    actionMessage.value = '消息发送失败，请稍后再试'
  } finally {
    sending.value = false
  }
}

function formatTime(value: string | null) {
  if (!value) {
    return '刚刚'
  }

  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="page-shell">
    <section class="panel">
      <div class="panel-header">
        <h2>消息中心</h2>
        <span>{{ loading ? '加载中' : hint }}</span>
      </div>

      <div class="message-layout">
        <aside class="message-sidebar">
          <div v-if="sessions.length === 0" class="message-empty">
            <p>还没有会话，去商品详情页联系卖家后会显示在这里。</p>
            <RouterLink class="primary-button" to="/products">去逛商品</RouterLink>
          </div>

          <button
            v-for="item in sessions"
            :key="item.id"
            type="button"
            :class="['message-session-card', { active: activeSessionId === item.id }]"
            @click="openSession(item.id)"
          >
            <div class="message-session-top">
              <strong>{{ item.partner?.nickname || '校园卖家' }}</strong>
              <span>{{ formatTime(item.lastMessageAt) }}</span>
            </div>
            <p class="message-session-title">{{ item.productTitle }}</p>
            <p class="message-session-preview">{{ item.lastMessage || '已建立会话，快去打个招呼吧' }}</p>
            <span v-if="item.unreadCount > 0" class="message-unread-badge">{{ item.unreadCount }}</span>
          </button>
        </aside>

        <div class="message-main">
          <template v-if="activeSession">
            <div class="message-header-card">
              <div>
                <h3>{{ activeSession.partner?.nickname || '校园同学' }}</h3>
                <p>
                  正在沟通商品：{{ activeSession.product?.title || '商品已下架' }}
                  <span v-if="activeSession.product?.price"> · ￥{{ activeSession.product.price.toFixed(2) }}</span>
                </p>
              </div>
              <RouterLink
                v-if="activeSession.product?.id"
                class="secondary-button"
                :to="`/products/${activeSession.product.id}`"
              >
                查看商品
              </RouterLink>
            </div>

            <div class="message-list">
              <article
                v-for="item in messages"
                :key="item.id"
                :class="['message-bubble-wrap', { mine: item.senderId === authStore.userInfo?.id }]"
              >
                <div :class="['message-bubble', { mine: item.senderId === authStore.userInfo?.id }]">
                  <p>{{ item.content }}</p>
                  <span>{{ formatTime(item.createdAt) }}</span>
                </div>
              </article>
            </div>

            <form class="message-form" @submit.prevent="handleSendMessage">
              <textarea
                v-model="formMessage"
                rows="4"
                placeholder="输入你想和对方说的话，例如：请问这个商品还在吗？"
              ></textarea>
              <div class="message-form-actions">
                <p v-if="actionMessage" class="form-message error">{{ actionMessage }}</p>
                <button class="primary-button" type="submit" :disabled="sending || !formMessage.trim()">
                  {{ sending ? '发送中...' : '发送消息' }}
                </button>
              </div>
            </form>
          </template>

          <div v-else class="message-empty message-empty-main">
            <p>选择左侧会话，开始和买家或卖家沟通。</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
