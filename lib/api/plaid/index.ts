import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Get Plaid environment from env vars
const plaidEnv = process.env.PLAID_ENV || 'sandbox';

// Map environment string to Plaid environment
const getPlaidEnvironment = () => {
  switch (plaidEnv.toLowerCase()) {
    case 'production':
      return PlaidEnvironments.production;
    case 'development':
      return PlaidEnvironments.development;
    case 'sandbox':
    default:
      return PlaidEnvironments.sandbox;
  }
};

// Create Plaid configuration
const configuration = new Configuration({
  basePath: getPlaidEnvironment(),
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

// Export Plaid client
export const plaidClient = new PlaidApi(configuration);

// Export environment for reference
export const PLAID_ENV = plaidEnv;

