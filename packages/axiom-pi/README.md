# @axiom/pi

Sovereign Pi Network integration for the AIX (Artificial Intelligence eXchange) Protocol.

## Modules

- **Auth**: Authenticate users using the Pi SDK (browser) or verify tokens (server).
- **KYC**: Verify Pi Network KYC status and generate AIX-compliant identity layers.
- **Payment**: Create and manage Pi Network payments.
- **Env**: Secure environment variable management for Pi integration.

## Usage

```typescript
import { authenticateUser, verifyKyc } from '@axiom/pi';

// Authenticate user
const { user, accessToken } = await authenticateUser();

// Verify KYC
const kycResult = await verifyKyc({
  user: { uid: user.uid },
  accessToken
});
```

## Made with Soul by Mohamed H Abdelaziz
