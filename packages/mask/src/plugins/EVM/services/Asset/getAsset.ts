import { CollectibleProvider } from '@masknet/web3-shared-evm'
import { currentChainIdSettings, currentCollectibleDataProviderSettings } from '../../../Wallet/settings'
import * as OpenSeaApi from '@masknet/web3-providers/opensea'
import * as NFTScanApi from '@masknet/web3-providers/NFTScan'
import * as RaribleApi from '@masknet/web3-providers/rarible'

import { unreachable } from '@dimensiondev/kit'

export async function getAsset(
    address: string,
    tokenId: string,
    chainId = currentChainIdSettings.value,
    provider = currentCollectibleDataProviderSettings.value,
) {
    let asset
    switch (provider) {
        case CollectibleProvider.OPENSEA:
            asset = await OpenSeaApi.getAsset(address, tokenId, chainId)
            return asset
        case CollectibleProvider.NFTSCAN:
            asset = await NFTScanApi.getAsset(address, tokenId, chainId)
            return asset
        case CollectibleProvider.RARIBLE:
            asset = await RaribleApi.getAsset(address, tokenId, chainId)
            return asset
        default:
            unreachable(provider)
    }
}
