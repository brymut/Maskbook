import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import { ChainId, explorerResolver } from '@masknet/web3-shared-evm'
import { Avatar, Link, TableCell, TableRow, Typography } from '@mui/material'
import { makeStyles } from '@masknet/theme'
import type { Web3Helper } from '@masknet/plugin-infra/web3'
import {
    isOne,
    isZero,
    formatBalance,
    NonFungibleTokenOrder,
    SourceType,
    CurrencyType,
} from '@masknet/web3-shared-base'
import { FormattedBalance } from '@masknet/shared'
import { getOrderUnitPrice } from '@masknet/web3-providers'
import { CollectibleState } from '../hooks/useCollectibleState'
import { Account } from './Account'

const useStyles = makeStyles()((theme) => {
    return {
        account: {
            display: 'flex',
            alignItems: 'center',
            lineHeight: 1,
        },
        avatar: {
            width: 18,
            height: 18,
        },
        accountName: {
            marginLeft: theme.spacing(0.5),
            fontSize: 14,
            lineHeight: 1,
        },
        relativeTime: {
            whiteSpace: 'nowrap',
        },
        token: {
            objectFit: 'contain',
            width: 18,
            height: 18,
            marginRight: theme.spacing(0.5),
        },
        tokenLink: {
            display: 'flex',
            alignItems: 'center',
        },
        content: {
            display: 'flex',
            alignItems: 'center',
            fontSize: 14,
            lineHeight: 1,
        },
    }
})

interface IRowProps {
    order: NonFungibleTokenOrder<Web3Helper.ChainIdAll, Web3Helper.SchemaTypeAll>
    isDifferenceToken?: boolean
    acceptable?: boolean
}

export function OrderRow({ order, isDifferenceToken }: IRowProps) {
    const { classes } = useStyles()
    const { provider } = CollectibleState.useContainer()
    const address = order.maker?.nickname || order.maker?.address || ''

    return (
        <TableRow>
            <TableCell>
                <Link
                    href={order.maker?.link}
                    title={address}
                    target="_blank"
                    className={classes.account}
                    rel="noopener noreferrer">
                    <Avatar src={order.maker?.avatarURL} className={classes.avatar} />
                    <Typography className={classes.accountName}>
                        <Account address={order.maker?.address} username={order.maker?.nickname} />
                    </Typography>
                </Link>
            </TableCell>
            {isDifferenceToken ? (
                <>
                    <TableCell>
                        <Typography className={classes.content}>
                            <>
                                {provider === SourceType.OpenSea ? (
                                    <Link
                                        href={explorerResolver.addressLink(
                                            ChainId.Mainnet,
                                            order.priceInToken?.token?.address ?? '',
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={classes.tokenLink}>
                                        {order.priceInToken?.token?.logoURL && (
                                            <img
                                                src={order.priceInToken?.token.logoURL}
                                                className={classes.token}
                                                alt={order.priceInToken?.token?.symbol}
                                            />
                                        )}
                                    </Link>
                                ) : null}
                                {getOrderUnitPrice(
                                    order.price?.[CurrencyType.USD],
                                    order.priceInToken?.token?.decimals,
                                    order.quantity,
                                )}{' '}
                                {order.priceInToken?.token?.symbol}
                            </>
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography className={classes.content}>
                            <FormattedBalance
                                value={order.quantity ?? 0}
                                decimals={!isOne(order.quantity ?? 0) ? 8 : 0}
                                formatter={formatBalance}
                            />
                        </Typography>
                    </TableCell>
                </>
            ) : (
                <>
                    <TableCell>
                        <Typography style={{ display: 'flex' }} className={classes.content}>
                            {provider === SourceType.OpenSea ? (
                                <Link
                                    href={explorerResolver.addressLink(
                                        ChainId.Mainnet,
                                        order.priceInToken?.token?.address ?? '',
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={classes.tokenLink}>
                                    {order.priceInToken?.token?.logoURL ? (
                                        <img
                                            src={order.priceInToken?.token.logoURL}
                                            className={classes.token}
                                            alt={order.priceInToken?.token?.symbol}
                                        />
                                    ) : null}
                                </Link>
                            ) : null}
                            {getOrderUnitPrice(
                                order.price?.[CurrencyType.USD],
                                order.priceInToken?.token?.decimals,
                                order.quantity,
                            )?.toString()}{' '}
                            {provider === SourceType.OpenSea || SourceType.MagicEden
                                ? order.priceInToken?.token?.symbol ?? ''
                                : 'ETH'}
                        </Typography>
                    </TableCell>
                    {provider === SourceType.OpenSea ? (
                        <TableCell>
                            <Typography className={classes.content}>
                                {order.expiredAt &&
                                    !isZero(order.expiredAt) &&
                                    formatDistanceToNow(new Date(order.expiredAt * 1000), {
                                        addSuffix: true,
                                    })}
                            </Typography>
                        </TableCell>
                    ) : null}
                </>
            )}
        </TableRow>
    )
}
