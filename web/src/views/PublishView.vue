<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getCategoryTree } from '../api/category'
import { createProduct, getManageProduct, updateProduct, uploadProductImages } from '../api/product'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const MAX_IMAGE_COUNT = 5
const categories = ref<Array<{ id: string; name: string }>>([])
const loading = ref(false)
const pageLoading = ref(true)
const uploading = ref(false)
const message = ref('填写后即可发布到数据库。')
const isError = ref(false)
const isEditMode = computed(() => Boolean(route.params.id))
const fileInputRef = ref<HTMLInputElement | null>(null)

type FieldName =
  | 'categoryId'
  | 'title'
  | 'description'
  | 'price'
  | 'originalPrice'
  | 'conditionLevel'
  | 'campus'
  | 'tradeMethod'
  | 'contactInfo'
  | 'imageUrls'

const form = reactive({
  categoryId: 1,
  title: '',
  subtitle: '',
  description: '',
  price: 0,
  originalPrice: 0,
  conditionLevel: 3,
  campus: '主校区',
  tradeMethod: 1,
  contactInfo: '站内私信',
  imageUrls: [] as string[],
})

const fieldErrors = reactive<Record<FieldName, string>>({
  categoryId: '',
  title: '',
  description: '',
  price: '',
  originalPrice: '',
  conditionLevel: '',
  campus: '',
  tradeMethod: '',
  contactInfo: '',
  imageUrls: '',
})

const validationOrder: FieldName[] = [
  'categoryId',
  'title',
  'price',
  'originalPrice',
  'conditionLevel',
  'campus',
  'tradeMethod',
  'contactInfo',
  'description',
  'imageUrls',
]

function setFieldError(field: FieldName, message: string) {
  fieldErrors[field] = message
}

function clearFieldError(field: FieldName) {
  fieldErrors[field] = ''
}

function validateField(field: FieldName) {
  clearFieldError(field)

  switch (field) {
    case 'categoryId':
      if (!Number.isInteger(Number(form.categoryId)) || Number(form.categoryId) < 1) {
        setFieldError(field, '请选择正确的商品分类')
      }
      break
    case 'title':
      if (!form.title.trim()) {
        setFieldError(field, '请填写商品标题')
      } else if (form.title.trim().length > 120) {
        setFieldError(field, '商品标题不能超过 120 个字')
      }
      break
    case 'description':
      if (!form.description.trim()) {
        setFieldError(field, '请填写商品描述')
      }
      break
    case 'price':
      if (Number.isNaN(Number(form.price)) || Number(form.price) < 0.01) {
        setFieldError(field, '价格必须大于 0.01')
      }
      break
    case 'originalPrice':
      if (Number.isNaN(Number(form.originalPrice)) || Number(form.originalPrice) < 0) {
        setFieldError(field, '原价不能小于 0')
      }
      break
    case 'conditionLevel':
      if (!Number.isInteger(Number(form.conditionLevel)) || Number(form.conditionLevel) < 1 || Number(form.conditionLevel) > 5) {
        setFieldError(field, '请选择正确的成色')
      }
      break
    case 'campus':
      if (form.campus.trim().length > 50) {
        setFieldError(field, '校区名称不能超过 50 个字')
      }
      break
    case 'tradeMethod':
      if (!Number.isInteger(Number(form.tradeMethod)) || Number(form.tradeMethod) < 1 || Number(form.tradeMethod) > 3) {
        setFieldError(field, '请选择正确的交易方式')
      }
      break
    case 'contactInfo':
      if (form.contactInfo.trim().length > 100) {
        setFieldError(field, '联系方式不能超过 100 个字')
      }
      break
    case 'imageUrls':
      if (form.imageUrls.length > MAX_IMAGE_COUNT) {
        setFieldError(field, `最多只能上传 ${MAX_IMAGE_COUNT} 张图片`)
      }
      break
  }

  return !fieldErrors[field]
}

function validateForm() {
  let firstInvalidField: FieldName | null = null

  validationOrder.forEach((field) => {
    const isValid = validateField(field)

    if (!isValid && !firstInvalidField) {
      firstInvalidField = field
    }
  })

  return firstInvalidField
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    await router.replace('/login')
    return
  }

  try {
    const tree = await getCategoryTree()
    categories.value = tree.map((item) => ({ id: item.id, name: item.name }))

    if (categories.value.length > 0 && !isEditMode.value) {
      form.categoryId = Number(categories.value[0].id)
    }

    if (isEditMode.value) {
      const product = await getManageProduct(String(route.params.id))
      form.categoryId = product.categoryId
      form.title = product.title
      form.subtitle = product.subtitle || ''
      form.description = product.description
      form.price = product.price
      form.originalPrice = product.originalPrice || 0
      form.conditionLevel = product.conditionLevel
      form.campus = product.campus || '主校区'
      form.tradeMethod = product.tradeMethod
      form.contactInfo = product.contactInfo || '站内私信'
      form.imageUrls = [...product.imageUrls]
      message.value = '可直接修改商品信息并保存。'
    }
  } catch {
    message.value = isEditMode.value ? '商品加载失败，无法进入编辑。' : '分类加载失败，请稍后再试。'
    isError.value = true
  } finally {
    pageLoading.value = false
  }
})

