import WebApp from '@twa-dev/sdk'

export const tg = WebApp

export function initTelegram() {
  // Already called in index.html — just sync the SDK
  WebApp.ready()
  WebApp.setHeaderColor('bg_color')
  WebApp.setBackgroundColor('bg_color')
}

export function haptic(type = 'light') {
  WebApp.HapticFeedback.impactOccurred(type)
}

export function hapticNotification(type = 'success') {
  WebApp.HapticFeedback.notificationOccurred(type)
}

export function showMainButton(text, onClick) {
  WebApp.MainButton.setText(text)
  WebApp.MainButton.onClick(onClick)
  WebApp.MainButton.show()
}

export function hideMainButton() {
  WebApp.MainButton.hide()
  WebApp.MainButton.offClick()
}

export function setMainButtonLoading(loading) {
  if (loading) {
    WebApp.MainButton.showProgress()
    WebApp.MainButton.disable()
  } else {
    WebApp.MainButton.hideProgress()
    WebApp.MainButton.enable()
  }
}

export function showBackButton(onClick) {
  WebApp.BackButton.onClick(onClick)
  WebApp.BackButton.show()
}

export function hideBackButton() {
  WebApp.BackButton.hide()
  WebApp.BackButton.offClick()
}

export function getColorScheme() {
  return WebApp.colorScheme // 'light' | 'dark'
}