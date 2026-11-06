import { Throttle } from '@nestjs/throttler';

// Strict rate for auth, payments
export const StrictThrottle = () =>
  Throttle({
    default: {
      ttl: 1000,
      limit: 3,
    },
  });
// Moderata rate for orders
export const ModerateThrottle = () =>
  Throttle({
    default: {
      ttl: 1000,
      limit: 5,
    },
  });

export const RelaxedThrottle = () =>
  Throttle({
    default: {
      ttl: 1000,
      limit: 20,
    },
  });
