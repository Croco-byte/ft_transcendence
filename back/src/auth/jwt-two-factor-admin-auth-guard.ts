import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export default class JwtTwoFactorAdminGuard extends AuthGuard('jwt-two-factor-admin') {}
