import { Request } from "express";
import { Authenticator } from 'dcl-crypto';
import { ChainId } from '@dcl/schemas';
import handleAPI from "decentraland-gatsby/dist/entities/Route/handle";
import routes from "decentraland-gatsby/dist/entities/Route/routes";
import isEthereumAddress from "validator/lib/isEthereumAddress";
import RequestError from "decentraland-gatsby/dist/entities/Route/error";
// import { getProvider } from "decentraland-gatsby/dist/entities/Blockchain/provider";
import { MessageAttributes, PayloadAttributes, PayloadType } from './types'
import { handleAttendMessage } from "../EventAttendee/routes";
import Time from "decentraland-gatsby/dist/utils/date/Time";

export default routes((router) => {
  // router.post('/message', handleAPI(handleSignedMessage))
})

// export async function handleSignedMessage(req: Request) {
//   const data: MessageAttributes = req.body || {}
//   if (!isEthereumAddress(data.address)) {
//     throw new RequestError(`Invalid attribute address: "${data.address}"`, RequestError.BadRequest)
//   }

//   const chain = Authenticator.createSimpleAuthChain(
//     data.message || '',
//     data.address || '',
//     data.signature || ''
//   )

//   const provider = getProvider({ chainId: ChainId.ETHEREUM_MAINNET })
//   const result = await Authenticator.validateSignature(
//     data.message,
//     chain,
//     provider
//   )

//   if (!result.ok) {
//     throw new RequestError(`Invalid signature`, RequestError.BadRequest)
//   }

//   let payload: PayloadAttributes
//   try {
//     payload = JSON.parse(data.message)
//   } catch (err) {
//     throw new RequestError(`Invalid message format`, RequestError.BadRequest, data)
//   }

//   const now = Time.utc()
//   const timestamp = Time.utc(payload.timestamp)
//   if (isNaN(timestamp.getTime())) {
//     throw new RequestError(`Invalid timestamp: "${payload.timestamp}"`, RequestError.BadRequest)
//   }

//   if (now.isBefore(timestamp)) {
//     throw new RequestError(`Invalid message: signed in the future`, RequestError.BadRequest)
//   } else if (now.isAfter(timestamp.add(10, 'minutes'))) {
//     throw new RequestError(`Invalid message: sign is to old`, RequestError.BadRequest)
//   }

//   switch (payload.type) {
//     case PayloadType.Attend:
//       return handleAttendMessage({
//         ...payload,
//         address: data.address.toLowerCase()
//       })

//     default:
//       throw new RequestError(`Invalid message type: "${payload.type}"`, RequestError.BadRequest, data)
//   }
// }