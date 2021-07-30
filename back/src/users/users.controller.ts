import { Controller, Post, Get, Put, UseGuards, Param, Req, Res, Body, NotFoundException, Query } from "@nestjs/common";
import { Pagination } from "nestjs-typeorm-paginate";
import { Observable } from "rxjs";
import JwtTwoFactorGuard from "src/auth/jwt-two-factor-auth.guard";
import { FriendRequest, FriendRequestStatus } from "./friend-request.interface";
import { User } from "./users.entity";
import { UsersService } from "./users.service";

@Controller('/user')
export class UserController {
	constructor(private readonly userService: UsersService) {}

	@Get()
	@UseGuards(JwtTwoFactorGuard)
	findCurrentUserId(@Req() req) {
		return {id: req.user.id};
	}

	@Get('all')
	@UseGuards(JwtTwoFactorGuard)
	index(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Query('username') username: string
		): Observable<Pagination<User>> {
		limit = limit > 100 ? 100 : limit;
		if (username == null) {
			return this.userService.paginate({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/all' });
		} else {
			return this.userService.paginateFilterByUsername({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/all' }, username);
		}

	}

	@Get(':userId')
	@UseGuards(JwtTwoFactorGuard)
	findUserById(@Param('userId') userStringId: string) {
		try {
			const userId = parseInt(userStringId);
			if (!userId) {
				throw new NotFoundException();
			}
			return this.userService.findUserById(userId);
		} catch(e) {
			throw(e);
		}
	}

	@Post('/avatar')
	@UseGuards(JwtTwoFactorGuard)
	getUserAvatarFromPath(@Body() pathInfo: { path: string }, @Res() res) {
		try {
			res.sendFile(pathInfo.path, { root: 'images' })
		} catch {
			console.log("Couldn't find user avatar with path " + pathInfo.path);
			return new NotFoundException();
		}
	}

	@Post('friend-request/send/:receiverId')
	@UseGuards(JwtTwoFactorGuard)
	sendFriendRequest(@Param('receiverId') receiverStringId: string, @Req() req): Observable<FriendRequest | { error: string }> {
		const receiverId = parseInt(receiverStringId);
		return this.userService.sendFriendRequest(receiverId, req.user);
	}

	@Get('/friend-request/status/:receiverId')
	@UseGuards(JwtTwoFactorGuard)
	getFriendRequestStatus(@Param('receiverId') receiverStringId: string, @Req() req): Observable<FriendRequestStatus> {
		const receiverId = parseInt(receiverStringId);
		return this.userService.getFriendRequestStatus(receiverId, req.user);
	}

	@Put('/friend-request/response/:friendRequestId')
	@UseGuards(JwtTwoFactorGuard)
	respondToFriendRequest(@Param('friendRequestId') friendRequestStringId: string, @Body() responseStatus: FriendRequestStatus): Observable<FriendRequestStatus> {
		const friendRequestId = parseInt(friendRequestStringId);
		return this.userService.respondToFriendRequest(friendRequestId, responseStatus.status);
	}

	@Get('/friend-request/me/received-requests')
	@UseGuards(JwtTwoFactorGuard)
	getFriendRequestsFromRecipients(@Req() req): Observable<FriendRequest[]> {
		return this.userService.getFriendRequestsFromRecipients(req.user);
	}

	@Get('/friend-request/me/sent-requests')
	@UseGuards(JwtTwoFactorGuard)
	getFriendRequestsToRecipients(@Req() req): Observable<FriendRequest[]> {
		return this.userService.getFriendRequestsToRecipients(req.user);
	}

	@Get('/friend-request/me/friends')
	@UseGuards(JwtTwoFactorGuard)
	getFriends(@Req() req): Observable<User[]> {
		return this.userService.getFriends(req.user);
	}
}
