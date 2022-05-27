import API from "decentraland-gatsby/dist/utils/api/API"
import Catalyst, {
  CommsStatus,
} from "decentraland-gatsby/dist/utils/api/Catalyst"
import once from "decentraland-gatsby/dist/utils/function/once"

export const getServers = once(async () => {
  const servers = await Catalyst.get().getServers()
  return Promise.all(
    servers.map((server) => {
      return API.catch(Catalyst.from(server.baseUrl).getCommsStatus())
    })
  )
})

export type Option = { key: string; value: string; text: string }

// TODO: replace with `loadash.uniqBy `
export function getServerOptions(
  servers: (CommsStatus | null)[] | null
): Option[] {
  const result: Option[] = [{ key: "default", value: "", text: "any server" }]

  const names = new Set<string>()
  if (servers) {
    for (let server of servers) {
      if (server && !names.has(server.name)) {
        names.add(server.name)
        result.push({ key: server.name, value: server.name, text: server.name })
      }
    }
  }

  return result
}
