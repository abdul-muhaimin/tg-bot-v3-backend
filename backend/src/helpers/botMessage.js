const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function getBotMessage(messageKey, language = 'en', replacements = {}) {
  const msg = await prisma.botMessage.findUnique({
    where: { messageKey_language: { messageKey, language } }
  })

  if (!msg) {
    // fallback to english
    const fallback = await prisma.botMessage.findUnique({
      where: { messageKey_language: { messageKey, language: 'en' } }
    })
    if (!fallback) return `[${messageKey}]`
    let text = fallback.content
    for (const [key, val] of Object.entries(replacements)) {
      text = text.replaceAll(`{${key}}`, val)
    }
    return text
  }

  let text = msg.content
  for (const [key, val] of Object.entries(replacements)) {
    text = text.replaceAll(`{${key}}`, val)
  }
  return text
}

module.exports = { getBotMessage }