import api from '../lib/api'

export function useConfirmNotify() {
  async function notify(type, data) {
    try {
      await api.post('/notify/confirm', { type, data })
    } catch {
      // Silent fail — notification is best-effort, never blocks UX
    }
  }
  return notify
}