// DTO for auth response

import { Role } from '@prisma/client';

export class AuthenResponseDto {
  accessToken: string;
  refreshToken: string;

  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: Role;
  };
}
