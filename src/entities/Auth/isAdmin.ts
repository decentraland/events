import env from 'decentraland-gatsby/dist/utils/env'
import isEthereumAddress from 'validator/lib/isEthereumAddress'

const adminAddresses = new Set((env('ADMIN_ADDRESSES', '') || '')
  .split(',')
  .filter(isEthereumAddress)
  .map(address => address.toLowerCase()))

adminAddresses.forEach(address => console.log('admin address: ', address))

export default function isAdmin(user?: string | null | undefined) {
  if (!user) {
    return false
  }

  return adminAddresses.has(user)
}