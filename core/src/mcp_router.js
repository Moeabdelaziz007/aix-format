/**
 * MCP Revenue Router & Dynamic Pricing Module
 *
 * Acts as an intelligent proxy between clients and MCP servers.
 * It selects the best server based on pricing (budget), performance,
 * ABOM risk scores, and manages revenue splitting.
 *
 * Copyright © 2026 Mohamed H Abdelaziz / AMRIKYY AI Solutions
 */

import { TokenBucket } from './security/token_bucket.js';

export class MCPRouter {
  /**
   * Initialize the MCP Router.
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    this.defaultRiskThreshold = options.defaultRiskThreshold || 5.0; // Max acceptable risk
    this.platformFeePercentage = options.platformFeePercentage || 0.05; // 5% platform fee
    this.buckets = new Map(); // Store TokenBuckets per client ID
  }

  /**
   * Ensure a client has a configured rate limit bucket
   * @param {string} clientId
   * @param {number} capacity
   * @param {number} refillRate
   * @returns {TokenBucket}
   */
  getOrCreateBucket(clientId, capacity = 100, refillRate = 10) {
    if (!this.buckets.has(clientId)) {
      this.buckets.set(clientId, new TokenBucket(capacity, refillRate));
    }
    return this.buckets.get(clientId);
  }

  /**
   * Calculate revenue split for a transaction.
   * @param {number} totalAmount Total cost paid by the client
   * @returns {Object} Revenue split details
   */
  calculateRevenueSplit(totalAmount) {
    const platformFee = totalAmount * this.platformFeePercentage;
    const developerRevenue = totalAmount - platformFee;

    return {
      total: totalAmount,
      platformFee,
      developerRevenue
    };
  }

  /**
   * Route a request to the best available MCP server.
   * Evaluates servers based on cost, ABOM risk, and client budget.
   *
   * @param {Object} request Details of the request
   * @param {string} request.clientId Client identifier
   * @param {number} request.maxBudget Maximum willing to pay per request
   * @param {number} [request.maxRisk] Maximum acceptable ABOM risk score
   * @param {Array<Object>} servers List of available MCP servers
   * @returns {Object} Routing result including selected server and economics
   */
  routeRequest(request, servers) {
    if (!servers || servers.length === 0) {
      throw new Error("No MCP servers available for routing.");
    }

    const { clientId, maxBudget, maxRisk = this.defaultRiskThreshold } = request;

    // 1. Rate Limiting Check
    const bucket = this.getOrCreateBucket(clientId);
    if (!bucket.tryConsume(1)) {
      const waitTime = bucket.getWaitTime(1);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime)}ms`);
    }

    // 2. Filter servers based on strict constraints (Budget and ABOM Risk)
    const eligibleServers = servers.filter(server => {
      // Ensure the server's price is within client's budget
      const isWithinBudget = server.pricing.costPerCall <= maxBudget;
      // Ensure the server's risk score is acceptable
      const isAcceptableRisk = server.abom && server.abom.riskScore <= maxRisk;

      return isWithinBudget && isAcceptableRisk;
    });

    if (eligibleServers.length === 0) {
      throw new Error("No eligible servers found matching budget and risk criteria.");
    }

    // 3. Dynamic Selection Logic (Heuristic: Lowest Cost -> Lowest Risk -> Highest Performance)
    // For this implementation, we score servers: lower score is better.
    // Score = (CostWeight * Cost) + (RiskWeight * Risk) - (UptimeWeight * Uptime)
    const costWeight = 1.0;
    const riskWeight = 0.5;

    let bestServer = null;
    let bestScore = Infinity;

    for (const server of eligibleServers) {
      const score = (server.pricing.costPerCall * costWeight) +
                    (server.abom.riskScore * riskWeight);

      if (score < bestScore) {
        bestScore = score;
        bestServer = server;
      }
    }

    // 4. Calculate Economics / Revenue Distribution
    const revenueSplit = this.calculateRevenueSplit(bestServer.pricing.costPerCall);

    return {
      status: "success",
      selectedServer: {
        id: bestServer.id,
        url: bestServer.url,
        did: bestServer.did
      },
      economics: {
        currency: bestServer.pricing.currency || "PI",
        split: revenueSplit
      },
      routingReason: `Selected based on optimal cost (${bestServer.pricing.costPerCall}) and risk score (${bestServer.abom.riskScore}).`
    };
  }
}
