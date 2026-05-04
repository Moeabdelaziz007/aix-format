/**
 * Economics Validation Rules
 * Validates Pi smart contracts, wallets, payment gateways, delegation, and treasury
 */

export const economicsRules = [
  // Pi Smart Contract
  {
    name: 'economics.pi_smart_contract.address.required',
    check: (data) => {
      const psc = data.economics?.pi_smart_contract;
      return !psc || !!psc.address;
    },
    message: "Pi smart contract requires an 'address'",
    section: 'economics.pi_smart_contract',
    field: 'address'
  },
  
  {
    name: 'economics.pi_smart_contract.network.valid',
    check: (data) => {
      const network = data.economics?.pi_smart_contract?.network;
      if (!network) return true;
      return ['pi-mainnet', 'pi-testnet', 'sandbox'].includes(network);
    },
    message: "Network must be 'pi-mainnet', 'pi-testnet', or 'sandbox'",
    section: 'economics.pi_smart_contract',
    field: 'network'
  },
  
  // Wallets
  {
    name: 'economics.wallets.type',
    check: (data) => {
      const wallets = data.economics?.wallets;
      return !wallets || Array.isArray(wallets);
    },
    message: 'wallets must be an array',
    section: 'economics',
    field: 'wallets'
  },
  
  {
    name: 'economics.wallets.required_fields',
    check: (data) => {
      const wallets = data.economics?.wallets;
      if (!wallets || !Array.isArray(wallets)) return true;
      return wallets.every(w => w.chain && w.address);
    },
    message: 'Wallet requires chain and address',
    section: 'economics.wallets'
  },
  
  // Payment Gateways
  {
    name: 'economics.payment_gateways.stripe_acp.merchant_id',
    check: (data) => {
      const stripe = data.economics?.payment_gateways?.stripe_acp;
      return !stripe || !stripe.enabled || !!stripe.merchant_id;
    },
    message: 'Stripe ACP enabled without merchant_id',
    section: 'economics.payment_gateways',
    field: 'stripe_acp.merchant_id',
    severity: 'warning'
  },
  
  {
    name: 'economics.payment_gateways.paypal_ap2.mandate_id',
    check: (data) => {
      const paypal = data.economics?.payment_gateways?.paypal_ap2;
      return !paypal || !paypal.enabled || !!paypal.mandate_id;
    },
    message: 'PayPal AP2 enabled without mandate_id',
    section: 'economics.payment_gateways',
    field: 'paypal_ap2.mandate_id',
    severity: 'warning'
  },
  
  // Delegation
  {
    name: 'economics.delegation.max_depth',
    check: (data) => {
      const del = data.economics?.delegation;
      return !del || !del.allow_recursive || del.max_depth <= 5;
    },
    message: 'Max delegation depth > 5 may increase security risk',
    section: 'economics.delegation',
    severity: 'warning'
  },
  
  // Treasury
  {
    name: 'economics.treasury.flash_loan_arbitrage',
    check: (data) => {
      const tre = data.economics?.treasury;
      if (!tre || !tre.flash_loan_arbitrage_enabled) return true;
      return !!data.security?.guardian_logic?.mempool_monitor;
    },
    message: 'Flash loan arbitrage enabled without guardian mempool monitor',
    section: 'economics.treasury',
    severity: 'warning'
  }
];

// Made with Bob