function openFilePicker() {
  fileInputRef.value?.click()
}

async function handleSelectImages(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])

  if (files.length === 0) {
    return
  }

  const remainingCount = MAX_IMAGE_COUNT - form.imageUrls.length

  if (remainingCount <= 0) {
    setFieldError('imageUrls', `最多只能上传 ${MAX_IMAGE_COUNT} 张图片`)
    message.value = `最多只能上传 ${MAX_IMAGE_COUNT} 张图片`
    isError.value = true
    target.value = ''
    return
  }

  const uploadFiles = files.slice(0, remainingCount)

  uploading.value = true
  isError.value = false

  try {
    const result = await uploadProductImages(uploadFiles)
    form.imageUrls.push(...result.urls)
    validateField('imageUrls')
    message.value =
      files.length > remainingCount
        ? `已上传 ${uploadFiles.length} 张图片，最多保留 ${MAX_IMAGE_COUNT} 张`
        : `已上传 ${uploadFiles.length} 张图片`
  } catch {
    message.value = '图片上传失败，请确认后端服务已启动且图片大小不超过 5MB'
    isError.value = true
  } finally {
    uploading.value = false
    target.value = ''
  }
}

function removeImage(index: number) {
  form.imageUrls.splice(index, 1)
  validateField('imageUrls')
  message.value = '已移除这张图片'
  isError.value = false
}

