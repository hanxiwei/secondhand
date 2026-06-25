<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'

import { getMyFavorites, type FavoriteListResponse } from '../api/favorite'
import { deleteProduct, updateProductStatus } from '../api/product'
import {
  getCurrentUser,
  getMyProducts,
  getMySummary,
  updateProfile,
  uploadAvatar,
  type CurrentUserResponse,
  type MyProductsResponse,
  type SummaryResponse,
} from '../api/user'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const hint = ref('正在加载个人中心...')
const user = ref<CurrentUserResponse | null>(null)
const myProducts = ref<MyProductsResponse['list']>([])
const myFavorites = ref<FavoriteListResponse['list']>([])
const summary = ref<SummaryResponse | null>(null)
const actionMessage = ref('')
const saving = ref(false)
const uploadingAvatar = ref(false)
const form = reactive({
  nickname: '',
  phone: '',
  email: '',
  schoolName: '',
  collegeName: '',
  grade: '',
  campus: '',
  contactInfo: '',
  bio: '',
})

function syncForm(currentUser: CurrentUserResponse) {
  form.nickname = currentUser.nickname || ''
  form.phone = currentUser.phone || ''
  form.email = currentUser.email || ''
  form.schoolName = currentUser.schoolName || ''
  form.collegeName = currentUser.collegeName || ''
  form.grade = currentUser.grade || ''
  form.campus = currentUser.campus || ''
  form.contactInfo = currentUser.contactInfo || ''
  form.bio = currentUser.bio || ''
}

function syncAuthUser(currentUser: CurrentUserResponse) {
  authStore.setUserInfo({
    id: currentUser.id,
    username: currentUser.username,
    nickname: currentUser.nickname,
    avatarUrl: currentUser.avatarUrl,
    schoolName: currentUser.schoolName,
  })
}

async function loadProfileData() {
  const [currentUser, myProductData, myFavoriteData, summaryData] = await Promise.all([
    getCurrentUser(),
    getMyProducts(),
    getMyFavorites(),
    getMySummary(),
  ])
  user.value = currentUser
  myProducts.value = myProductData.list
  myFavorites.value = myFavoriteData.list
  summary.value = summaryData
  syncForm(currentUser)
  syncAuthUser(currentUser)
  hint.value = `已加载个人资料、${myProductData.total} 条商品和 ${myFavoriteData.total} 条收藏`
}

onMounted(async () => {
  try {
    await loadProfileData()
  } catch {
    hint.value = '加载失败，请先登录后再查看个人中心'
  } finally {
    loading.value = false
  }
})

function getStatusText(status: number) {
  const map: Record<number, string> = {
    0: '草稿',
    1: '在售中',
    2: '已下架',
    3: '已售出',
  }

  return map[status] ?? '状态未知'
}

async function handleSaveProfile() {
  saving.value = true
  actionMessage.value = ''

  try {
    const result = await updateProfile({
      nickname: form.nickname,
      phone: form.phone,
      email: form.email,
      schoolName: form.schoolName,
      collegeName: form.collegeName,
      grade: form.grade,
      campus: form.campus,
      contactInfo: form.contactInfo,
      bio: form.bio,
    })
    user.value = result.user
    syncForm(result.user)
    syncAuthUser(result.user)
    actionMessage.value = result.message
  } catch {
    actionMessage.value = '资料保存失败，请检查内容后重试'
  } finally {
    saving.value = false
  }
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  uploadingAvatar.value = true
  actionMessage.value = ''

  try {
    const result = await uploadAvatar(file)
    user.value = result.user
    syncForm(result.user)
    syncAuthUser(result.user)
    actionMessage.value = result.message
  } catch {
    actionMessage.value = '头像上传失败，请选择图片后重试'
  } finally {
    uploadingAvatar.value = false
    input.value = ''
  }
}

async function handleToggleStatus(id: string, nextStatus: 0 | 1) {
  try {
    const result = await updateProductStatus(id, nextStatus)
    actionMessage.value = result.message
    await loadProfileData()
  } catch {
    actionMessage.value = '状态更新失败，请稍后再试'
  }
}

async function handleDelete(id: string) {
  const confirmed = window.confirm('确认删除这个商品吗？删除后将无法恢复。')
  if (!confirmed) {
    return
  }

  try {
    const result = await deleteProduct(id)
    actionMessage.value = result.message
    await loadProfileData()
  } catch {
    actionMessage.value = '删除失败，请稍后再试'
  }
}

