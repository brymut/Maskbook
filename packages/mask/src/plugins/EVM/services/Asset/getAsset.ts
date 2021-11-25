import { CollectibleProvider } from '@masknet/web3-shared-evm'
import { currentChainIdSettings, currentCollectibleDataProviderSettings } from '../../../Wallet/settings'
import * as OpenSeaApi from '../../apis/opensea'
import * as RaribleApi from '../../apis/rarible'
import * as NFTScanApi from '../../apis/nftscan'
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
            console.log('______________________=====')
            console.log(provider)
            asset = await RaribleApi.getAsset(address, tokenId, chainId)
            console.log(asset)
            return asset
        default:
            unreachable(provider)
    }
}
