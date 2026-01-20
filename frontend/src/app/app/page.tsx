"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallet, useCreateTownHall } from "@/hooks/useContracts";
import {
  CSSGameCanvas,
  TopBar,
  BottomBar,
} from "@/components/game";
import { WalletInfo, DepositForm, WithdrawForm } from "@/components/wallet";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AppPage() {
  const { ready, authenticated, user, login } = usePrivy();
  const eoaAddress = user?.wallet?.address;

  // Get smart wallet address from contract
  const shouldCheckWallet = ready && authenticated && eoaAddress;
  const { smartWallet, loading: walletLoading } = useSmartWallet(
    shouldCheckWallet ? eoaAddress : undefined,
  );

  // Create Town Hall (Deploy Smart Account) hook
  const { createTownHall } = useCreateTownHall();


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const hasAttemptedDeploy = useRef(false);

  // Step 2: Auto-deploy Smart Account if needed
  // 2.1: Check if already deployed, skip if exists
  useEffect(() => {
    async function deploySmartAccount() {
      console.log('[AppPage] === Deploy Check Start ===');
      console.log('[AppPage] authenticated:', authenticated);
      console.log('[AppPage] eoaAddress:', eoaAddress);
      console.log('[AppPage] walletLoading:', walletLoading);
      console.log('[AppPage] smartWallet:', smartWallet);
      console.log('[AppPage] hasAttemptedDeploy:', hasAttemptedDeploy.current);
      
      // Step 1: Must be authenticated (EOA connected)
      if (!authenticated || !eoaAddress) {
        console.log("[AppPage] Waiting for wallet connection (EOA)...");
        return;
      }

      // Wait for wallet check to complete
      if (walletLoading) {
        console.log("[AppPage] Checking if Smart Account exists...");
        return;
      }

      // Step 2.1: If Smart Account already exists, skip deployment
      if (smartWallet) {
        console.log("[AppPage] ✓ Smart Account already exists:", smartWallet);
        hasAttemptedDeploy.current = true; // Mark as done
        return;
      }

      // Prevent multiple deployment attempts
      if (hasAttemptedDeploy.current) {
        console.log("[AppPage] Already attempted to deploy Smart Account");
        return;
      }

      // Step 2: Deploy Smart Account (AA) at center of map
      console.log("[AppPage] Step 2: Deploying Smart Account for new user");
      hasAttemptedDeploy.current = true; // Mark before attempting
      setIsDeploying(true);

      const GRID_SIZE = 12;
      const centerX = Math.floor(GRID_SIZE / 2);
      const centerY = Math.floor(GRID_SIZE / 2);

      try {
        const result = await createTownHall(eoaAddress, centerX, centerY);

        if (result.success && result.walletAddress) {
          // Step 3: Get Address and Data of deployed AA
          console.log("[AppPage] ✓ Smart Account deployed successfully!");
          console.log("[AppPage] Smart Wallet Address:", result.walletAddress);
          console.log("[AppPage] Building ID:", result.buildingId);
          
          // Store the Smart Wallet address for later use
          // The address will be displayed in WalletInfo component
        } else {
          console.error("[AppPage] ✗ Failed to deploy Smart Account");
          // Reset flag to allow retry on next mount
          hasAttemptedDeploy.current = false;
        }
      } catch (error: any) {
        console.error("[AppPage] ✗ Error deploying Smart Account:", error);
        
        // Check if it's WalletAlreadyRegistered error
        const errorMessage = error.message || '';
        if (errorMessage.includes('0x792279f3') || 
            errorMessage.includes('WalletAlreadyRegistered') || 
            errorMessage.includes('already have a Town Hall')) {
          console.log("[AppPage] ⚠ Wallet already registered - reloading to refresh state");
          // Don't reset flag - wallet exists
          // Force a wallet data refresh by reloading
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // For other errors, allow retry
          console.error("[AppPage] Unexpected error, will retry on next mount");
          hasAttemptedDeploy.current = false;
        }
      } finally {
        setIsDeploying(false);
        console.log('[AppPage] === Deploy Check End ===');
      }
    }

    deploySmartAccount();
  }, [authenticated, eoaAddress, walletLoading, smartWallet, createTownHall]);

  // Show loading or connect screen
  if (!ready || !authenticated || walletLoading || isDeploying) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom, #0f172a, #1e1b4b, #0f172a)",
        }}
      >
        <div className="text-center space-y-6">
          <div
            className="text-amber-400 text-2xl"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            DEFICITY
          </div>
          {!ready && (
            <p className="text-slate-400">Loading...</p>
          )}
          {ready && !authenticated && (
            <>
              <p className="text-slate-400 mb-4">Connect your wallet to start</p>
              <motion.button
                onClick={login}
                className="px-8 py-4 border-4 text-white"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: "12px",
                  borderColor: "#F59E0B",
                  backgroundColor: "#B45309",
                  boxShadow: "6px 6px 0px #92400E",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Connect Wallet
              </motion.button>
            </>
          )}
          {authenticated && walletLoading && (
            <p className="text-slate-400">Checking account...</p>
          )}
          {authenticated && isDeploying && (
            <p className="text-emerald-400">Deploying Smart Account...</p>
          )}
        </div>
      </div>
    );
  }

  // Show game (user has wallet) - ONLY MAP VIEW
  return (
    <main className="relative min-h-screen overflow-hidden">
      <TopBar />
      <CSSGameCanvas />
      <BottomBar />

      {/* Sidebar Toggle */}
      <motion.button
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 border-2 border-r-0 p-2"
        style={{
          backgroundColor: "#0f172a",
          borderColor: "#475569",
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        whileHover={{ x: -4 }}
      >
        {sidebarOpen ? (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-slate-400" />
        )}
      </motion.button>

      {/* Sidebar Panel */}
      <motion.div
        className="fixed right-0 top-16 bottom-24 w-80 z-40 overflow-y-auto border-l-2"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderColor: "#475569",
        }}
        initial={{ x: "100%" }}
        animate={{ x: sidebarOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 20 }}
      >
        <div className="p-4 space-y-4">
          <div
            className="text-center py-2 border-b-2"
            style={{ borderColor: "#475569" }}
          >
            <span
              className="text-amber-400"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "10px",
              }}
            >
              Wallet
            </span>
          </div>
          <WalletInfo />

          <div
            className="text-center py-2 border-b-2"
            style={{ borderColor: "#475569" }}
          >
            <span
              className="text-emerald-400"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "10px",
              }}
            >
              Actions
            </span>
          </div>
          <DepositForm
            smartWalletAddress={(smartWallet as `0x${string}`) || null}
          />
          <WithdrawForm
            smartWalletAddress={(smartWallet as `0x${string}`) || null}
          />
        </div>
      </motion.div>
    </main>
  );
}
