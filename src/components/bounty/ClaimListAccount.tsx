import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { useGetChain } from '@/hooks/useGetChain';
import { CopyDoneIcon, CopyIcon } from '@/components/global/Icons';

type Claim = {
  id: string;
  title: string;
  description: string;
  url: string;
  issuer: string;
  bountyId: string;
  accepted: boolean;
};

export default function ClaimsListAccount({ claims }: { claims: Claim[] }) {
  return (
    <div className='container mx-auto px-0  py-12 flex flex-col gap-12 lg:grid lg:grid-cols-12 lg:gap-12 lg:px-0 '>
      {claims.map((claim) => (
        <div key={claim.id} className={` lg:col-span-4`}>
          <ClaimItem claim={claim} />
        </div>
      ))}
    </div>
  );
}

function ClaimItem({ claim }: { claim: Claim }) {
  const chain = useGetChain();
  const [imageUrl, setImageUrl] = useState('');
  const [isCopied, setCopied] = useState(false);

  const fetchImageUrl = async (url: string) => {
    const response = await fetch(url);
    const data = await response.json();
    setImageUrl(data.image);
  };

  useEffect(() => {
    fetchImageUrl(claim.url);
  }, [claim]);

  return (
    <div className='p-[2px] text-white relative bg-[#F15E5F] border-[#F15E5F] border-2 rounded-xl '>
      <Link href={`/${chain.slug}/bounty/${claim.bountyId}`}>
        {claim.accepted && (
          <div className='right-5 top-5  text-white bg-[#F15E5F] border border-[#F15E5F] rounded-[8px] py-2 px-5 absolute '>
            accepted
          </div>
        )}

        <div className='bg-[#12AAFF] w-full aspect-w-1 aspect-h-1 rounded-[8px] overflow-hidden'>
          <div
            style={{ backgroundImage: `url(${imageUrl})` }}
            className='bg-[#12AAFF] bg-cover bg-center w-full aspect-w-1 aspect-h-1 rounded-[8px] overflow-hidden'
          ></div>
        </div>
      </Link>
      <div className='p-3'>
        <div className='flex flex-col'>
          <p className='normal-case text-nowrap overflow-ellipsis overflow-hidden'>
            {claim.title}
          </p>
          <p className='normal-case w-full h-20 overflow-y-auto overflow-x-hidden overflow-hidden'>
            {claim.description}
          </p>
        </div>
        <div className='mt-2 py-2 flex flex-row justify-between text-sm border-t border-dashed'>
          <span className=''>issuer</span>
          <div className='flex flex-row'>
            <Link
              href={`/${chain.slug}/account/${claim.issuer}`}
              className='hover:text-gray-200'
            >
              {formatAddress(claim.issuer)}
            </Link>
            <span
              onClick={() => {
                setCopied(true);
                navigator.clipboard.writeText(claim.issuer);
                setTimeout(() => {
                  setCopied(false);
                }, 1000);
              }}
              className='cursor-pointer ml-2 hover:text-gray-200'
            >
              {isCopied ? (
                <CopyDoneIcon width={20} height={20} />
              ) : (
                <CopyIcon width={20} height={20} />
              )}
            </span>
          </div>
        </div>
        <div>claim id: {claim.id}</div>
      </div>
    </div>
  );
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
