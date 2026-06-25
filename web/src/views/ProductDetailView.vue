<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { addFavorite, getFavoriteStatus, removeFavorite } from '../api/favorite'
import { createMessageSession } from '../api/message'
import { createOrder } from '../api/order'
import { getProductDetail, type ProductDetailResponse } from '../api/product'
import { useAuthStore } from '../stores/auth'
import { handleProductImageError, normalizeProductText } from '../utils/productDisplay'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const hint = ref('正在加载商品详情...')
const product = ref<ProductDetailResponse | null>(null)
const isFavorite = ref(false)
const actionMessage = ref('')
const contactMessage = ref('你好，我对这个商品感兴趣，请问还在吗？')
const activeImage = ref('')
const canFavorite = computed(() => authStore.isLoggedIn)
const isOwnProduct = computed(() => product.value?.seller?.id === authStore.userInfo?.id)
const canCreateOrder = computed(() => authStore.isLoggedIn && !isOwnProduct.value && product.value?.status === 1)
const displayTitle = computed(() =>
  normalizeProductText(product.value?.title, `${product.value?.categoryName || '校园'}闲置好物`),
)
const displayCampus = computed(() => normalizeProductText(product.value?.campus, '校区待定'))
const displayDescription = computed(() =>
  normalizeProductText(product.value?.description, '卖家暂未补充更多描述，可先通过站内私信了解详情。'),
)
const detailNotes = ['支持站内联系', '支持购买意向']
const sellerNickname = computed(() => normalizeProductText(product.value?.seller?.nickname, '校园卖家'))
const sellerSchool = computed(() => normalizeProductText(product.value?.seller?.schoolName, '校园示例大学'))
const sellerCollege = computed(() => normalizeProductText(product.value?.seller?.collegeName, '未填写学院'))
const sellerCampus = computed(() =>
  normalizeProductText(product.value?.seller?.campus || product.value?.campus, displayCampus.value),
)

watch(
  () => product.value?.images,
  (images) => {
    activeImage.value = images?.[0] ?? ''
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    const id = String(route.params.id)
    product.value = await getProductDetail(id)
    hint.value = '商品详情已加载'

    if (authStore.isLoggedIn) {
      const status = await getFavoriteStatus(id)
      isFavorite.value = status.isFavorite
    }
  } catch {
    hint.value = '商品详情加载失败，请确认商品存在'
  } finally {
    loading.value = false
  }
})

async function toggleFavorite() {
  if (!product.value || !authStore.isLoggedIn) {
    actionMessage.value = '请先登录后再收藏商品'
    return
  }

  try {
    if (isFavorite.value) {
      const result = await removeFavorite(product.value.id)
      isFavorite.value = false
      product.value.favoriteCount = Math.max(product.value.favoriteCount - 1, 0)
      actionMessage.value = result.message
    } else {
      const result = await addFavorite(product.value.id)
      isFavorite.value = true
      product.value.favoriteCount += 1
      actionMessage.value = result.message
    }
  } catch {
    actionMessage.value = '收藏操作失败，请稍后再试'
  }
}

async function contactSeller() {
  if (!product.value) {
    return
  }

  if (!authStore.isLoggedIn) {
    await router.push('/login')
    return
  }

  if (isOwnProduct.value) {
    actionMessage.value = '这是你自己发布的商品，不需要发起会话'
    return
  }

  try {
    const result = await createMessageSession({
      productId: Number(product.value.id),
      content: contactMessage.value.trim(),
    })
    actionMessage.value = result.message
    await router.push(`/messages?sessionId=${result.sessionId}`)
  } catch {
    actionMessage.value = '联系卖家失败，请稍后再试'
  }
}

async function createPurchaseIntent() {
  if (!product.value) {
    return
  }

  if (!authStore.isLoggedIn) {
    await router.push('/login')
    return
  }

  if (isOwnProduct.value) {
    actionMessage.value = '这是你自己发布的商品，无法发起购买意向'
    return
  }

  try {
    const result = await createOrder({
      productId: Number(product.value.id),
      remark: contactMessage.value.trim() || undefined,
    })
    actionMessage.value = result.message
    await router.push('/orders')
  } catch {
    actionMessage.value = '购买意向发起失败，请稍后再试'
  }
}

function getTradeMethodText(value: number) {
  const map: Record<number, string> = {
    1: '仅面交',
    2: '仅自提',
    3: '面交或自提',
  }

  return map[value] ?? '待确认'
}

function getProductStatusText(value: number) {
  const map: Record<number, string> = {
    0: '草稿',
    1: '在售',
    2: '已下架',
    3: '已售出',
  }

  return map[value] ?? '未知状态'
}

function selectImage(image: string) {
  activeImage.value = image
}
</script>

