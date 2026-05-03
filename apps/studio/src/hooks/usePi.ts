"use client";

import { useState, useEffect, useCallback } from "react";
import { getPiNetworkClient, type PiUserContext, type PiPaymentRequest, type PiPaymentResponse } from "@/lib/pi-network";

interface UsePiOptions {
  sandbox?: boolean;
  scopes?: string[];
  autoInit?: boolean;
}

interface UsePiReturn {
  isReady: boolean;
  isAuthenticated: boolean;
  user: PiUserContext | null;
  accessToken: string | null;
  authenticate: () => Promise<void>;
  createPayment: (payment: PiPaymentRequest) => Promise<PiPaymentResponse>;
  logout: () => void;
  error: string | null;
}

export function usePi({
  sandbox = true,
  scopes = ["username", "payments"],
  autoInit = true,
}: UsePiOptions = {}): UsePiReturn {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<PiUserContext | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Pi SDK
  useEffect(() => {
    if (!autoInit) return;

    const checkSdk = setInterval(() => {
      if (window.Pi) {
        clearInterval(checkSdk);
        try {
          window.Pi.init({
            version: "2.0",
            sandbox,
          }, []);
          setIsReady(true);
        } catch (err) {
          console.error("Failed to initialize Pi SDK:", err);
          setError("Failed to initialize Pi SDK");
        }
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkSdk);
      if (!isReady) {
        setError("Pi SDK failed to load. Please refresh the page.");
      }
    }, 10000);

    return () => {
      clearInterval(checkSdk);
      clearTimeout(timeout);
    };
  }, [autoInit, sandbox, isReady]);

  // Authenticate with Pi Network
  const authenticate = useCallback(async () => {
    if (!window.Pi) {
      setError("Pi SDK not loaded");
      throw new Error("Pi SDK not loaded");
    }

    setError(null);

    try {
      // Authenticate with Pi Network
      const authResult = await window.Pi.authenticate(
        scopes,
        (payment) => {

        }
      );

      setAccessToken(authResult.accessToken);

      // Verify token with backend
      const piClient = getPiNetworkClient({ environment: sandbox ? "sandbox" : "production" });
      const userContext = await piClient.verifyToken(authResult.accessToken);

      setUser(userContext);
      setIsAuthenticated(true);

      // Store in session storage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pi_access_token", authResult.accessToken);
        sessionStorage.setItem("pi_user", JSON.stringify(userContext));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [scopes, sandbox]);

  // Create payment
  const createPayment = useCallback(
    async (payment: PiPaymentRequest): Promise<PiPaymentResponse> => {
      if (!window.Pi) {
        throw new Error("Pi SDK not loaded");
      }

      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      return new Promise((resolve, reject) => {
        window.Pi!.createPayment(
          {
            amount: payment.amount,
            memo: payment.memo,
            metadata: payment.metadata,
          },
          {
            onReadyForServerApproval: async (paymentId) => {
              try {
                // Call backend to approve payment
                const response = await fetch("/api/pi/approve-payment", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({ paymentId }),
                });

                if (!response.ok) {
                  throw new Error("Payment approval failed");
                }
              } catch (err) {
                reject(err);
              }
            },
            onReadyForServerCompletion: async (paymentId, txid) => {
              try {
                // Call backend to complete payment
                const response = await fetch("/api/pi/complete-payment", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({ paymentId, txid }),
                });

                if (!response.ok) {
                  throw new Error("Payment completion failed");
                }

                const result = await response.json();
                resolve(result);
              } catch (err) {
                reject(err);
              }
            },
            onCancel: (paymentId) => {
              reject(new Error(`Payment cancelled: ${paymentId}`));
            },
            onError: (error, payment) => {
              reject(error);
            },
          }
        );
      });
    },
    [accessToken]
  );

  // Logout
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("pi_access_token");
      sessionStorage.removeItem("pi_user");
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("pi_access_token");
      const storedUser = sessionStorage.getItem("pi_user");

      if (storedToken && storedUser) {
        try {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to restore Pi session:", err);
          sessionStorage.removeItem("pi_access_token");
          sessionStorage.removeItem("pi_user");
        }
      }
    }
  }, []);

  return {
    isReady,
    isAuthenticated,
    user,
    accessToken,
    authenticate,
    createPayment,
    logout,
    error,
  };
}

// Made with Moe Abdelaziz
