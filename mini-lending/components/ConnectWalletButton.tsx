"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { ConnectModal, useCurrentAccount, useDisconnectWallet, useWallets } from "@mysten/dapp-kit"
import { useAppStore } from "@/lib/store"
import { formatUsd } from "@/lib/math"

import { useState } from "react"
export function ConnectWalletButton() {
	const currentAccount = useCurrentAccount();
  const { clearUserData } = useAppStore()
	const [open, setOpen] = useState(false);
	const { mutate: disconnect } = useDisconnectWallet();

  if (currentAccount) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {currentAccount.address?.slice(0, 6)}...{currentAccount.address?.slice(-4)} • {formatUsd(1234.56)}
        </div>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
		<ConnectModal
			trigger={
				<button disabled={!!currentAccount}> {currentAccount ? 'Connected' : 'Connect'}</button>
			}
			open={open}
			onOpenChange={(isOpen) => setOpen(isOpen)}
		/>
  )
}
