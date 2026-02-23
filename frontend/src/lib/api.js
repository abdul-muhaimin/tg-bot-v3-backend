import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

api.interceptors.request.use(config => {
  const initData = window.Telegram?.WebApp?.initData

  // Dev bypass — only in development when no Telegram context
  if (!initData && import.meta.env.DEV) {
    config.headers['x-init-data'] = import.meta.env.VITE_DEV_INIT_DATA || 'dev'
    return config
  }

  if (initData) {
    config.headers['x-init-data'] = initData
  }

  return config
})

export default api