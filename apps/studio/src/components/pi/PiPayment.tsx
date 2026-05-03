"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Loader2, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { usePi } from "@/hooks/usePi";
import type { PiPaymentRequest } from "@/lib/pi-network";

interface PiPaymentProps {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
  onSuccess?: (paymentId: string, txid: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  buttonText?: string;
  disabled?: boolean;
}

export function PiPayment({
  amount,
  memo,
  metadata = {},
  onSuccess,
  onError,
  onCancel,
  buttonText = "Pay with Pi",
  disabled = false,
}: PiPaymentProps) {
  const { isAuthenticated, createPayment, user } = usePi();
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!isAuthenticated) {
      setError("Please authenticate with Pi Network first");
      setStatus("error");
      return;
    }

    setStatus("processing");
    setError(null);

    try {
      const paymentRequest: PiPaymentRequest = {
        amount,
        memo,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      };

      const result = await createPayment(paymentRequest);
      
      setPaymentId(result.identifier);
      setStatus("success");
      
      if (result.txid) {
        onSuccess?.(result.identifier, result.txid);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      setStatus("error");
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  };

  const handleCancel = () => {
    setStatus("idle");
    setError(null);
    setPaymentId(null);
    onCancel?.();
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-panel rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Please connect your Pi Network account first</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Pi Payment</h3>
            <p className="text-sm text-gray-400">{memo}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{amount.toFixed(2)} π</div>
          {user?.piBalance !== undefined && (
            <p className="text-xs text-gray-400">
              Balance: {user.piBalance.toFixed(2)} π
            </p>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <button
              onClick={handlePayment}
              disabled={disabled}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              {buttonText}
            </button>
          </motion.div>
        )}

        {status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-6"
          >
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-3" />
            <p className="text-gray-300 text-sm">Processing payment...</p>
            <p className="text-gray-500 text-xs mt-1">Please approve in Pi Browser</p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-emerald-400 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Payment Successful!</span>
            </div>
            
            {paymentId && (
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Payment ID:</span>
                  <span className="text-white font-mono text-xs">{paymentId.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-medium">{amount.toFixed(2)} π</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCancel}
              className="w-full mt-4 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all text-sm"
            >
              Close
            </button>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Payment Failed</span>
            </div>
            <p className="text-sm text-gray-300">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={handlePayment}
                className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium hover:brightness-110 transition-all text-sm"
              >
                Try Again
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Made with Moe Abdelaziz
