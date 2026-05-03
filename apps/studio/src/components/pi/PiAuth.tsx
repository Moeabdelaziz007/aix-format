"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { usePi } from "@/hooks/usePi";

interface PiAuthProps {
  onAuthenticated?: (user: any) => void;
  onError?: (error: Error) => void;
  scopes?: string[];
  sandbox?: boolean;
  showDomainSetup?: boolean;
}

export function PiAuth({
  onAuthenticated,
  onError,
  scopes = ["username", "payments"],
  sandbox = true,
  showDomainSetup = true,
}: PiAuthProps) {
  const { isReady, isAuthenticated, user, authenticate, logout, error: piError } = usePi({
    sandbox,
    scopes,
    autoInit: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      onAuthenticated?.(user);
    }
  }, [isAuthenticated, user, onAuthenticated]);

  useEffect(() => {
    if (piError) {
      onError?.(new Error(piError));
    }
  }, [piError, onError]);

  const handleAuthenticate = async () => {
    setIsLoading(true);
    try {
      await authenticate();
    } catch (err) {
      console.error("Authentication failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Pi Network Authentication</h3>
          <p className="text-sm text-gray-400">
            {sandbox ? "Sandbox Mode (Testnet)" : "Production Mode (Mainnet)"}
          </p>
        </div>
      </div>

      {showDomainSetup && !isAuthenticated && (
        <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">Domain Setup Required</p>
              <p className="text-gray-400 text-xs mb-2">
                Before using Pi Network authentication, you need to:
              </p>
              <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                <li>Visit <a href="https://develop.pi" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Pi Developer Portal</a></li>
                <li>Create or select your app</li>
                <li>Add your domain to the whitelist</li>
                <li>Copy your API Key and App ID to .env.local</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isAuthenticated && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-gray-300 text-sm mb-4">
              Connect your Pi Network account to deploy and manage agents with Pi payments.
            </p>
            <button
              onClick={handleAuthenticate}
              disabled={!isReady || isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {!isReady ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Pi SDK...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Connect with Pi
                </>
              )}
            </button>

            {piError && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-red-300 font-medium">Authentication Error</p>
                    <p className="text-gray-400 text-xs mt-1">{piError}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {isAuthenticated && user && (
          <motion.div
            key="authenticated"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-emerald-400 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Connected Successfully</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Username:</span>
                <span className="text-white font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User ID:</span>
                <span className="text-white font-mono text-xs">{user.uid.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">KYC Status:</span>
                <span
                  className={`font-medium ${
                    user.kycStatus === "verified"
                      ? "text-emerald-400"
                      : user.kycStatus === "pending"
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}
                >
                  {user.kycStatus.toUpperCase()}
                </span>
              </div>
              {user.piBalance !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance:</span>
                  <span className="text-white font-medium">{user.piBalance.toFixed(2)} π</span>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="w-full mt-4 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all text-sm"
            >
              Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Made with Moe Abdelaziz
