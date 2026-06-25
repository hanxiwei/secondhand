<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { getCategoryTree } from '../api/category'
import { getProductList, type ProductListItem } from '../api/product'
import { useAuthStore } from '../stores/auth'
import { handleProductImageError, normalizeProductText } from '../utils/productDisplay'

const router = useRouter()
const authStore = useAuthStore()
const searchKeyword = ref('')
const categories = ref<Array<{ id: string; name: string; children: Array<{ id: string; name: string }> }>>([])
const products = ref<ProductListItem[]>([])

const recommendedProducts = computed(() => products.value.slice(0, 4))
const latestProducts = computed(() => products.value.slice(0, 8))
const categoryProductCountMap = computed(() => {
  const countMap = new Map<string, number>()

  products.value.forEach((item) => {
    const categoryName = normalizeProductText(item.categoryName, '未分类')
    countMap.set(categoryName, (countMap.get(categoryName) ?? 0) + 1)
  })

  return countMap
})

const quickCategories = computed(() =>
  categories.value.slice(0, 8).map((item) => ({
    ...item,
    productCount: categoryProductCountMap.value.get(item.name) ?? 0,
  })),
)

function goToProducts(keyword?: string) {
  const nextKeyword = (keyword ?? searchKeyword.value).trim()

  router.push({
    path: '/products',
    query: nextKeyword ? { keyword: nextKeyword } : undefined,
  })
}

function getProductTitle(item: ProductListItem) {
  return normalizeProductText(item.title, `${item.categoryName}闲置好物`)
}

function getProductCampus(item: ProductListItem) {
  return normalizeProductText(item.campus, '校区待定')
}

onMounted(async () => {
  try {
    const [categoryTree, productList] = await Promise.all([getCategoryTree(), getProductList()])
    categories.value = categoryTree
    products.value = productList.list
  } catch {}
})
</script>

<template>
  <div class="page-shell">
    <header class="home-hero">
      <div class="home-hero__main">
        <form class="hero-search" @submit.prevent="goToProducts()">
          <input v-model="searchKeyword" type="text" placeholder="搜索教材、耳机、台灯、滑板车..." />
          <button class="primary-button" type="submit">搜索</button>
        </form>
        <div class="hero-actions">
          <RouterLink class="primary-button" to="/products">全部商品</RouterLink>
          <RouterLink class="secondary-button" :to="authStore.isLoggedIn ? '/publish' : '/login'">
            发布闲置
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="content-grid">
      <section class="panel panel--floating panel--compact">
        <div class="panel-header">
          <div>
            <h2>分类</h2>
          </div>
          <RouterLink class="panel-link" to="/products">全部</RouterLink>
        </div>
        <div class="home-category-strip">
          <RouterLink
            v-for="item in quickCategories"
            :key="item.id"
            class="home-category-pill"
            :to="`/products?categoryId=${item.id}`"
          >
            <strong>{{ item.name }}</strong>
            <span>{{ item.productCount }} 件</span>
          </RouterLink>
        </div>
      </section>

      <section class="panel panel--floating panel--compact">
        <div class="panel-header">
          <div>
            <h2>推荐</h2>
          </div>
          <RouterLink class="panel-link" to="/products">更多</RouterLink>
        </div>
        <div class="product-grid">
          <article
            v-for="item in recommendedProducts"
            :key="item.id"
            class="product-card product-card--featured product-card--clickable"
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
              <span>{{ item.favoriteCount }} 收藏</span>
              <span>{{ item.viewCount }} 浏览</span>
            </div>
          </article>
        </div>
      </section>

      <section class="panel panel--floating panel--compact">
        <div class="panel-header">
          <div>
            <h2>最新上架</h2>
          </div>
          <RouterLink class="panel-link" to="/products">更多</RouterLink>
        </div>
        <div class="product-grid">
          <article
            v-for="item in latestProducts"
            :key="item.id"
            class="product-card product-card--clickable"
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
          </article>
        </div>
      </section>
    </main>
  </div>
</template>