function handleEdit(id: string) {
  router.push(`/products/${id}/edit`)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="page-shell">
    <section class="panel">
      <div class="panel-header">
        <h2>个人中心</h2>
        <span>{{ loading ? '加载中' : hint }}</span>
      </div>

      <div v-if="user" class="profile-layout">
        <div class="detail-block">
          <h2>个人资料</h2>
          <p v-if="actionMessage" class="form-message">{{ actionMessage }}</p>
          <div class="profile-account-card">
            <div class="profile-avatar-box">
              <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.nickname" class="profile-avatar" />
              <div v-else class="profile-avatar profile-avatar-placeholder">
                {{ user.nickname.slice(0, 1) || '校' }}
              </div>
              <label class="ghost-button profile-avatar-upload">
                {{ uploadingAvatar ? '上传中...' : '更换头像' }}
                <input type="file" accept="image/*" class="visually-hidden" @change="handleAvatarChange" />
              </label>
            </div>

            <div class="profile-account-meta">
              <h3>{{ user.nickname }}</h3>
              <p>用户名：{{ user.username }}</p>
              <p>信誉分：{{ user.creditScore }}</p>
              <p>已发布：{{ summary?.productCount || 0 }} 件</p>
              <p>已收藏：{{ summary?.favoriteCount || 0 }} 件</p>
              <div class="profile-shortcuts">
                <RouterLink class="secondary-button" to="/orders">查看我的订单</RouterLink>
              </div>
            </div>
          </div>

          <form class="profile-edit-form" @submit.prevent="handleSaveProfile">
            <label class="field">
              <span>昵称</span>
              <input v-model="form.nickname" type="text" maxlength="50" placeholder="填写你的昵称" />
            </label>
            <label class="field">
              <span>手机号</span>
              <input v-model="form.phone" type="text" maxlength="20" placeholder="用于联系，可留空" />
            </label>
            <label class="field">
              <span>邮箱</span>
              <input v-model="form.email" type="email" maxlength="100" placeholder="填写常用邮箱" />
            </label>
            <label class="field">
              <span>学校</span>
              <input v-model="form.schoolName" type="text" maxlength="100" placeholder="例如：XX大学" />
            </label>
            <label class="field">
              <span>学院</span>
              <input v-model="form.collegeName" type="text" maxlength="100" placeholder="例如：计算机学院" />
            </label>
            <label class="field">
              <span>年级</span>
              <input v-model="form.grade" type="text" maxlength="20" placeholder="例如：大三" />
            </label>
            <label class="field">
              <span>校区</span>
              <input v-model="form.campus" type="text" maxlength="50" placeholder="例如：主校区" />
            </label>
            <label class="field full">
              <span>联系方式</span>
              <input
                v-model="form.contactInfo"
                type="text"
                maxlength="100"
                placeholder="例如：微信号 / 宿舍楼下自提"
              />
            </label>
            <label class="field full">
              <span>个人简介</span>
              <textarea
                v-model="form.bio"
                rows="4"
                maxlength="255"
                placeholder="简单介绍一下自己和交易偏好"
              ></textarea>
            </label>
            <div class="profile-edit-actions">
              <button class="primary-button" type="submit" :disabled="saving">
                {{ saving ? '保存中...' : '保存资料' }}
              </button>
            </div>
          </form>
        </div>

        <div class="detail-block">
          <h2>我的商品</h2>
          <p v-if="actionMessage" class="form-message">{{ actionMessage }}</p>
          <div class="profile-products">
            <div v-for="item in myProducts" :key="item.id" class="profile-product-card">
              <RouterLink :to="`/products/${item.id}`" class="profile-product-item">
                <strong>{{ item.title }}</strong>
                <span>￥{{ item.price.toFixed(2) }}</span>
              </RouterLink>
              <div class="profile-product-extra">
                <span>{{ getStatusText(item.status) }}</span>
                <span>{{ item.favoriteCount }} 收藏</span>
              </div>
              <div class="profile-product-actions">
                <button class="secondary-button" type="button" @click="handleEdit(item.id)">编辑</button>
                <button
                  class="secondary-button"
                  type="button"
                  @click="handleToggleStatus(item.id, item.status === 1 ? 0 : 1)"
                >
                  {{ item.status === 1 ? '下架' : '重新上架' }}
                </button>
                <button class="ghost-button" type="button" @click="handleDelete(item.id)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-block">
          <h2>我的收藏</h2>
          <div class="profile-products">
            <RouterLink
              v-for="item in myFavorites"
              :key="item.id"
              :to="`/products/${item.id}`"
              class="profile-product-item"
            >
              <strong>{{ item.title }}</strong>
              <span>￥{{ item.price.toFixed(2) }}</span>
            </RouterLink>
          </div>
        </div>

        <div class="detail-block profile-bottom-bar">
          <button class="ghost-button profile-logout-button" type="button" @click="handleLogout">退出登录</button>
        </div>
      </div>
    </section>
  </div>
</template>
