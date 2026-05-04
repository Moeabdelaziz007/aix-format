/**
 * Pi Network Validation Rules
 * Validates Pi Network integration configuration
 */

import { isValidSemver } from '../validation-utils.js';

export const piNetworkRules = [
  {
    name: 'pi_network.app_id.required',
    check: (data) => {
      const pi = data.pi_network;
      return !pi || !!pi.app_id;
    },
    message: "Required field 'pi_network.app_id' is missing",
    section: 'pi_network',
    field: 'app_id'
  },
  
  {
    name: 'pi_network.environment.required',
    check: (data) => {
      const pi = data.pi_network;
      return !pi || !!pi.environment;
    },
    message: "Required field 'pi_network.environment' is missing",
    section: 'pi_network',
    field: 'environment'
  },
  
  {
    name: 'pi_network.environment.valid',
    check: (data) => {
      const env = data.pi_network?.environment;
      if (!env) return true;
      return ['sandbox', 'production'].includes(env);
    },
    message: 'Pi environment must be sandbox or production',
    section: 'pi_network',
    field: 'environment'
  },
  
  {
    name: 'pi_network.sdk_version.format',
    check: (data) => {
      const version = data.pi_network?.sdk_version;
      return !version || isValidSemver(version);
    },
    message: 'Invalid Pi SDK version format',
    section: 'pi_network',
    field: 'sdk_version'
  }
];

// Made with Bob
