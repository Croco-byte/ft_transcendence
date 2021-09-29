import { UsersService } from "../users/users.service";
import { GameService } from './game.service';
export declare class GameController {
    private readonly userService;
    private readonly gameService;
    constructor(userService: UsersService, gameService: GameService);
    privateGame(userId: number): Promise<string>;
    joinPrivateGame(friendId: number, body: any): Promise<string>;
}
