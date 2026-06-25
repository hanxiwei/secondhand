import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

type UserInfo = {
  id: string
  username: string
  nickname: string
  avatarUrl: string | null
  schoolName: string | null
}

export const TOKEN_KEY = 'campus-second-hand-token'
export const USER_KEY = 'campus-second-hand-user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref<UserInfo | null>(
    localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY) as string) : null,
  )

  const isLoggedIn = computed(() => Boolean(token.value))

  function setAuth(payload: { token: string; userInfo: UserInfo }) {
    token.value = payload.token
    userInfo.value = payload.userInfo
    localStorage.setItem(TOKEN_KEY, payload.token)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.userInfo))
  }

  function setUserInfo(nextUserInfo: UserInfo) {
    userInfo.value = nextUserInfo
    localStorage.setItem(USER_KEY, JSON.stringify(nextUserInfo))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setAuth,
    setUserInfo,
    logout,
  }
})
