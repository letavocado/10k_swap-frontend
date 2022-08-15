import { computed, ComputedRef, Ref, toRaw } from 'vue'
import JSBI from 'jsbi'
import { Token, TokenAmount } from '../sdk'
import { useStarknetCalls } from '../starknet-vue/hooks/call'
import { isAddress } from '../utils'
import erc20 from '../constants/abis/erc20.json'
import { Abi, Contract } from 'starknet'
import { useStarknet } from '../starknet-vue/providers/starknet'
import { uint256ToBN } from 'starknet/dist/utils/uint256'

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address: Ref<string | undefined> | ComputedRef<string | undefined>,
  tokens: ComputedRef<(Token | undefined)[]>
): [ComputedRef<{ [tokenAddress: string]: TokenAmount | null | undefined }>, ComputedRef<boolean>] {
  const {
    state: { library },
  } = useStarknet()
  const validatedTokens: ComputedRef<Token[]> = computed(() => {
    return tokens.value?.filter((t?: Token): t is Token => (isAddress(t?.address) ? true : false)) ?? []
  })
  const validatedTokenAddresses = computed(() => validatedTokens.value.map((vt) => vt.address))

  const contracts = computed(() => validatedTokenAddresses.value.map((item) => new Contract(erc20 as Abi, item, toRaw(library.value))))
  const methods = computed(() => validatedTokenAddresses.value.map(() => 'balanceOf'))
  const args = computed(() => validatedTokenAddresses.value.map(() => [address.value]))
  const balances = useStarknetCalls(contracts, methods, args)

  const anyLoading = computed(() => balances.states.loading)

  return [
    computed(() => {
      return address && validatedTokens.value.length > 0
        ? validatedTokens.value.reduce<{ [tokenAddress: string]: TokenAmount | null | undefined }>((memo, token, i) => {
            const value = balances.states.data?.[i]?.[0]
            const amount = value ? JSBI.BigInt(uint256ToBN(value).toString()) : undefined
            if (balances.states.loading) {
              memo[token.address] = null
            }
            if (amount) {
              memo[token.address] = new TokenAmount(token, amount)
            }
            return memo
          }, {})
        : {}
    }),
    anyLoading,
  ]
}

export function useTokenBalances(address: Ref<string | undefined> | ComputedRef<string | undefined>, tokens: ComputedRef<(Token | undefined)[]>) {
  const [balances] = useTokenBalancesWithLoadingIndicator(address, tokens)
  return computed(() => tokens?.value.map((token) => (token?.address ? balances.value[token.address] : undefined)))
}
