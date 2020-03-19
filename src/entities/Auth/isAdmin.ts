import env from 'decentraland-gatsby/dist/utils/env'
import { Address } from 'web3x/address'

const adminAddresses = new Set((env('ADMIN_ADDRESSES', '') || '')
  .split(',')
  .filter(Address.isAddress)
  .map(address => address.toLowerCase()))

export default function isAdmin(user: string) {
  return adminAddresses.has(user)
}