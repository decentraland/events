import fetch from 'isomorphic-fetch'
import cache from 'apicache'
import routes from "decentraland-gatsby/dist/entities/Route/routes";
import handle from 'decentraland-gatsby/dist/entities/Route/handle';
import { Configuration, CommStatus, Realm } from './types';

const CONFIGURATION_ENDPOINT = 'https://explorer-config.decentraland.org/configuration.json'

export default routes((router) => {
  router.get('/realms', cache.middleware('1 hour'), handle(getRealms))
})

export async function getRealms(): Promise<Realm[]> {
  const config: Configuration = await fetch(CONFIGURATION_ENDPOINT).then((response) => response.json())
  const comms: CommStatus[] = await Promise.all(
    config
      .servers.contentWhitelist
      .map(url => fetch(url + '/comms/status?includeLayers=true').then((response) => response.json()))
  )

  return comms.map((comm, i) => {
    return {
      id: comm.name,
      url: config.servers.contentWhitelist[i],
      layers: comm.layers.map(layer => layer.name)
    }
  })
}