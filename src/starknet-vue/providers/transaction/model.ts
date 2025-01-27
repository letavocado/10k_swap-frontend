import { Status, TransactionStatus } from 'starknet4'

export interface TransactionSubmitted {
  status: TransactionStatus
  transactionHash: string
  address?: string
  metadata?: {
    method?: string
    message?: string
  }
}

export interface TransactionReceived {
  status: Status | TransactionStatus
  transactionHash: string
  lastUpdatedAt: number
  metadata?: {
    method?: string
    message?: string
  }
}

export type Transaction = (TransactionSubmitted | TransactionReceived) & {
  createAt: number
  loading: boolean
  scuccess: boolean
  fail: boolean
}

export interface TransactionRefreshData {
  oldTransaction: Transaction
  newTransaction: Transaction
}

export interface StarknetTransactionManager {
  addTransaction: (transaction: TransactionSubmitted) => void
  removeTransaction: (transactionHash: string) => void
  refreshTransaction: (transactionHash: string) => void
  clearTransactions: () => void
}
