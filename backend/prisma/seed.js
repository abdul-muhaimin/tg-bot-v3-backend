const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {

  // ── CONFIGS ──────────────────────────────────────────────
  const configs = [
    { key: 'system_status', value: 'open' },
    { key: 'deposit_enabled', value: 'true' },
    { key: 'withdrawal_enabled', value: 'true' },
    { key: 'recovery_enabled', value: 'true' },
    { key: 'newid_enabled', value: 'true' },
    { key: 'chiptransfer_enabled', value: 'true' },
    { key: 'support_enabled', value: 'true' },
    { key: 'deposit_min', value: '10' },
    { key: 'deposit_max', value: '50000' },
    { key: 'withdrawal_min', value: '20' },
    { key: 'withdrawal_fee_percent', value: '0' },
    { key: 'bot_request_timeout_min', value: '10' },
    { key: 'ocr_enabled', value: 'true' },
    { key: 'app_name', value: 'MyApp' },
    { key: 'support_contact', value: '@admin' },
    { key: 'accepted_currencies', value: JSON.stringify(['MRF', 'USD', 'USDT']) },
  ]

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    })
  }
  console.log('✔ Configs seeded')

  // ── BOT MESSAGES ─────────────────────────────────────────
  const messages = [
    // ── English ──
    { messageKey: 'welcome', language: 'en', content: 'Welcome! Please accept our Terms & Conditions to continue.' },
    { messageKey: 'tnc_text', language: 'en', content: 'By using this service you agree to our terms. Do you accept?' },
    { messageKey: 'tnc_accepted', language: 'en', content: '✅ Thank you! You can now use the service.' },
    { messageKey: 'system_closed', language: 'en', content: '🔴 System is currently closed. Please check back later.' },
    { messageKey: 'session_opened', language: 'en', content: '✅ System is now open!' },
    { messageKey: 'session_closed', language: 'en', content: '🔴 System is now closed.' },
    { messageKey: 'banned', language: 'en', content: '🚫 Your account has been suspended. Please contact support.' },
    { messageKey: 'request_timeout', language: 'en', content: '⏱️ Your request timed out. Please start again.' },
    { messageKey: 'not_eligible', language: 'en', content: '⚠️ You are not eligible for this action. Please make a deposit first.' },
    { messageKey: 'invalid_gameid', language: 'en', content: '❌ That Game ID was not found. Please check and try again.' },
    { messageKey: 'gameid_not_eligible', language: 'en', content: '❌ You are not the current owner of that Game ID.' },

    { messageKey: 'deposit_received', language: 'en', content: '✅ Your deposit request has been received and is being processed.' },
    { messageKey: 'deposit_ocr_success', language: 'en', content: '🔍 Your payment slip has been verified successfully.' },
    { messageKey: 'deposit_ocr_failed', language: 'en', content: '⚠️ We could not verify your slip automatically. An admin will review it manually.' },
    { messageKey: 'deposit_approved', language: 'en', content: '✅ Your deposit of {amount} {currency} for Game ID {gameId} has been approved.' },
    { messageKey: 'deposit_rejected', language: 'en', content: '❌ Your deposit request has been rejected. Reason: {note}' },

    { messageKey: 'withdrawal_received', language: 'en', content: '✅ Your withdrawal request has been received.' },
    { messageKey: 'withdrawal_approved', language: 'en', content: '✅ Your withdrawal request for Game ID {gameId} has been approved.' },
    { messageKey: 'withdrawal_rejected', language: 'en', content: '❌ Your withdrawal request has been rejected. Reason: {note}' },

    { messageKey: 'recovery_received', language: 'en', content: '✅ Your recovery request has been received.' },
    { messageKey: 'recovery_approved', language: 'en', content: '✅ Your recovery request for Game ID {gameId} has been approved.' },
    { messageKey: 'recovery_rejected', language: 'en', content: '❌ Your recovery request has been rejected. Reason: {note}' },

    { messageKey: 'newid_received', language: 'en', content: '✅ Your new ID request has been received.' },
    { messageKey: 'newid_approved', language: 'en', content: '✅ Your new ID request has been approved. Game ID: {gameId} is now active.' },
    { messageKey: 'newid_rejected', language: 'en', content: '❌ Your new ID request has been rejected. Reason: {note}' },

    { messageKey: 'transfer_received', language: 'en', content: '✅ Your chip transfer request has been received.' },
    { messageKey: 'transfer_approved', language: 'en', content: '✅ Your chip transfer of {amount} from {fromGameId} to {toGameId} has been approved.' },
    { messageKey: 'transfer_rejected', language: 'en', content: '❌ Your chip transfer request has been rejected. Reason: {note}' },

    { messageKey: 'ticket_received', language: 'en', content: '✅ Your support ticket has been submitted. We will get back to you shortly.' },

    // ── Dhivehi ──
    { messageKey: 'welcome', language: 'dv', content: 'މަރުހަބާ! ކުރިއަށް ދިއުމަށް ޓާމްސް އެންޑް ކޮންޑިޝަންސް ގަބޫލު ކުރައްވާ.' },
    { messageKey: 'tnc_text', language: 'dv', content: 'މި ޚިދުމަތް ބޭނުންކުރުމުން ޝަރުތުތަކަށް އެއްބަސްވެވެއެވެ. ގަބޫލުކުރައްވާ؟' },
    { messageKey: 'tnc_accepted', language: 'dv', content: '✅ ޝުކުރިއްޔާ! މިހާރު ޚިދުމަތް ބޭނުންކުރެވޭނެ.' },
    { messageKey: 'system_closed', language: 'dv', content: '🔴 ސިސްޓަމް މިވަގުތު ބަންދެ. ފަހުން ބައްލަވާ.' },
    { messageKey: 'session_opened', language: 'dv', content: '✅ ސިސްޓަމް މިހާރު ހުޅުވިއްޖެ!' },
    { messageKey: 'session_closed', language: 'dv', content: '🔴 ސިސްޓަމް މިހާރު ބަންދުވެއްޖެ.' },
    { messageKey: 'banned', language: 'dv', content: '🚫 ތިޔަ އެކައުންޓް ސަސްޕެންޑް ކުރެވިއްޖެ.' },
    { messageKey: 'request_timeout', language: 'dv', content: '⏱️ ރިކުއެސްޓް ތައިމްއައުޓް ވެއްޖެ. އަލުން ފައްޓަވާ.' },
    { messageKey: 'not_eligible', language: 'dv', content: '⚠️ މި އެކްޝަން ތިޔަ ބޭފުުޅަކަށް ލިބިވަޑައިނުގަންނަވާ. ޑިޕޮސިޓެއް ކުރައްވާ.' },
    { messageKey: 'invalid_gameid', language: 'dv', content: '❌ އެ ގޭމް އައިޑީ ނުފެނުނު. ޗެކްކޮށް އަލުން ތަކުރާރު ކުރައްވާ.' },
    { messageKey: 'gameid_not_eligible', language: 'dv', content: '❌ ތިޔަ ގޭމް އައިޑީގެ މިހާރުގެ ވެރިފަރާތަކީ ތިޔަ ބޭފުުޅެއް ނޫން.' },

    { messageKey: 'deposit_received', language: 'dv', content: '✅ ތިޔަ ޑިޕޮސިޓް ރިކުއެސްޓް ލިބިއްޖެ.' },
    { messageKey: 'deposit_approved', language: 'dv', content: '✅ ތިޔަ {amount} {currency} ޑިޕޮސިޓް ގަބޫލު ކުރެވިއްޖެ. ގޭމް އައިޑީ: {gameId}' },
    { messageKey: 'deposit_rejected', language: 'dv', content: '❌ ތިޔަ ޑިޕޮސިޓް ރިޖެކްޓް ކުރެވިއްޖެ. ސަބަބު: {note}' },

    { messageKey: 'withdrawal_received', language: 'dv', content: '✅ ތިޔަ ވިތްޑްރޯ ރިކުއެސްޓް ލިބިއްޖެ.' },
    { messageKey: 'withdrawal_approved', language: 'dv', content: '✅ ތިޔަ ވިތްޑްރޯ ރިކުއެސްޓް ގަބޫލު ކުރެވިއްޖެ. ގޭމް އައިޑީ: {gameId}' },
    { messageKey: 'withdrawal_rejected', language: 'dv', content: '❌ ތިޔަ ވިތްޑްރޯ ރިޖެކްޓް ކުރެވިއްޖެ. ސަބަބު: {note}' },

    { messageKey: 'recovery_received', language: 'dv', content: '✅ ތިޔަ ރިކަވަރީ ރިކުއެސްޓް ލިބިއްޖެ.' },
    { messageKey: 'recovery_approved', language: 'dv', content: '✅ ތިޔަ ރިކަވަރީ ރިކުއެސްޓް ގަބޫލު ކުރެވިއްޖެ. ގޭމް އައިޑީ: {gameId}' },
    { messageKey: 'recovery_rejected', language: 'dv', content: '❌ ތިޔަ ރިކަވަރީ ރިޖެކްޓް ކުރެވިއްޖެ. ސަބަބު: {note}' },

    { messageKey: 'newid_received', language: 'dv', content: '✅ ތިޔަ ނިއު އައިޑީ ރިކުއެސްޓް ލިބިއްޖެ.' },
    { messageKey: 'newid_approved', language: 'dv', content: '✅ ތިޔަ ނިއު އައިޑީ ރިކުއެސްޓް ގަބޫލު ކުރެވިއްޖެ. ގޭމް އައިޑީ: {gameId}' },
    { messageKey: 'newid_rejected', language: 'dv', content: '❌ ތިޔަ ނިއު އައިޑީ ރިޖެކްޓް ކުރެވިއްޖެ. ސަބަބު: {note}' },

    { messageKey: 'transfer_received', language: 'dv', content: '✅ ތިޔަ ޗިޕް ޓްރާންސްފަރ ރިކުއެސްޓް ލިބިއްޖެ.' },
    { messageKey: 'transfer_approved', language: 'dv', content: '✅ {fromGameId} އިން {toGameId} އަށް {amount} ޓްރާންސްފަރ ގަބޫލު ކުރެވިއްޖެ.' },
    { messageKey: 'transfer_rejected', language: 'dv', content: '❌ ތިޔަ ޓްރާންސްފަރ ރިޖެކްޓް ކުރެވިއްޖެ. ސަބަބު: {note}' },

    { messageKey: 'ticket_received', language: 'dv', content: '✅ ތިޔަ ސަޕޯޓް ޓިކެޓް ލިބިއްޖެ. އަވަހަށް ޖަވާބު ދޭނަމެވެ.' },
  ]

  for (const msg of messages) {
    await prisma.botMessage.upsert({
      where: { messageKey_language: { messageKey: msg.messageKey, language: msg.language } },
      update: { content: msg.content },
      create: msg,
    })
  }
  console.log('✔ Bot messages seeded')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())