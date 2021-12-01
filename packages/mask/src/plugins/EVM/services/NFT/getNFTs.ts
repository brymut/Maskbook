import * as OpenSeaApi from '@masknet/web3-providers/opensea'
import * as NFTScanApi from '@masknet/web3-providers/NFTScan'
import * as RaribleApi from '@masknet/web3-providers/rarible'

import { unreachable } from '@dimensiondev/kit'
import { CollectibleProvider } from '@masknet/web3-shared-evm'
import { currentChainIdSettings, currentCollectibleDataProviderSettings } from '../../../Wallet/settings'

export async function getNFTs(from: string, chainId = currentChainIdSettings.value) {
    const provider = currentCollectibleDataProviderSettings.value
    let tokens
    switch (provider) {
        case CollectibleProvider.OPENSEA:
            tokens = await OpenSeaApi.getNFTs(from, chainId)
            return tokens
        case CollectibleProvider.NFTSCAN:
            tokens = await NFTScanApi.getNFTs(from)
            return tokens
        case CollectibleProvider.RARIBLE:
            tokens = await RaribleApi.getNFTs(from, chainId)
            return tokens
        default:
            unreachable(provider)
    }
}
