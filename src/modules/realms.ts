import API from 'decentraland-gatsby/dist/utils/api/API'
import Catalyst, { CommsStatusWithLayers } from 'decentraland-gatsby/dist/utils/api/Catalyst'
import once from 'decentraland-gatsby/dist/utils/function/once'

export const getRealms = once(async () => {
  const servers = await Catalyst.get().getServers()
  return Promise.all(servers
    .map(server => {
      return API.catch(Catalyst.from(server.address).getCommsStatus(true))
    })
  )
    .then(statuses => {
      return statuses.filter(Boolean) as CommsStatusWithLayers[]
    })
})

export type Option = { key: string, value: string, text: string }

export function getRealmsOptions(realms: CommsStatusWithLayers[]): Option[] {
  const result: Option[] = [
    { key: 'default', value: '', text: 'any realm' }
  ]

  const names = new Set<string>()
  if (realms) {
    for (let realm of realms) {
      if (!names.has(realm.name)) {
        names.add(realm.name)
        for (let layer of realm.layers) {
          const value = `${realm.name}-${layer.name}`
          result.push({ key: value, value, text: value })
        }
      }
    }
  }

  return result
}