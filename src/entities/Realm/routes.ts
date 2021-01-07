import cache from 'apicache'
import routes, { single } from "decentraland-gatsby/dist/entities/Route/routes";
import Catalyst from 'decentraland-gatsby/dist/utils/api/Catalyst';
import { Realm } from './types';
import API from 'decentraland-gatsby/dist/utils/api/API';

export default routes((router) => {
  router.get('/realms', cache.middleware('1 hour'), single(getRealms))
})

export async function getRealms(): Promise<Realm[]> {
  const servers = await Catalyst.get().getServers();

  const comms = await Promise.all(servers.map(async server => {
    const comm = await API.catch(Catalyst.from(server.address).getStatus(true))
    return [ server, comm ] as const
  }))

  return comms
    .filter(([_server, comm]) => !!comm)
    .map(([server, comm]) =>  ({
      id: comm!.name,
      url: server.address,
      layers: comm!.layers.map(layer => layer.name)
    }))
    .sort((reamlA, realmB) => reamlA.id.localeCompare(realmB.id))
}
