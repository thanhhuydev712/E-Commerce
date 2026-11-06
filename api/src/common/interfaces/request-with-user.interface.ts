import type { Request } from 'express';
export interface Principal {
  id: string;
  sessionId: string;
  email: string;
  roleCodes: string[];
  permissions: string[];
}
export interface AuthenticatedRequest extends Request {
  user: Principal;
  requestId: string;
}
