import { waitForTransaction, type Hash } from "@wagmi/core";
import { writable } from "svelte/store";
import type { TransactionReceipt } from "viem";

type AddTxResult =
  | {
      rc: TransactionReceipt;
      error?: never;
    }
  | {
      error: any;
      rc?: never;
    };

/**
 * Manage and track transactions made through the frontend
 */
function MakeTransactionStore() {
  const contractTransactionReceipts = writable<TransactionReceipt[]>([]);
  const transactionHashes = writable<Hash[]>([]);

  /**
   * The store's main subscription is for finalized transactions (receipts), but
   * transaction reponses can also be subcribed to
   */
  return {
    subscribe: contractTransactionReceipts.subscribe,
    hashes: { subscribe: transactionHashes.subscribe },
    addTransaction: async (
      transaction: Promise<Hash>
    ): Promise<AddTxResult> => {
      let rc: TransactionReceipt;
      try {
        const submittedTx = await transaction;
        transactionHashes.update((txs) => [...txs, submittedTx]);
        rc = await waitForTransaction({ hash: submittedTx });
        contractTransactionReceipts.update((txs) => [...txs, rc]);
      } catch (err) {
        return {
          error: err,
        };
      }

      return {
        rc,
      };
    },
  };
}

export const transactions = MakeTransactionStore();
