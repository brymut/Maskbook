import { unreachable } from '@dimensiondev/kit'
import {
    Asset,
    ChainId,
    NonFungibleAssetProvider,
    createERC20Token,
    createNativeToken,
    CurrencyType,
    EthereumTokenType,
    ERC721TokenDetailed,
    formatEthereumAddress,
    getChainIdFromName,
    getTokenConstants,
    isChainIdMainnet,
    NetworkType,
    FungibleAssetProvider,
    pow10,
    getChainShortName,
    getChainIdFromNetworkType,
    ERC721TokenCollectionInfo,
} from '@masknet/web3-shared-evm'
import BigNumber from 'bignumber.js'
import { values } from 'lodash-unified'
import { EthereumAddress } from 'wallet.ts'
import { EVM_RPC } from '../../EVM/messages'
import * as DebankAPI from '../apis/debank'
import * as ZerionAPI from '../apis/zerion'
import { resolveChainByScope, resolveZerionAssetsScopeName } from '../pipes'
import type {
    BalanceRecord,
    SocketRequestAssetScope,
    ZerionAddressAsset,
    ZerionAddressCovalentAsset,
    ZerionAsset,
    ZerionCovalentAsset,
} from '../types'

export async function getCollectionsNFT(
    address: string,
    chainId: ChainId,
    provider: NonFungibleAssetProvider,
    page?: number,
    size?: number,
): Promise<{ collections: ERC721TokenCollectionInfo[]; hasNextPage: boolean }> {
    if (provider === NonFungibleAssetProvider.OPENSEA) {
        const { collections } = await EVM_RPC.getCollections(address, { chainId, page, size })

        return {
            collections,
            hasNextPage: collections.length === size,
        }
    }

    return {
        collections: [],
        hasNextPage: false,
    }
}

export async function getAssetsListNFT(
    address: string,
    chainId: ChainId,
    provider: NonFungibleAssetProvider,
    page?: number,
    size?: number,
    collection?: string,
): Promise<{ assets: ERC721TokenDetailed[]; hasNextPage: boolean }> {
    if (!EthereumAddress.isValid(address))
        return {
            assets: [],
            hasNextPage: false,
        }
    const tokens = await EVM_RPC.getNFTsPaged(address, chainId, page, size)
    return {
        assets: tokens,
        hasNextPage: tokens.length === size,
    }
}

export async function getAssetsList(
    address: string,
    provider: FungibleAssetProvider,
    network?: NetworkType,
): Promise<Asset[]> {
    if (!EthereumAddress.isValid(address)) return []
    switch (provider) {
        case FungibleAssetProvider.ZERION:
            let result: Asset[] = []
            //xdai-assets is not support
            const scopes = network
                ? [resolveZerionAssetsScopeName(network)]
                : ['assets', 'bsc-assets', 'polygon-assets', 'arbitrum-assets']
            for (const scope of scopes) {
                const { meta, payload } = await ZerionAPI.getAssetsList(address, scope)
                if (meta.status !== 'ok') throw new Error('Fail to load assets.')

                const assets = Object.entries(payload).map(([key, value]) => {
                    if (key === 'assets') {
                        const assetsList = (values(value) as ZerionAddressAsset[]).filter(
                            ({ asset }) =>
                                asset.is_displayable &&
                                !filterAssetType.some((type) => type === asset.type) &&
                                asset.icon_url,
                        )
                        return formatAssetsFromZerion(assetsList, key)
                    }

                    return formatAssetsFromZerion(
                        values(value) as ZerionAddressCovalentAsset[],
                        key as SocketRequestAssetScope,
                    )
                })

                result = [...result, ...assets.flat()]
            }

            return result
        case FungibleAssetProvider.DEBANK:
            const { data = [], error_code } = await DebankAPI.getAssetsList(address)
            if (error_code === 0) return formatAssetsFromDebank(data, network)
            return []
        default:
            unreachable(provider)
    }
}

function formatAssetsFromDebank(data: BalanceRecord[], network?: NetworkType) {
    return data
        .filter((x) => !network || getChainIdFromName(x.chain) === getChainIdFromNetworkType(network))
        .filter((x) => x.is_verified)
        .map((y): Asset => {
            const chainIdFromChain = getChainIdFromName(y.chain) ?? ChainId.Mainnet
            // the asset id is the token address or the name of the chain
            const chainIdFromId = getChainIdFromName(y.id)
            return {
                chain: getChainShortName(chainIdFromChain).toLowerCase(),
                token:
                    chainIdFromId && isChainIdMainnet(chainIdFromId)
                        ? createNativeToken(chainIdFromChain)
                        : createERC20Token(
                              chainIdFromChain,
                              formatEthereumAddress(y.id),
                              y.decimals,
                              y.name,
                              y.symbol,
                              y.logo_url ? [y.logo_url] : undefined,
                          ),
                balance: new BigNumber(y.balance).toFixed(),
                price: {
                    [CurrencyType.USD]: new BigNumber(y.price ?? 0).toFixed(),
                },
                value: {
                    [CurrencyType.USD]: new BigNumber(y.price ?? 0)
                        .multipliedBy(new BigNumber(y.balance).dividedBy(pow10(y.decimals)))
                        .toFixed(),
                },
                logoURI: y.logo_url,
            }
        })
}

const filterAssetType = ['compound', 'trash', 'uniswap', 'uniswap-v2', 'nft']

function formatAssetsFromZerion(
    data: ZerionAddressAsset[] | ZerionAddressCovalentAsset[],
    scope: SocketRequestAssetScope,
) {
    return data.map(({ asset, quantity }) => {
        const balance = Number(new BigNumber(quantity).dividedBy(pow10(asset.decimals)).toString())
        const value = (asset as ZerionAsset).price?.value ?? (asset as ZerionCovalentAsset).value ?? 0
        const isNativeToken = (symbol: string) => ['ETH', 'BNB', 'MATIC', 'ARETH'].includes(symbol)

        return {
            token: {
                name: asset.name,
                symbol: asset.symbol,
                decimals: asset.decimals,
                address: isNativeToken(asset.symbol) ? getTokenConstants().NATIVE_TOKEN_ADDRESS : asset.asset_code,
                chainId: resolveChainByScope(scope).chainId,
                type: isNativeToken(asset.symbol) ? EthereumTokenType.Native : EthereumTokenType.ERC20,
                logoURI: asset.icon_url,
            },
            chain: resolveChainByScope(scope).chain,
            balance: quantity,
            price: {
                usd: new BigNumber(value).toString(),
            },
            value: {
                usd: new BigNumber(balance).multipliedBy(value).toString(),
            },
            logoURI: asset.icon_url,
        }
    }) as Asset[]
}
