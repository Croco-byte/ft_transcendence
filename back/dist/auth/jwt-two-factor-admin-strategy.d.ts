import { Strategy } from "passport-jwt";
declare const JwtTwoFactorAdminStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtTwoFactorAdminStrategy extends JwtTwoFactorAdminStrategy_base {
    constructor();
    validate(payload: any): Promise<{
        id: number;
        username: string;
        is_admin: string;
    }>;
}
export {};
