import { createPublicClient, http } from 'viem';
import { arbitrum, base, degen, mainnet } from 'viem/chains';

export const mainnetPublicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(
    'https://api.developer.coinbase.com/rpc/v1/base/q_7UksVVI6bvOgx0y6-hR123IsVxVk3-'
  ),
});

export const degenPublicClient = createPublicClient({
  chain: degen,
  transport: http(
    'https://rpc-degen-mainnet-1.t.conduit.xyz/8TM2tJu2NV9h6McqXqDPHCnsvCdwVgyrH'
  ),
});

export const arbitrumPublicClient = createPublicClient({
  chain: arbitrum,
  transport: http(
    'https://arb-mainnet.g.alchemy.com/v2/vePHk-Vg-wjRw9LtykUKxDTxoUA2FHSh'
  ),
});
