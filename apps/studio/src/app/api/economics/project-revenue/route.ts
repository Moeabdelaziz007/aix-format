import { NextRequest } from 'next/server';
import { requireAuth, successResponse, ERR, parseBody } from '@/lib/api-helpers';

/**
 * POST /api/economics/project-revenue
 * 
 * Calculates revenue projections for Pi Network agents.
 * 
 * Features:
 * - Accepts pricing models, user estimates, and usage patterns
 * - Applies Pi price in USD conversion
 * - Generates monthly and yearly revenue estimates
 * - Provides break-even analysis
 * - Returns time-series chart data
 * 
 * SECURITY: Requires authentication
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    // 2. Parse request body
    const { body, error: parseError } = await parseBody<{
      pricingModel: 'free' | 'freemium' | 'subscription' | 'pay_per_use';
      pricing: {
        freeUsers?: number;
        paidUsers?: number;
        subscriptionPrice?: number; // in Pi
        usagePrice?: number; // in Pi per transaction
        transactionsPerUser?: number;
      };
      userEstimates: {
        month1: number;
        month3: number;
        month6: number;
        month12: number;
      };
      costs: {
        development?: number; // in USD
        infrastructure?: number; // in USD per month
        marketing?: number; // in USD per month
        other?: number; // in USD per month
      };
      piPriceUSD?: number; // Current Pi price in USD
    }>(req);
    
    if (parseError) return parseError;

    if (!body) {
      return ERR.VALIDATION('Request body is required');
    }

    const {
      pricingModel,
      pricing,
      userEstimates,
      costs,
      piPriceUSD = 100, // Default Pi price estimate
    } = body;

    // 3. Validate required fields
    if (!pricingModel || !pricing || !userEstimates) {
      return ERR.VALIDATION('pricingModel, pricing, and userEstimates are required');
    }

    // 4. Calculate revenue projections
    const projections = calculateProjections(
      pricingModel,
      pricing,
      userEstimates,
      piPriceUSD
    );

    // 5. Calculate costs
    const monthlyCosts = calculateMonthlyCosts(costs);

    // 6. Calculate break-even analysis
    const breakEven = calculateBreakEven(
      projections,
      monthlyCosts,
      costs.development || 0
    );

    // 7. Generate time-series data for charts
    const timeSeries = generateTimeSeries(
      projections,
      monthlyCosts,
      userEstimates
    );

    // 8. Return comprehensive revenue analysis
    return successResponse({
      pricingModel,
      projections: {
        monthly: projections.monthly,
        yearly: projections.yearly,
        currency: {
          pi: projections.pi,
          usd: projections.usd,
        },
      },
      costs: {
        monthly: monthlyCosts,
        yearly: monthlyCosts * 12,
        development: costs.development || 0,
      },
      breakEven: {
        months: breakEven.months,
        users: breakEven.users,
        revenue: breakEven.revenue,
      },
      metrics: {
        grossMargin: calculateGrossMargin(projections.monthly.usd, monthlyCosts),
        roi: calculateROI(projections.yearly.usd, costs.development || 0, monthlyCosts * 12),
        paybackPeriod: breakEven.months,
      },
      timeSeries,
      assumptions: {
        piPriceUSD,
        conversionRate: pricing.paidUsers 
          ? (pricing.paidUsers / (pricing.freeUsers || 1 + pricing.paidUsers)) * 100
          : 0,
      },
    });

  } catch (error: any) {
    console.error('[economics/project-revenue] Calculation failed:', error);
    return ERR.INTERNAL('Failed to calculate revenue projections: ' + error.message);
  }
}

/**
 * Calculate revenue projections based on pricing model
 */
