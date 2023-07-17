import { derived, get, writable, type Readable } from "svelte/store";
import { mainnet, polygon, hardhat } from "@wagmi/core/chains";
import {
  configureChains,
  fetchEnsName,
  type GetNetworkResult,
  type GetAccountResult,
  switchNetwork,
  createConfig,
  getWalletClient,
  type WalletClient,
} from "@wagmi/core";
import { Web3Modal } from "@web3modal/html";
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import type { EvmAddress } from "../types";
import { optimismGoerli } from "viem/chains";
import { alchemyProvider } from "@wagmi/core/providers/alchemy";

export type Account = GetAccountResult & { address: EvmAddress };

export const supportedChains = [optimismGoerli];
const projectId = "698bddafdbc932fc6eb19c24ab471c3a";

const { publicClient, webSocketPublicClient } = configureChains(
  supportedChains,
  [
    w3mProvider({ projectId }),
    alchemyProvider({ apiKey: "_k4Jxl6GexIvooQrdgnxZj9OFj8pGWrw" }),
  ]
);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains: supportedChains }),
  publicClient,
  webSocketPublicClient,
});

export const ethClient = writable(
  new EthereumClient(wagmiConfig, supportedChains)
);

export const web3Modal = derived(
  ethClient,
  ($ethClient) => new Web3Modal({ projectId }, $ethClient)
);

export const account = writable<GetAccountResult | undefined>();
export const network = writable<GetNetworkResult | undefined>();

export const signer = derived(
  [account, network],
  ([$account, $network], set) => {
    if (!$network?.chain?.id || !$account) return;

    const noSignerError = (e?: any) =>
      console.error("Signer fetching failed", e);

    getWalletClient({ chainId: $network.chain.id })
      .then((signer) => {
        if (signer) return set(signer);
        noSignerError();
      })
      .catch(noSignerError);
  }
) as Readable<WalletClient | undefined>;

export const ensName = derived([account, network], ([$account], set) => {
  if (!$account?.address) return;

  fetchEnsName({ address: $account.address })
    .then((ens) => ens !== null && set(ens))
    .catch(() => {
      set(undefined);
    });
}) as Readable<string | undefined>;

get(ethClient).watchAccount(account.set);
get(ethClient).watchNetwork((net) => {
  if (!net.chain) return;
  network.set(net);
  /* if (!supportedChains.map((c) => c.id as number).includes(net.chain.id)) {
    switchNetwork({ chainId: supportedChains[0].id });
  } */
});

/*
 * Account store to for contexts and pages where an account is assumed to always be present
 */
export const getCurrentAccount = derived(account, ($account) => {
  return () => {
    if (!$account) throw new Error("No account connected");
    return $account;
  };
}) as Readable<() => Account>;
