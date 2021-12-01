import { CollectibleProvider } from '@masknet/web3-shared-evm'
import { currentChainIdSettings, currentCollectibleDataProviderSettings } from '../../../Wallet/settings'
import * as OpenSeaApi from '@masknet/web3-providers/opensea'
import * as NFTScanApi from '@masknet/web3-providers/NFTScan'
import * as RaribleApi from '@masknet/web3-providers/rarible'

import { unreachable } from '@dimensiondev/kit'
import type { OrderSide } from '../../types/NFT'

export async function getOrder(
    address: string,
    tokenId: string,
    side: OrderSide,
    chainId = currentChainIdSettings.value,
) {
    const provider = currentCollectibleDataProviderSettings.value
    let asset
    switch (provider) {
        case CollectibleProvider.OPENSEA:
            asset = await OpenSeaApi.getOrder(address, tokenId, side, chainId)
            return asset
        case CollectibleProvider.NFTSCAN:
            asset = await NFTScanApi.getOrder(address, tokenId, side, chainId)
            return asset
        case CollectibleProvider.RARIBLE:
            asset = await RaribleApi.getOrder(address, tokenId, side, chainId)
            return asset
        default:
            unreachable(provider)
    }
}
