import * as OpenSeaApi from '@masknet/web3-providers/opensea'
import { NonFungibleAssetProvider } from '@masknet/web3-shared-evm'
import { currentChainIdSettings } from '../../../Wallet/settings'
import { unreachable } from '@dimensiondev/kit'

export function getCollections(
    address: string,
    chainId = currentChainIdSettings.value,
    provider = NonFungibleAssetProvider.OPENSEA,
    page: number,
    size: number,
) {
    switch (provider) {
        case NonFungibleAssetProvider.OPENSEA:
            return OpenSeaApi.getCollections(address, { chainId, page, size })
        case NonFungibleAssetProvider.RARIBLE:
            return []
        case NonFungibleAssetProvider.NFTSCAN:
            return []
        default:
            unreachable(provider)
    }
}
