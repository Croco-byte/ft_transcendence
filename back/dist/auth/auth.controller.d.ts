import { AuthService } from "./auth.service";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    authenticateUser(code: string, state: string): Promise<{
        username?: string;
        accessToken?: string;
        twoFARedirect?: boolean;
    }>;
    registerUserBasicAuth(username: string, password: string): Promise<import("../users/users.entity").User>;
    loginUserBasicAuth(username: string, password: string): Promise<{
        username?: string;
        accessToken?: string;
        twoFARedirect?: boolean;
    }>;
}
