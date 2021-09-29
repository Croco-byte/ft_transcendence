import { 
	Controller, 
	Post, 
	Get, 
	Put, 
	UseGuards, 
	Param, 
	Req, Res, 
	Body, 
	NotFoundException, 
	Query, 
	BadRequestException, 
	UseInterceptors, 
	UploadedFile, 
	ForbiddenException 
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import JwtTwoFactorGuard from "src/auth/jwt-two-factor-auth.guard";
import { GameService } from './game.service'

@Controller('/game')
export class GameController {
	constructor(
		private readonly userService: UsersService,
		private readonly gameService: GameService,
		) {}

	@Post('challenge/:userId')
	@UseGuards(JwtTwoFactorGuard)
	async privateGame(@Param('userId') userId: number) : Promise<string>
	{
		const newRoomId: string = await this.gameService.generateRoomId();
		await this.userService.updateRoomId(userId, newRoomId);
		return newRoomId;
	}

	@Post('joinChallenge/:friendId')
	@UseGuards(JwtTwoFactorGuard)
	async joinPrivateGame(@Param('friendId') friendId: number, @Body() body: any) : Promise<string>
	{
		await this.userService.updateRoomId(friendId, body.newRoomId.data);
		return body.newRoomId.data;
	}
}