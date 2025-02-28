import * as dotenv from 'dotenv'
import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import Safe from '@safe-global/protocol-kit'
import { OperationType, SafeTransactionDataPartial } from '@safe-global/types-kit'

dotenv.config()

const { SIGNER_ADDRESS_PRIVATE_KEY } = process.env
const RPC_URL = 'https://sepolia.gateway.tenderly.co'
const SAFE_ADDRESS = '<SAFE_ADDRESS>'
const DESTINATION_ADDRESS = '<DESTINATION_ADDRESS>'

if (!RPC_URL) {
  throw new Error('Please provide RPC_URL')
}
if (!SIGNER_ADDRESS_PRIVATE_KEY) {
  throw new Error('Please provide SIGNER_ADDRESS_PRIVATE_KEY')
}
if (!SAFE_ADDRESS) {
  throw new Error('Please provide SAFE_ADDRESS')
}
if (!DESTINATION_ADDRESS) {
  throw new Error('Please provide DESTINATION_ADDRESS')
}

// This file can be used to play around with the Safe Core SDK
// The script creates and signs a delegate call transaction for an existing Safe

interface Config {
  RPC_URL: string
  /** Private key of a signer owning the Safe */
  SIGNER_ADDRESS_PRIVATE_KEY: string
  /** Address of a Safe */
  SAFE_ADDRESS: string
  /** Address of the destination account */
  DESTINATION_ADDRESS: string
}

const config: Config = {
  RPC_URL: RPC_URL,
  SIGNER_ADDRESS_PRIVATE_KEY: SIGNER_ADDRESS_PRIVATE_KEY,
  SAFE_ADDRESS: ethers.utils.getAddress(SAFE_ADDRESS),
  DESTINATION_ADDRESS: ethers.utils.getAddress(DESTINATION_ADDRESS)
}

async function main() {
  const apiKit = new SafeApiKit({
    chainId: 11155111n,
    txServiceUrl: 'https://dev.sepolia2.transaction.keypersafe.xyz/api'
  })

  const protocolKit = await Safe.init({
    provider: config.RPC_URL,
    signer: config.SIGNER_ADDRESS_PRIVATE_KEY,
    safeAddress: config.SAFE_ADDRESS
  })

  const safeTransactionData: SafeTransactionDataPartial = {
    to: config.DESTINATION_ADDRESS,
    value: '1', // 1 wei
    data: '0x',
    operation: OperationType.DelegateCall
  }

  console.log('Creating safe transaction...')
  const safeTransaction = await protocolKit.createTransaction({
    transactions: [safeTransactionData]
  })
  console.log('Safe transaction:', safeTransaction)

  console.log('Getting safe transaction hash...')
  const safeTxHash = await protocolKit.getTransactionHash(safeTransaction)
  console.log('Safe transaction hash:', safeTxHash)

  console.log('Signing transaction...')
  const signature = await protocolKit.signHash(safeTxHash)
  console.log('Signature:', signature.data)

  console.log('Proposing transaction...')
  await apiKit.proposeTransaction({
    safeAddress: config.SAFE_ADDRESS,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: config.DESTINATION_ADDRESS,
    senderSignature: signature.data
  })
  console.log('Transaction proposed successfully')
}

main()
