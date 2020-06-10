import fetch from 'isomorphic-fetch'
import cache from 'apicache'
import routes from "decentraland-gatsby/dist/entities/Route/routes";
import handle from 'decentraland-gatsby/dist/entities/Route/handle';
import { parse } from 'url'
import { Address } from 'web3x/address';
import { Eth } from 'web3x/eth';
import { HttpProvider, WebsocketProvider } from 'web3x/providers';
import { Contract } from 'web3x/contract';
import { CommStatus, Realm, CatalystNode } from './types';
import dao from '../Contracts/DAO/CatalystAbi'

const CONFIGURATION_ENDPOINT = 'https://explorer-config.decentraland.org/configuration.json'
const CATALYST_CONTRACT_ADDRESS = '0x4a2f10076101650f40342885b99b6b101d83c486'
const ETHEREUM_ENDPOINT = `wss://mainnet.infura.io/ws/v3/1da6448958b2444f956aed19030a53e7`

export default routes((router) => {
  router.get('/realms', cache.middleware('1 hour'), handle(getRealms))
})

function getCurrentProvider() {
  const url = parse(ETHEREUM_ENDPOINT)
  switch (url.protocol) {
    case 'wss:':
      return new WebsocketProvider(ETHEREUM_ENDPOINT);

    case 'https:':
      return new HttpProvider(ETHEREUM_ENDPOINT)

    default:
      throw new Error(`Invalid ethereum endpoint`);
  }
}

export async function getRealms(): Promise<Realm[]> {

  // console.log(await fetchCatalystNodes())
  const nodes = await fetchCatalystNodes()
  // const config: Configuration = await fetch(CONFIGURATION_ENDPOINT).then((response) => response.json())
  const comms: (CommStatus | null)[] = await Promise.all(
    nodes.map(node => fetch(node.domain + '/comms/status?includeLayers=true')
      .then((response) => response.json())
      .catch((err: Error) => {
        console.error(err)
        return null
      })
    )
  )

  const realms = new Set<string>()

  return comms
    .filter(comm => {
      if (!comm || !comm.ready) {
        return false
      }

      if (realms.has(comm.name)) {
        return false
      }

      realms.add(comm.name)
      return true
    })
    .map((comm, i) => {
      const c = comm as CommStatus
      return {
        id: c.name,
        url: nodes[i].domain,
        layers: c.layers.map(layer => layer.name)
      }
    })
}

export async function fetchCatalystNodes(): Promise<CatalystNode[]> {
  const address = Address.fromString(CATALYST_CONTRACT_ADDRESS)
  const provider = getCurrentProvider()
  const eth = new Eth(provider)
  const contract = new Contract(eth, dao, address)

  const count = Number.parseInt(await contract.methods.catalystCount().call(), 10)

  const nodes: CatalystNode[] = await Promise.all(Array.from(Array(count), async (_, i) => {
    const ids = await contract.methods.catalystIds(i).call()
    return contract.methods.catalystById(ids).call()
  }))

  return nodes
    .filter((node) => !node.domain.trim().startsWith('http://'))
    .map((node) => {

      node.domain = node.domain.trim()

      if (!node.domain.startsWith('https://')) {
        node.domain = 'https://' + node.domain
      }

      return node
    })

  return nodes
}
