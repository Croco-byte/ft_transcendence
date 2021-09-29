import { 
	Controller, 
	Post, 
	UseGuards, 
	Param, 
	Body, 
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import JwtTwoFactorGuard from "src/auth/jwt-two-factor-auth.guard";
import { GameService } from './game.service'
import { Logger } from '@nestjs/common';
import { User } from '../users/users.entity'

@Controller('/game')
export class GameController {
	constructor(
		private readonly userService: UsersService,
		private readonly gameService: GameService,
		) {}
	private logger: Logger = new Logger('GameController');

	@Post('challenge/:userId')
	@UseGuards(JwtTwoFactorGuard)
	async privateGame(@Param('userId') userId: number) : Promise<string>
	{
		try {
			const user: User = await this.userService.findUserById(userId);

			if (user.roomId === 'none') {
				const newRoomId: string = await this.gameService.generateRoomId();
				await this.userService.updateRoomId(userId, newRoomId);
				return newRoomId;
			}
			return undefined;
		}
		catch {
			this.logger.log(`Couldn't find user (userId: ${userId})`);
		}
	}

	@Post('joinChallenge/:friendId')
	@UseGuards(JwtTwoFactorGuard)
	async joinPrivateGame(@Param('friendId') friendId: number, @Body() body: any) : Promise<string>
	{
		try {
			const user: User = await this.userService.findUserById(friendId);

			if (user.roomId === 'none') {
				await this.userService.updateRoomId(friendId, body.newRoomId);
				return body.newRoomId;
			}
			return undefined;
		}
		catch {
			this.logger.log(`Couldn't find user (userId: ${friendId})`);
		}
	}
}