async function handleSubmit() {
  const firstInvalidField = validateForm()

  if (firstInvalidField) {
    message.value = '请先修改标红的内容'
    isError.value = true
    return
  }

  loading.value = true
  isError.value = false

  try {
    const payload = {
      categoryId: form.categoryId,
      title: form.title,
      subtitle: form.subtitle || undefined,
      description: form.description,
      price: Number(form.price),
      originalPrice: form.originalPrice > 0 ? Number(form.originalPrice) : undefined,
      conditionLevel: Number(form.conditionLevel),
      campus: form.campus,
      tradeMethod: Number(form.tradeMethod),
      contactInfo: form.contactInfo,
      imageUrls: form.imageUrls,
    }

    const result = isEditMode.value
      ? await updateProduct(String(route.params.id), payload)
      : await createProduct(payload)

    message.value = result.message
    await router.push(`/products/${result.id}`)
  } catch (error: any) {
    const serverMessage = error?.response?.data?.message
    message.value = isEditMode.value
      ? typeof serverMessage === 'string' && serverMessage
        ? serverMessage
        : '保存失败，请检查标红的内容后重试'
      : typeof serverMessage === 'string' && serverMessage
        ? serverMessage
        : '发布失败，请检查标红的内容'
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
        <h2>{{ isEditMode ? '编辑商品' : '发布商品' }}</h2>
        <span>{{ pageLoading ? '加载中' : `当前登录账号：${authStore.userInfo?.nickname || '未登录'}` }}</span>
      </div>

      <form v-if="!pageLoading" class="publish-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span>商品标题</span>
          <input
            v-model="form.title"
            :class="{ 'field-control--invalid': fieldErrors.title }"
            type="text"
            placeholder="例如：九成新显示器"
            @blur="validateField('title')"
            @input="validateField('title')"
          />
          <small v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</small>
        </label>

        <label class="field">
          <span>商品副标题</span>
          <input v-model="form.subtitle" type="text" placeholder="例如：宿舍搬走低价出" />
        </label>

        <label class="field">
          <span>商品分类</span>
          <select
            v-model="form.categoryId"
            :class="{ 'field-control--invalid': fieldErrors.categoryId }"
            @change="validateField('categoryId')"
          >
            <option v-for="item in categories" :key="item.id" :value="Number(item.id)">
              {{ item.name }}
            </option>
          </select>
          <small v-if="fieldErrors.categoryId" class="field-error">{{ fieldErrors.categoryId }}</small>
        </label>

        <label class="field">
          <span>价格</span>
          <input
            v-model="form.price"
            :class="{ 'field-control--invalid': fieldErrors.price }"
            type="number"
            min="0.01"
            step="0.01"
            @blur="validateField('price')"
            @input="validateField('price')"
          />
          <small v-if="fieldErrors.price" class="field-error">{{ fieldErrors.price }}</small>
        </label>

        <label class="field">
          <span>原价</span>
          <input
            v-model="form.originalPrice"
            :class="{ 'field-control--invalid': fieldErrors.originalPrice }"
            type="number"
            min="0"
            step="0.01"
            @blur="validateField('originalPrice')"
            @input="validateField('originalPrice')"
          />
          <small v-if="fieldErrors.originalPrice" class="field-error">{{ fieldErrors.originalPrice }}</small>
        </label>

        <label class="field">
          <span>成色</span>
          <select
            v-model="form.conditionLevel"
            :class="{ 'field-control--invalid': fieldErrors.conditionLevel }"
            @change="validateField('conditionLevel')"
          >
            <option :value="1">1 全新</option>
            <option :value="2">2 九五新</option>
            <option :value="3">3 九成新</option>
            <option :value="4">4 八成新</option>
            <option :value="5">5 其他</option>
          </select>
          <small v-if="fieldErrors.conditionLevel" class="field-error">{{ fieldErrors.conditionLevel }}</small>
        </label>

        <label class="field">
          <span>校区</span>
          <input
            v-model="form.campus"
            :class="{ 'field-control--invalid': fieldErrors.campus }"
            type="text"
            placeholder="例如：主校区"
            @blur="validateField('campus')"
            @input="validateField('campus')"
          />
          <small v-if="fieldErrors.campus" class="field-error">{{ fieldErrors.campus }}</small>
        </label>

        <label class="field">
          <span>交易方式</span>
          <select
            v-model="form.tradeMethod"
            :class="{ 'field-control--invalid': fieldErrors.tradeMethod }"
            @change="validateField('tradeMethod')"
          >
            <option :value="1">1 仅面交</option>
            <option :value="2">2 仅自提</option>
            <option :value="3">3 面交或自提</option>
          </select>
          <small v-if="fieldErrors.tradeMethod" class="field-error">{{ fieldErrors.tradeMethod }}</small>
        </label>

        <label class="field full">
          <span>联系方式</span>
          <input
            v-model="form.contactInfo"
            :class="{ 'field-control--invalid': fieldErrors.contactInfo }"
            type="text"
            placeholder="例如：站内私信 / 微信"
            @blur="validateField('contactInfo')"
            @input="validateField('contactInfo')"
          />
          <small v-if="fieldErrors.contactInfo" class="field-error">{{ fieldErrors.contactInfo }}</small>
        </label>

        <label class="field full">
          <span>商品描述</span>
          <textarea
            v-model="form.description"
            :class="{ 'field-control--invalid': fieldErrors.description }"
            rows="6"
            placeholder="请写清楚商品情况、使用时长、交易方式等"
            @blur="validateField('description')"
            @input="validateField('description')"
          ></textarea>
          <small v-if="fieldErrors.description" class="field-error">{{ fieldErrors.description }}</small>
        </label>

        <label class="field full">
          <span>商品图片</span>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            class="upload-input-hidden"
            @change="handleSelectImages"
          />
          <div class="upload-panel">
            <button
              class="secondary-button"
              type="button"
              :disabled="uploading || form.imageUrls.length >= MAX_IMAGE_COUNT"
              @click="openFilePicker"
            >
              {{ uploading ? '上传中...' : '选择图片上传' }}
            </button>
            <span class="upload-tip">最多 5 张，单张不超过 5MB</span>
          </div>
          <div v-if="form.imageUrls.length > 0" class="upload-preview-grid">
            <div v-for="(imageUrl, index) in form.imageUrls" :key="`${imageUrl}-${index}`" class="upload-preview-card">
              <img :src="imageUrl" :alt="`商品图片 ${index + 1}`" class="upload-preview-image" />
              <button class="ghost-button upload-remove-button" type="button" @click="removeImage(index)">
                删除
              </button>
            </div>
          </div>
          <p v-else class="upload-empty">暂未上传图片，建议至少上传 1 张主图。</p>
          <small v-if="fieldErrors.imageUrls" class="field-error">{{ fieldErrors.imageUrls }}</small>
        </label>

        <p :class="['form-message', { error: isError }]">{{ message }}</p>
        <button class="primary-button" type="submit" :disabled="loading">
          {{
            loading
              ? isEditMode
                ? '保存中...'
                : '发布中...'
              : isEditMode
                ? '保存修改'
                : '立即发布'
          }}
        </button>
      </form>
      <p v-else :class="['form-message', { error: isError }]">{{ message }}</p>
    </section>
  </div>
</template>