<template>
  <div class="page-shell">
    <section v-if="product" class="detail-layout">
      <div class="detail-main">
        <div class="panel detail-gallery-panel">
          <div v-if="product.images.length > 0" class="detail-gallery-shell">
            <div class="detail-gallery-stage">
              <img
                :src="activeImage || product.images[0]"
                :alt="displayTitle"
                class="detail-stage-image"
                @error="handleProductImageError"
              />
            </div>
            <div class="detail-thumb-row">
              <button
                v-for="(image, index) in product.images"
                :key="`${image}-${index}`"
                type="button"
                :class="['detail-thumb', { active: image === (activeImage || product.images[0]) }]"
                @click="selectImage(image)"
              >
                <img :src="image" :alt="`${displayTitle}-${index + 1}`" class="detail-thumb-image" @error="handleProductImageError" />
              </button>
            </div>
          </div>
          <div v-else class="product-cover-placeholder detail-placeholder">暂无商品图片</div>
        </div>

        <div class="panel detail-summary-panel">
          <div class="detail-summary-top">
            <div class="detail-summary-copy">
              <div class="detail-summary-meta">
                <span class="product-tag">{{ product.categoryName }}</span>
                <span class="detail-summary-campus">{{ displayCampus }}</span>
              </div>
              <h1 class="detail-title">{{ displayTitle }}</h1>
            </div>
            <button
              class="detail-star-button"
              type="button"
              :class="{ active: isFavorite }"
              :aria-pressed="isFavorite"
              @click="toggleFavorite"
            >
              <span class="detail-star-icon">{{ isFavorite ? '★' : '☆' }}</span>
              <span>{{ isFavorite ? '已收藏' : '收藏' }}</span>
            </button>
          </div>

          <div class="detail-price-row detail-price-row--hero">
            <strong>￥{{ product.price.toFixed(2) }}</strong>
            <span v-if="product.originalPrice">原价 ￥{{ product.originalPrice.toFixed(2) }}</span>
          </div>

          <div class="detail-inline-data">
            <span>成色 {{ product.conditionLevel }}</span>
            <span>{{ getTradeMethodText(product.tradeMethod) }}</span>
            <span>{{ getProductStatusText(product.status) }}</span>
          </div>

          <div class="detail-stat-row">
            <span>{{ product.viewCount }} 浏览</span>
            <span>{{ product.favoriteCount }} 收藏</span>
            <span>{{ detailNotes[0] }}</span>
          </div>

          <div class="trust-strip trust-strip--compact">
            <span v-for="item in detailNotes" :key="item" class="trust-pill">{{ item }}</span>
          </div>
        </div>

        <div class="panel detail-description-panel">
          <div class="detail-block detail-block--plain">
            <h2>商品描述</h2>
            <p>{{ displayDescription }}</p>
          </div>
        </div>
      </div>

      <aside class="detail-side">
        <div class="panel detail-buy-card">
          <div class="detail-buy-price">
            <strong>￥{{ product.price.toFixed(2) }}</strong>
            <span v-if="product.originalPrice">原价 ￥{{ product.originalPrice.toFixed(2) }}</span>
          </div>
          <div class="detail-buy-meta">
            <span>{{ displayCampus }}</span>
            <span>{{ getTradeMethodText(product.tradeMethod) }}</span>
            <span>{{ product.favoriteCount }} 人想要</span>
          </div>
          <textarea
            v-model="contactMessage"
            rows="4"
            class="detail-contact-textarea"
            placeholder="先和卖家打个招呼吧"
          ></textarea>
          <button class="primary-button detail-action detail-action--strong" type="button" @click="contactSeller">
            {{ isOwnProduct ? '这是我发布的商品' : '联系卖家' }}
          </button>
          <button class="secondary-button detail-action" type="button" @click="createPurchaseIntent">
            {{ canCreateOrder ? '发起购买意向' : isOwnProduct ? '这是我发布的商品' : '当前不可下单' }}
          </button>
          <button class="detail-collect-row" type="button" @click="toggleFavorite">
            <span class="detail-collect-star" :class="{ active: isFavorite }">{{ isFavorite ? '★' : '☆' }}</span>
            <span>{{ canFavorite ? (isFavorite ? '取消收藏' : '收藏商品') : '登录后可收藏' }}</span>
          </button>
          <p v-if="actionMessage" class="detail-tip">{{ actionMessage }}</p>
        </div>

        <div class="panel detail-side-card">
          <div class="detail-block detail-block--plain">
            <h2>卖家信息</h2>
            <div class="detail-seller-card">
              <div class="detail-seller-avatar">{{ sellerNickname.slice(0, 1) }}</div>
              <div class="detail-seller-copy">
                <strong>{{ sellerNickname }}</strong>
                <span>{{ sellerSchool }}</span>
              </div>
            </div>
            <div class="detail-seller-grid">
              <p><span>学院</span><strong>{{ sellerCollege }}</strong></p>
              <p><span>校区</span><strong>{{ sellerCampus }}</strong></p>
              <p><span>联系</span><strong>{{ product.contactInfo || '站内私信' }}</strong></p>
              <p><span>状态</span><strong>{{ getProductStatusText(product.status) }}</strong></p>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <section v-else class="panel">
      <div class="panel-header">
        <h2>商品详情</h2>
        <span>{{ loading ? '加载中' : hint }}</span>
      </div>
    </section>
  </div>
</template>
