const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const accounts = [
    {
      currency: 'MRF',
      type: 'bank',
      label: 'Bank of Maldives',
      accountNumber: '7700123456',
      accountName: 'Company Name',
      walletAddress: null,
      isActive: true,
    },
    {
      currency: 'MRF',
      type: 'bank',
      label: 'Maldives Islamic Bank',
      accountNumber: '1234567890',
      accountName: 'Company Name',
      walletAddress: null,
      isActive: true,
    },
    {
      currency: 'USD',
      type: 'bank',
      label: 'USD Bank Account',
      accountNumber: '9876543210',
      accountName: 'Company Name',
      walletAddress: null,
      isActive: true,
    },
    {
      currency: 'USDT',
      type: 'wallet',
      label: 'USDT TRC20',
      accountNumber: null,
      accountName: null,
      walletAddress: 'TYourTRC20WalletAddressHere',
      isActive: true,
    },
    {
      currency: 'USDT',
      type: 'wallet',
      label: 'USDT ERC20',
      accountNumber: null,
      accountName: null,
      walletAddress: '0xYourERC20WalletAddressHere',
      isActive: true,
    },
  ]

  for (const account of accounts) {
    await prisma.paymentAccount.create({ data: account })
  }

  console.log('✔ Payment accounts seeded')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())