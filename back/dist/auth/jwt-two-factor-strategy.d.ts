import { Strategy } from "passport-jwt";
declare const JwtTwoFactorStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtTwoFactorStrategy extends JwtTwoFactorStrategy_base {
    constructor();
    validate(payload: any): Promise<{
        id: number;
        username: string;
        is_admin: string;
    }>;
}
export {};
