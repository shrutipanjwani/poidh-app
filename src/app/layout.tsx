import '@/styles/globals.css';
import '@/styles/colors.css';
import { headers } from 'next/headers';
import React from 'react';
import { TRPCProvider } from '@/trpc/client';
import Header from '@/components/layout/Header';
import '@rainbow-me/rainbowkit/styles.css';
import { WalletProvider } from '@/components/global/WalletProvider';

export const metadata = {
  title: "poidh - pics or it didn't happen",
  description:
    "poidh - pics or it didn't happen - fully onchain bounties + collectible NFTs - start your collection today on Arbitrum, Base, or Degen Chain",
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const headersList = headers();
  const referer = headersList.get('referer');
  const url = referer ? String(referer) : '';

  return (
    <html>
      <head>
        <link rel='canonical' href={url} />
      </head>
      <body className='bg-blue-300 text-white'>
        <TRPCProvider>
          <WalletProvider>
            <Header />
            {children}
          </WalletProvider>
        </TRPCProvider>
      </body>
    </html>
  );
};

export default RootLayout;
