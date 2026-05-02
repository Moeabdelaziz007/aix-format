"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { PiConnectFlow } from "@aix/pi-kyc/src/connect-flow";
import { toast } from "sonner";
import { Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export const PiConnectButton: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to initialize SDK on mount
    PiConnectFlow.initSDK().catch(console.error);
  }, []);

  const handleConnect = async () => {
    setStatus("connecting");
    try {
      const auth = await PiConnectFlow.authenticate();
      
      // Double-check pattern: verify on backend
      const isValid = await PiConnectFlow.verifyOnBackend(auth);
      
      if (isValid) {
        setStatus("connected");
        setUsername(auth.user.username);
        toast.success(`Connected to Pi as ${auth.user.username}`);
      } else {
        throw new Error("Backend verification failed");
      }
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      toast.error(error.message || "Pi connection failed. Are you in the Pi Browser?");
    }
  };

  if (status === "connected") {
    return (
      <Button variant="secondary" className="gap-2 border-primary/50 text-primary">
        <CheckCircle className="h-4 w-4" />
        {username}
      </Button>
    );
  }

  return (
    <Button
      variant={status === "error" ? "danger" : "purple"}
      disabled={status === "connecting"}
      onClick={handleConnect}
      className="gap-2"
    >
      {status === "connecting" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : status === "error" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Shield className="h-4 w-4" />
      )}
      {status === "connecting" ? "Connecting..." : status === "error" ? "Retry Pi Connect" : "Connect Pi"}
    </Button>
  );
};
