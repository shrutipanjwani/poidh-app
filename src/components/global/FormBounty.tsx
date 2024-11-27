import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Switch,
} from '@mui/material';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { useGetChain } from '@/hooks/useGetChain';
import { useAccount, useSwitchChain, useWriteContract } from 'wagmi';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { decodeEventLog, parseEther } from 'viem';
import abi from '@/constant/abi/abi';
import { cn } from '@/utils';
import Loading from '@/components/global/Loading';
import { trpcClient } from '@/trpc/client';
import GameButton from '@/components/global/GameButton';
import ButtonCTA from '@/components/ui/ButtonCTA';
import { InfoIcon } from '@/components/global/Icons';
import { Dialog as AIDialog } from '@mui/material';

export default function FormBounty({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSoloBounty, setIsSoloBounty] = useState(true);
  const [status, setStatus] = useState<string>('');
  const chain = useGetChain();
  const writeContract = useWriteContract({});
  const account = useAccount();
  const switctChain = useSwitchChain();
  const router = useRouter();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiIdea, setAiIdea] = useState('');

  const createBountyMutations = useMutation({
    mutationFn: async () => {
      const chainId = await account.connector?.getChainId();
      if (chain.id !== chainId) {
        setStatus('Switching chain');
        await switctChain.switchChainAsync({ chainId: chain.id });
      }

      setStatus('Waiting approval');
      const tx = await writeContract.writeContractAsync({
        abi,
        address: chain.contracts.mainContract as `0x${string}`,
        functionName: isSoloBounty ? 'createSoloBounty' : 'createOpenBounty',
        value: BigInt(parseEther(amount)),
        args: [name, description],
        chainId: chain.id,
      });

      setStatus('Waiting for receipt');
      const receipt = await chain.provider.waitForTransactionReceipt({
        hash: tx,
      });

      const log = receipt.logs[0];

      if (!log) {
        throw new Error('No logs found');
      }

      const data = decodeEventLog({
        abi,
        data: log.data,
        topics: log.topics,
      });

      if (data.eventName !== 'BountyCreated') {
        throw new Error('Invalid event: ' + data.eventName);
      }

      const bountyId = data.args.id.toString();

      for (let i = 0; i < 60; i++) {
        setStatus('Indexing ' + i + 's');
        const bounty = await trpcClient.isBountyCreated.query({
          id: Number(bountyId),
          chainId: chain.id,
        });

        if (bounty) {
          return bountyId;
        }
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }

      throw new Error('Failed to index bounty');
    },
    onSuccess: (bountyId) => {
      router.push(`/${chain.slug}/bounty/${bountyId}`);
      toast.success('Bounty created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create bounty: ' + error.message);
    },
    onSettled: () => {
      setStatus('');
    },
  });

  const generateWithAI = useMutation({
    mutationFn: async (idea: string) => {
      const response = await fetch('/api/generate-bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate bounty');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setName(data.title);
      setDescription(data.description);
      setAiDialogOpen(false);
      setAiIdea('');
    },
    onError: (error) => {
      toast.error('Failed to generate bounty: ' + error.message);
    },
  });

  const aiDialog = (
    <AIDialog
      open={aiDialogOpen}
      onClose={() => setAiDialogOpen(false)}
      maxWidth='xs'
      fullWidth
      PaperProps={{
        className: 'bg-poidhBlue/90',
        style: {
          borderRadius: '30px',
          color: 'white',
          border: '1px solid #D1ECFF',
        },
      }}
    >
      <DialogContent>
        <Box display='flex' flexDirection='column' width='100%' gap={2}>
          <span>What's your bounty idea?</span>
          <textarea
            rows={3}
            value={aiIdea}
            onChange={(e) => setAiIdea(e.target.value)}
            className='border bg-transparent border-[#D1ECFF] py-2 px-2 rounded-md mb-4'
            placeholder='e.g., Take a photo proving you climbed Mount Everest'
          />
          <div className='flex gap-2'>
            <button
              className='flex-1'
              onClick={() => generateWithAI.mutate(aiIdea)}
              disabled={!aiIdea || generateWithAI.isPending}
            >
              <ButtonCTA>
                {generateWithAI.isPending ? 'Generating...' : 'Generate'}
              </ButtonCTA>
            </button>
            <button onClick={() => setAiDialogOpen(false)}>
              <ButtonCTA>Cancel</ButtonCTA>
            </button>
          </div>
        </Box>
      </DialogContent>
    </AIDialog>
  );

  return (
    <>
      {aiDialog}
      <Loading open={createBountyMutations.isPending} status={status} />
      <Dialog
        open={open}
        onClose={() => {
          onClose();
          setAmount('');
        }}
        maxWidth='xs'
        fullWidth
        PaperProps={{
          className: 'bg-poidhBlue/90',
          style: {
            borderRadius: '30px',
            color: 'white',
            border: '1px solid #D1ECFF',
          },
        }}
      >
        <DialogContent>
          <Box display='flex' flexDirection='column' width='100%'>
            <div className='flex justify-between items-center mb-2'>
              <span>title</span>
              <button
                onClick={() => setAiDialogOpen(true)}
                className='text-sm text-blue-300 hover:text-blue-400'
              >
                <ButtonCTA>Generate with AI</ButtonCTA>
              </button>
            </div>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='border bg-transparent border-[#D1ECFF] py-2 px-2 rounded-md mb-4'
            />
            <span>description</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='border bg-transparent border-[#D1ECFF] py-2 px-2 rounded-md mb-4 max-h-28'
            ></textarea>

            <span>reward</span>
            <input
              type='number'
              placeholder={`amount in ${chain.currency}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='border bg-transparent border-[#D1ECFF] py-2 px-2 rounded-md mb-4 placeholder:text-slate-400'
            />
            <div className='flex text-balance gap-2 text-xs mb-2 items-center'>
              <InfoIcon width={18} height={18} /> a 2.5% fee is deducted from
              completed bounties
            </div>
            <div className='flex items-center justify-start gap-2'>
              <span>{isSoloBounty ? 'Solo Bounty' : 'Open Bounty'}</span>
              <Switch
                checked={isSoloBounty}
                onClick={() => setIsSoloBounty(!isSoloBounty)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            </div>
            <div className=' text-xs'>
              <span className='flex gap-2 items-center max-w-md '>
                <InfoIcon width={18} height={18} />
                {isSoloBounty
                  ? 'you are the sole bounty contributor'
                  : 'users can add additional funds to your bounty'}
              </span>
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <button
            className={cn(
              'flex flex-row items-center justify-center',
              account.isDisconnected && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => {
              if (account.isConnected && name && description && amount) {
                onClose();
                createBountyMutations.mutate();
              } else {
                toast.error(
                  'Please fill in all fields and check wallet connection.'
                );
              }
            }}
            disabled={account.isDisconnected}
          >
            <div className='button'>
              <GameButton />
            </div>
            <ButtonCTA>create bounty</ButtonCTA>
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
}
