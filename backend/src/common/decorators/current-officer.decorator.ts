import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Gender, IdentityCardType } from '@prisma/client';

export interface AuthenticatedOfficer {
  id: string;
  username: string;
  fullName: string;
  idType: IdentityCardType;
  idNumber: string;
  issuingAuthority: string;
  issueDate: Date;
  gender: Gender;
  birthYear: number;
}

export const CurrentOfficer = createParamDecorator(
  (
    data: keyof AuthenticatedOfficer | undefined,
    ctx: ExecutionContext,
  ): unknown => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedOfficer }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
