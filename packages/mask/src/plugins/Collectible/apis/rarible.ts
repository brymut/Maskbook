import {
    fetchFromRarible,
    getProfilesFromRarible,
    RaribleOfferResponse,
    resolveRaribleUserNetwork,
} from '../../EVM/apis/rarible'
import { currentChainIdSettings } from '../../Wallet/settings'
import { RaribleMainnetURL } from '../constants'
import { toRaribleImage } from '../helpers'

export async function getOffersFromRarible(tokenAddress: string, tokenId: string) {
    const orders = await fetchFromRarible<RaribleOfferResponse[]>(
        RaribleMainnetURL,
        `items/${tokenAddress}:${tokenId}/offers`,
        {
            method: 'POST',
            body: JSON.stringify({ size: 20 }),
            headers: {
                'content-type': 'application/json',
            },
        },
    )
    const profiles = await getProfilesFromRarible(orders.map((item) => item.maker))
    const chainId = currentChainIdSettings.value
    return orders.map((order) => {
        const ownerInfo = profiles.find((owner) => owner.id === order.maker)
        return {
            unitPrice: order.buyPriceEth,
            hash: order.signature,
            makerAccount: {
                user: {
                    username: ownerInfo?.name,
                },
                address: ownerInfo?.id,
                profile_img_url: toRaribleImage(ownerInfo?.image),
                link: `${resolveRaribleUserNetwork(chainId)}${ownerInfo?.id ?? ''}`,
            },
        }
    })
}
