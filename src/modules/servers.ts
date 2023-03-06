import API from "decentraland-gatsby/dist/utils/api/API"
import Catalyst from "decentraland-gatsby/dist/utils/api/Catalyst"
import { CatalystAbout } from "decentraland-gatsby/dist/utils/api/Catalyst.types"
import once from "decentraland-gatsby/dist/utils/function/once"
import { memo } from "radash/dist/curry"

export const getServers = memo(async () => {
  const servers = await Catalyst.getInstance().getServers()
  return Promise.all(
    servers.map((server) => {
      return API.catch(Catalyst.getInstanceFrom(server.baseUrl).getAbout())
    })
  )
})

export type Option = { key: string; value: string; text: string }

// TODO: replace with `loadash.uniqBy `
export function getServerOptions(
  servers: (CatalystAbout | null)[] | null
): Option[] {
  const result: Option[] = [{ key: "default", value: "", text: "any server" }]

  const names = new Set<string>()
  if (servers) {
    for (const server of servers) {
      if (
        server &&
        server?.configurations?.realmName &&
        !names.has(server.configurations.realmName)
      ) {
        const name = server.configurations.realmName
        names.add(name)
        result.push({ key: name, value: name, text: name })
      }
    }
  }

  return result
}
