import { waitForTransaction, type Hash } from "@wagmi/core";
import { derived, writable } from "svelte/store";
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
  const txPending = writable(false);

  const { subscribe } = derived(
    [contractTransactionReceipts, transactionHashes, txPending],
    ([$rcs, $txs, $pending]) => ({
      receipts: $rcs,
      hashes: $txs,
      pending: $pending,
    })
  );

  /**
   * The store's main subscription is for finalized transactions (receipts), but
   * transaction reponses can also be subcribed to
   */
  return {
    subscribe,
    addTransaction: async (
      transaction: Promise<Hash>
    ): Promise<AddTxResult> => {
      txPending.set(true);

      let rc: TransactionReceipt;
      try {
        const submittedTx = await transaction;
        transactionHashes.update((txs) => [...txs, submittedTx]);
        rc = await waitForTransaction({ hash: submittedTx });
        contractTransactionReceipts.update((txs) => [...txs, rc]);
      } catch (err) {
        txPending.set(false);
        console.log(err);
        return {
          error: err,
        };
      }

      txPending.set(false);
      return {
        rc,
      };
    },
  };
}

export const transactions = MakeTransactionStore();