function calculateProjections(
  model: string,
  pricing: any,
  userEstimates: any,
  piPriceUSD: number
) {
  let monthlyRevenuePi = 0;
  let yearlyRevenuePi = 0;

  switch (model) {
    case 'free':
      // No direct revenue, could add ad revenue later
      monthlyRevenuePi = 0;
      yearlyRevenuePi = 0;
      break;

    case 'freemium':
      // Revenue from paid users only
      const paidUsers = pricing.paidUsers || 0;
      const subscriptionPrice = pricing.subscriptionPrice || 0;
      monthlyRevenuePi = paidUsers * subscriptionPrice;
      yearlyRevenuePi = monthlyRevenuePi * 12;
      break;

    case 'subscription':
      // All users pay subscription
      const totalUsers = userEstimates.month1 || 0;
      const subPrice = pricing.subscriptionPrice || 0;
      monthlyRevenuePi = totalUsers * subPrice;
      yearlyRevenuePi = monthlyRevenuePi * 12;
      break;

    case 'pay_per_use':
      // Revenue based on transactions
      const users = userEstimates.month1 || 0;
      const txPerUser = pricing.transactionsPerUser || 0;
      const txPrice = pricing.usagePrice || 0;
      monthlyRevenuePi = users * txPerUser * txPrice;
      yearlyRevenuePi = monthlyRevenuePi * 12;
      break;
  }

  return {
    monthly: {
      pi: monthlyRevenuePi,
      usd: monthlyRevenuePi * piPriceUSD,
    },
    yearly: {
      pi: yearlyRevenuePi,
      usd: yearlyRevenuePi * piPriceUSD,
    },
    pi: {
      monthly: monthlyRevenuePi,
      yearly: yearlyRevenuePi,
    },
    usd: {
      monthly: monthlyRevenuePi * piPriceUSD,
      yearly: yearlyRevenuePi * piPriceUSD,
    },
  };
}

/**
 * Calculate monthly operational costs
 */
function calculateMonthlyCosts(costs: any): number {
  return (
    (costs.infrastructure || 0) +
    (costs.marketing || 0) +
    (costs.other || 0)
  );
}

/**
 * Calculate break-even point
 */
function calculateBreakEven(
  projections: any,
  monthlyCosts: number,
  developmentCosts: number
) {
  const monthlyProfit = projections.monthly.usd - monthlyCosts;
  
  if (monthlyProfit <= 0) {
    return {
      months: Infinity,
      users: Infinity,
      revenue: Infinity,
    };
  }

  const monthsToBreakEven = Math.ceil(developmentCosts / monthlyProfit);
  const revenueAtBreakEven = monthsToBreakEven * projections.monthly.usd;
  const usersAtBreakEven = monthsToBreakEven * 100; // Simplified

  return {
    months: monthsToBreakEven,
    users: usersAtBreakEven,
    revenue: revenueAtBreakEven,
  };
}

/**
 * Generate time-series data for charts
 */
function generateTimeSeries(
  projections: any,
  monthlyCosts: number,
  userEstimates: any
) {
  const months = [1, 3, 6, 12];
  const userGrowth = [
    userEstimates.month1,
    userEstimates.month3,
    userEstimates.month6,
    userEstimates.month12,
  ];

  return months.map((month, index) => {
    const users = userGrowth[index] || 0;
    const growthFactor = users / (userEstimates.month1 || 1);
    const revenue = projections.monthly.usd * growthFactor;
    const costs = monthlyCosts * month;
    const profit = revenue - costs;

    return {
      month,
      users,
      revenue,
      costs,
      profit,
      cumulativeProfit: profit * month,
    };
  });
}

/**
 * Calculate gross margin percentage
 */
function calculateGrossMargin(revenue: number, costs: number): number {
  if (revenue === 0) return 0;
  return ((revenue - costs) / revenue) * 100;
}

/**
 * Calculate ROI percentage
 */
function calculateROI(
  yearlyRevenue: number,
  developmentCosts: number,
  yearlyCosts: number
): number {
  const totalCosts = developmentCosts + yearlyCosts;
  if (totalCosts === 0) return 0;
  return ((yearlyRevenue - totalCosts) / totalCosts) * 100;
}

// Made with Bob