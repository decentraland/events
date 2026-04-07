import { Authenticator } from "@dcl/crypto"
import { AuthIdentity } from "@dcl/crypto/dist/types"
import { Wallet } from "ethers"

export async function createIdentity(): Promise<{
  address: string
  identity: AuthIdentity
}> {
  const wallet = Wallet.createRandom()
  const ephemeralWallet = Wallet.createRandom()

  const ephemeralIdentity = {
    privateKey: ephemeralWallet.privateKey,
    publicKey: ephemeralWallet.publicKey,
    address: ephemeralWallet.address,
  }

  const identity = await Authenticator.initializeAuthChain(
    wallet.address,
    ephemeralIdentity,
    60,
    (message: string) => wallet.signMessage(message)
  )

  return { address: wallet.address.toLowerCase(), identity }
}
