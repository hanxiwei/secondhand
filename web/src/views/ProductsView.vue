<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'

import { addFavorite, getMyFavorites, removeFavorite } from '../api/favorite'
import { getCategoryTree } from '../api/category'
import { getProductList, type ProductListItem } from '../api/product'
import { useAuthStore } from '../stores/auth'
import { handleProductImageError, normalizeProductText } from '../utils/productDisplay'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(true)
const hint = ref('正在加载商品...')
const products = ref<ProductListItem[]>([])
const categories = ref<Array<{ id: string; name: string }>>([])
const favoriteIds = ref<string[]>([])
const actionMessage = ref('')
const filters = reactive({
  keyword: '',
  categoryId: '',
  campus: '',
})

async function loadProducts() {
  loading.value = true

  try {
    const response = await getProductList({
      keyword: filters.keyword || undefined,
      categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
      campus: filters.campus || undefined,
    })
    products.value = response.list
    hint.value = response.total > 0 ? `共加载 ${response.total} 条商品` : '当前还没有商品数据'

    if (authStore.isLoggedIn) {
      await loadFavoriteIds()
    }
  } catch {
    hint.value = '商品加载失败，请确认后端服务已启动'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const tree = await getCategoryTree()
    categories.value = tree.map((item) => ({ id: item.id, name: item.name }))
  } catch {
    categories.value = []
  }

  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.categoryId = typeof route.query.categoryId === 'string' ? route.query.categoryId : ''
  filters.campus = typeof route.query.campus === 'string' ? route.query.campus : ''

  await loadProducts()
})

async function loadFavoriteIds() {
  try {
    const response = await getMyFavorites()
    favoriteIds.value = response.list.map((item) => item.id)
  } catch {
    favoriteIds.value = []
  }
}

function isFavorite(productId: string) {
  return favoriteIds.value.includes(productId)
}

async function toggleFavorite(item: ProductListItem) {
  actionMessage.value = ''

  if (!authStore.isLoggedIn) {
    await router.push('/login')
    return
  }

  try {
    if (isFavorite(item.id)) {
      const result = await removeFavorite(item.id)
      favoriteIds.value = favoriteIds.value.filter((id) => id !== item.id)
      item.favoriteCount = Math.max(item.favoriteCount - 1, 0)
      actionMessage.value = `${item.title}：${result.message}`
      return
    }

    const result = await addFavorite(item.id)
    favoriteIds.value = [...favoriteIds.value, item.id]
    item.favoriteCount += 1
    actionMessage.value = `${item.title}：${result.message}`
  } catch {
    actionMessage.value = '收藏操作失败，请稍后再试'
  }
}

function getProductTitle(item: ProductListItem) {
  return normalizeProductText(item.title, `${item.categoryName}闲置好物`)
}

function getProductCampus(item: ProductListItem) {
  return normalizeProductText(item.campus, '校区待定')
}
</script>

<template>
  <div class="page-shell">
    <section class="panel panel--floating panel--compact">
      <div class="panel-header">
        <div>
          <h2>全部商品</h2>
          <span>{{ loading ? '加载中' : hint }}</span>
        </div>
        <RouterLink class="panel-link" :to="authStore.isLoggedIn ? '/publish' : '/login'">
          {{ authStore.isLoggedIn ? '发布闲置' : '登录后发布' }}
        </RouterLink>
      </div>
      <form class="filter-bar filter-bar--elevated" @submit.prevent="loadProducts">
        <label class="filter-field">
          <span>关键词</span>
          <input v-model="filters.keyword" type="text" placeholder="输入商品名称、品牌或型号" />
        </label>
        <label class="filter-field">
          <span>分类</span>
          <select v-model="filters.categoryId">
            <option value="">全部分类</option>
            <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option>
          </select>
        </label>
        <label class="filter-field">
          <span>校区</span>
          <input v-model="filters.campus" type="text" placeholder="例如主校区 / 东校区" />
        </label>
        <div class="filter-actions">
          <button class="primary-button" type="submit">搜索</button>
        </div>
      </form>
      <p v-if="actionMessage" class="form-message">{{ actionMessage }}</p>
      <div v-if="products.length > 0" class="product-grid">
        <article
          v-for="item in products"
          :key="item.id"
          class="product-card product-card--list product-card--clickable"
          @click="router.push(`/products/${item.id}`)"
        >
          <div class="product-top">
            <span class="product-tag">{{ item.categoryName }}</span>
            <span class="product-campus">{{ getProductCampus(item) }}</span>
          </div>
          <div class="product-cover">
            <img
              v-if="item.coverImage"
              :src="item.coverImage"
              :alt="getProductTitle(item)"
              class="product-cover-image"
              @error="handleProductImageError"
            />
            <div v-else class="product-cover-placeholder">暂无图片</div>
          </div>
          <div class="product-body">
            <h3>{{ getProductTitle(item) }}</h3>
          </div>
          <div class="product-price-row">
            <strong>￥{{ item.price.toFixed(2) }}</strong>
            <span v-if="item.originalPrice">原价 ￥{{ item.originalPrice.toFixed(2) }}</span>
          </div>
          <div class="product-meta">
            <span>成色 {{ item.conditionLevel }}</span>
            <span>{{ item.viewCount }} 浏览</span>
            <span>{{ item.favoriteCount }} 收藏</span>
          </div>
          <div class="product-card__footer">
            <button class="ghost-button product-action" type="button" @click.stop="toggleFavorite(item)">
              {{ authStore.isLoggedIn ? (isFavorite(item.id) ? '取消收藏' : '收藏商品') : '登录后收藏' }}
            </button>
          </div>
        </article>
      </div>
      <div v-else class="message-empty message-empty-main products-empty">
        <p>暂时没有符合条件的商品，换个关键词或校区再试试。</p>
        <button class="primary-button" type="button" @click="loadProducts">重新加载</button>
      </div>
    </section>
  </div>
</template>
