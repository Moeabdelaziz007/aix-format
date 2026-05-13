/**
 * Pricing Validation Rules
 * Validates pricing models, currencies, and cost structures
 */

export const pricingRules = [
  {
    name: 'pricing.currency.valid',
    check: (data) => {
      const currency = data.pricing?.currency || data.economics?.pricing?.currency;
      if (!currency) return true;
      const valid = ['USD', 'EUR', 'BTC', 'ETH', 'PI'];
      return valid.includes(currency);
    },
    message: (data) => {
      const currency = data.pricing?.currency || data.economics?.pricing?.currency;
      const valid = ['USD', 'EUR', 'BTC', 'ETH', 'PI'];
      return `Currency '${currency}' is not in the standard list: ${valid.join(', ')}`;
    },
    section: 'pricing',
    field: 'currency',
    severity: 'warning'
  },
  
  {
    name: 'pricing.model.valid',
    check: (data) => {
      const model = data.pricing?.model || data.economics?.pricing?.model;
      if (!model) return true;
      const valid = ['pay_per_call', 'subscription', 'freemium', 'tiered'];
      return valid.includes(model);
    },
    message: (data) => {
      const valid = ['pay_per_call', 'subscription', 'freemium', 'tiered'];
      return `Pricing model must be one of: ${valid.join(', ')}`;
    },
    section: 'pricing',
    field: 'model'
  },
  
  {
    name: 'pricing.cost_per_call.amount',
    check: (data) => {
      const amount = data.pricing?.cost_per_call?.amount || data.economics?.pricing?.cost_per_call?.amount;
      return amount === undefined || (typeof amount === 'number' && amount >= 0);
    },
    message: 'Cost amount must be a non-negative number',
    section: 'pricing.cost_per_call',
    field: 'amount'
  },
  
  {
    name: 'pricing.subscription.monthly_fee.amount',
    check: (data) => {
      const amount = data.pricing?.subscription?.monthly_fee?.amount || 
                     data.economics?.pricing?.subscription?.monthly_fee?.amount;
      return amount === undefined || (typeof amount === 'number' && amount >= 0);
    },
    message: 'Monthly fee amount must be a non-negative number',
    section: 'pricing.subscription.monthly_fee',
    field: 'amount'
  },
  
  {
    name: 'pricing.subscription.included_calls',
    check: (data) => {
      const calls = data.pricing?.subscription?.included_calls || 
                    data.economics?.pricing?.subscription?.included_calls;
      return calls === undefined || (Number.isInteger(calls) && calls >= 0);
    },
    message: 'Included calls must be a non-negative integer',
    section: 'pricing.subscription',
    field: 'included_calls'
  }
];

// Made with Moe Abdelaziz
