import { UsersService } from "src/users/users.service";
export declare class RankingController {
    private userService;
    constructor(userService: UsersService);
    getRanking(): Promise<import("../users/users.entity").User[]>;
}
