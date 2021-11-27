import {
    ChainId,
    createERC721ContractDetailed,
    createERC721Token,
    ERC721ContractDetailed,
    ERC721TokenDetailed,
    EthereumTokenType,
    isSameAddress,
} from '@masknet/web3-shared-evm'
import type { NFTAsset, OrderSide } from '../types/NFT'

const NFTSCAN_ID = 't9k2o5GC'
const NFTSCAN_SECRET = '21da1d638ef5d0bf76e37aa5c2da7fd789ade9e3'
const NFTSCAN_URL = 'https://restapi.nftscan.com'
const NFTSCAN_BASE_API = `${NFTSCAN_URL}/api/v1`

let token: string = ''
let token_expiration: number = 0

async function getToken() {
    const params = new URLSearchParams()
    params.append('apiKey', NFTSCAN_ID)
    params.append('apiSecret', NFTSCAN_SECRET)
    const response = await fetch(`${NFTSCAN_URL}/gw/token?${params.toString()}`, {
        mode: 'cors',
    })

    const { data }: { data: { accessToken: string; expiration: number } } = await response.json()
    token = data.accessToken
    token_expiration = Date.now() + data.expiration * 1000
}

async function fetchAsset(path: string, config = {} as RequestInit) {
    if (token === '' || Date.now() > token_expiration) {
        await getToken()
    }
    const response = await fetch(`${NFTSCAN_BASE_API}/${path}`, {
        method: 'POST',
        ...config,
        headers: {
            'Access-Token': token,
        },
    })

    if (!response.ok) return

    return response.json()
}

interface NFTScanAsset {
    last_price: string
    nft_asset_id: string
    nft_content_uri: string
    nft_cover: string
    nft_create_hash: string
    nft_create_time: string
    nft_creator: string
    nft_detail: string
    nft_holder: string
    nft_json: string
    nft_value: string
    token_id: string

    trade_contract: string
    trade_symbol: string
    trade_decimal: string
}

function createERC721ContractDetailedFromAssetContract(asset: NFTScanAsset) {
    return createERC721ContractDetailed(
        ChainId.Mainnet,
        asset.trade_contract,
        'unknown name',
        asset.trade_symbol ?? 'unknown symbol',
    )
}

function createERC721TokenAsset(asset: NFTScanAsset) {
    const json = JSON.parse(asset.nft_json)
    return createERC721Token(
        createERC721ContractDetailedFromAssetContract(asset),
        {
            name: json.name ?? 'unknown name',
            description: json.description ?? 'unknown symbol',
            image: json.image || '',
            owner: asset.nft_holder ?? '',
        },
        asset.token_id,
    )
}

async function getContractsAndBalance(address: string) {
    const response = await fetchAsset('getGroupByNftContract', {
        body: JSON.stringify({
            erc: 'erc721',
            user_address: address,
        }),
    })
    if (!response) return null

    type NFT_Assets = {
        nft_asset: NFTScanAsset[]
        nft_asset_count: number
        nft_contract_address: string
        nft_platform_count: number
        nft_platform_describe: string
        nft_platform_image: string
        nft_platform_name: string
    }

    const { data }: { data: NFT_Assets[] } = response

    return data
        .map((x) => {
            const contractDetailed: ERC721ContractDetailed = {
                name: x.nft_platform_name,
                symbol: '',
                address: x.nft_contract_address,
                chainId: ChainId.Mainnet,
                type: EthereumTokenType.ERC721,
            }
            const balance = x.nft_asset.length

            return {
                contractDetailed,
                balance,
            }
        })
        .sort((a, b) => a.balance - b.balance)
}

export async function getNFT(address: string, tokenId: string, chainId = ChainId.Mainnet) {
    const response = await fetchAsset('getSingleNft', {
        body: JSON.stringify({
            nft_address: address,
            token_id: tokenId,
        }),
    })
    if (!response) return null

    const { data }: { data: NFTScanAsset } = response

    return createERC721TokenAsset(data)
}

export async function getNFTs(from: string, chainId = ChainId.Mainnet) {
    let tokens: ERC721TokenDetailed[] = []
    let page = 0
    let assets
    const size = 50
    do {
        assets = await getNFTsPaged(from, { chainId, page, size })
        if (!assets) return []
        tokens = tokens.concat(assets)
        page = page + 1
    } while (assets.length === size)

    return tokens
}

export async function getNFTsPaged(from: string, opts: { chainId: ChainId; page?: number; size?: number }) {
    const { size = 50, page = 0 } = opts

    const response = await fetchAsset('getAllNftByUserAddress', {
        body: JSON.stringify({
            page_size: size,
            page_index: page,
            use_address: from,
            erc: 'erc721',
        }),
    })
    if (!response) return []

    const { data }: { data: { content: NFTScanAsset[]; page_index: number; page_size: number; total: number } } =
        response

    return data.content.map((asset) => createERC721TokenAsset(asset))
}

export async function getContractBalance(address: string, contract_address: string, chainId: ChainId) {
    const response = await getContractsAndBalance(address)
    if (!response) return

    return response.find((x) => isSameAddress(x.contractDetailed.address, contract_address))?.balance
}

export async function getAsset(address: string, tokenId: string, chainId: ChainId) {
    return {} as NFTAsset
}

export async function getHistory(address: string, tokenId: string, chainId: ChainId) {
    return []
}

export async function getListings(address: string, tokenId: string, chainId: ChainId) {
    return []
}

export async function getOrder(address: string, tokenId: string, side: OrderSide, chainId: ChainId) {
    return []
}
