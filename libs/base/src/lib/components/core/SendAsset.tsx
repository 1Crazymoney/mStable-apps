import { useCallback, useMemo, useRef } from 'react'

import { ERC20__factory } from '@apps/artifacts/typechain'
import { Button, Input } from '@apps/dumb-components'
import { useBigDecimalInput } from '@apps/hooks'
import { TransactionManifest } from '@apps/transaction-manifest'
import styled from 'styled-components'

import { useSigner } from '../../context/AccountProvider'
import { useTokensState } from '../../context/TokensProvider'
import { usePropose } from '../../context/TransactionsProvider'

import type { Interfaces } from '@apps/transaction-manifest'
import type { ChangeEventHandler, FC } from 'react'

interface Props {
  symbol: string
}

const Container = styled.div`
  > div {
    display: flex;
    border: 1px solid ${({ theme }) => theme.color.defaultBorder};
    border-radius: 1rem;
    align-items: center;
    padding: 0.5rem 1rem;
    margin-bottom: 2rem;
    margin-top: 1rem;

    span {
      width: 4rem;
      text-align: center;
    }

    > *:not(:last-child) {
      margin-right: 0.5rem;
    }
  }

  input {
    padding: 0.75rem 0;
    width: 100%;
  }

  input:first-child {
    width: 4rem;
  }
`

export const SendAsset: FC<Props> = ({ symbol }) => {
  const tokenState = useTokensState()
  const propose = usePropose()
  const signer = useSigner()
  const inputAddress = useRef<string | undefined>()

  const tokenAddress = useMemo(
    () => Object.keys(tokenState.tokens).find(address => tokenState.tokens[address]?.symbol === symbol),
    [tokenState, symbol],
  )

  const token = tokenState.tokens[tokenAddress ?? '']

  const [inputAmount, inputFormValue, setInputFormValue] = useBigDecimalInput('0', token?.decimals)

  const handleAddressChange = useCallback<ChangeEventHandler<HTMLInputElement>>(event => {
    inputAddress.current = event.target.value ?? undefined
  }, [])

  const handleAmountChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    event => {
      setInputFormValue(event.target.value ?? undefined)
    },
    [setInputFormValue],
  )

  const handleSend = (): void => {
    if (!tokenAddress || !signer || !inputAddress.current || !inputAmount) return
    return propose<Interfaces.ERC20, 'transfer'>(
      new TransactionManifest(ERC20__factory.connect(tokenAddress, signer), 'transfer', [inputAddress.current, inputAmount.exact], {
        present: `Transfer ${symbol ? ` ${inputAmount.simple} ${symbol} to ${inputAddress.current}` : ''}`,
        past: `Transfer${symbol ? ` ${inputAmount.simple} ${symbol} to ${inputAddress.current}` : ''}`,
      }),
    )
  }

  return (
    <Container>
      <div>
        <Input placeholder="0.00" value={inputFormValue} onChange={handleAmountChange} />
        <span>to</span>
        <Input placeholder="0x000…" onChange={handleAddressChange} />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </Container>
  )
}
