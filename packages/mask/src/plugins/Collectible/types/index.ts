import type { WyvernSchemaName } from 'opensea-js/lib/types'
import type { ChainId } from '@masknet/web3-shared-evm'

export * from './opensea'
export * from './rarible'

export enum CollectibleProvider {
    OPENSEA = 0,
    RARIBLE = 1,
}

export interface CollectibleJSON_Payload {
    chain_id: ChainId
    address: string
    token_id: string
    provider: CollectibleProvider
}

export enum CollectibleTab {
    ARTICLE = 0,
    TOKEN = 1,
    OFFER = 2,
    LISTING = 3,
    HISTORY = 4,
}

export interface CollectibleToken {
    chainId: ChainId
    tokenId: string
    contractAddress: string
    schemaName?: WyvernSchemaName
    provider: CollectibleProvider
}
