<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { cancelOrder, clearCanceledOrders, completeOrder, confirmOrder, getMyOrders, type MyOrderItem } from '../api/order'
import { handleProductImageError, normalizeProductText } from '../utils/productDisplay'

const loading = ref(true)
const hint = ref('正在加载订单...')
const actionMessage = ref('')
const orders = ref<MyOrderItem[]>([])
const clearingCanceled = ref(false)
const hasCanceledOrders = computed(() => orders.value.some((item) => item.status === 3))

onMounted(async () => {
  await loadOrders()
})

async function loadOrders() {
  loading.value = true

  try {
    const response = await getMyOrders()
    orders.value = response.list
    hint.value = response.total > 0 ? `共找到 ${response.total} 条订单记录` : '你还没有订单记录'
  } catch {
    hint.value = '订单加载失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

function getOrderStatusText(status: number) {
  const map: Record<number, string> = {
    0: '待确认',
    1: '交易中',
    2: '已成交',
    3: '已取消',
    4: '已关闭',
  }

  return map[status] ?? '未知状态'
}

function getRoleText(role: MyOrderItem['role']) {
  return role === 'buyer' ? '我是买家' : '我是卖家'
}

function getProductTitle(item: MyOrderItem) {
  return normalizeProductText(item.product.title, '校园闲置好物')
}

function getProductCampus(item: MyOrderItem) {
  return normalizeProductText(item.product.campus || item.partner?.campus, '未填写')
}

async function handleConfirm(id: string) {
  try {
    const result = await confirmOrder(id)
    actionMessage.value = result.message
    await loadOrders()
  } catch {
    actionMessage.value = '确认交易失败，请稍后再试'
  }
}

async function handleCancel(id: string) {
  try {
    const result = await cancelOrder(id)
    actionMessage.value = result.message
    await loadOrders()
  } catch {
    actionMessage.value = '取消订单失败，请稍后再试'
  }
}

async function handleComplete(id: string) {
  try {
    const result = await completeOrder(id)
    actionMessage.value = result.message
    await loadOrders()
  } catch {
    actionMessage.value = '完成交易失败，请稍后再试'
  }
}

async function handleClearCanceledOrders() {
  if (!hasCanceledOrders.value || clearingCanceled.value) {
    return
  }

  const confirmed = window.confirm('确认清除全部已取消订单吗？清除后将无法恢复。')
  if (!confirmed) {
    return
  }

  clearingCanceled.value = true

  try {
    const result = await clearCanceledOrders()
    actionMessage.value = result.message
    await loadOrders()
  } catch {
    actionMessage.value = '清除已取消订单失败，请稍后再试'
  } finally {
    clearingCanceled.value = false
  }
}
</script>

<template>
  <div class="page-shell">
    <section class="panel">
      <div class="panel-header">
        <h2>我的订单</h2>
        <div class="orders-header-actions">
          <span>{{ loading ? '加载中' : hint }}</span>
          <button
            v-if="hasCanceledOrders"
            class="ghost-button orders-clear-button"
            type="button"
            :disabled="clearingCanceled"
            @click="handleClearCanceledOrders"
            title="清除已取消订单"
          >
            {{ clearingCanceled ? '清理中...' : '🗑' }}
          </button>
        </div>
      </div>

      <p v-if="actionMessage" class="form-message">{{ actionMessage }}</p>

      <div v-if="orders.length > 0" class="order-list">
        <article v-for="item in orders" :key="item.id" class="order-card">
          <div class="order-card-main">
            <div class="product-cover order-cover">
              <img
                v-if="item.product.coverImage"
                :src="item.product.coverImage"
                :alt="getProductTitle(item)"
                class="product-cover-image"
                @error="handleProductImageError"
              />
              <div v-else class="product-cover-placeholder">暂无图片</div>
            </div>

            <div class="order-content">
              <div class="order-top">
                <div>
                  <h3>{{ getProductTitle(item) }}</h3>
                  <p class="order-meta-text">订单号：{{ item.orderNo }}</p>
                </div>
                <span class="product-tag">{{ getOrderStatusText(item.status) }}</span>
              </div>

              <div class="order-info-grid">
                <p>角色：{{ getRoleText(item.role) }}</p>
                <p>价格：￥{{ item.product.price.toFixed(2) }}</p>
                <p>对方：{{ item.partner?.nickname || '校园同学' }}</p>
                <p>校区：{{ getProductCampus(item) }}</p>
              </div>

              <p v-if="item.remark" class="order-remark">备注：{{ item.remark }}</p>

              <div class="order-actions">
                <RouterLink class="secondary-button" :to="`/products/${item.product.id}`">查看商品</RouterLink>
                <button v-if="item.canConfirm" class="primary-button" type="button" @click="handleConfirm(item.id)">
                  确认交易
                </button>
                <button v-if="item.canComplete" class="primary-button" type="button" @click="handleComplete(item.id)">
                  完成交易
                </button>
                <button v-if="item.canCancel" class="ghost-button" type="button" @click="handleCancel(item.id)">
                  取消订单
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="message-empty message-empty-main">
        <p>还没有订单，看到想买的商品后就可以发起购买意向。</p>
        <RouterLink class="primary-button" to="/products">去逛商品</RouterLink>
      </div>
    </section>
  </div>
</template>
