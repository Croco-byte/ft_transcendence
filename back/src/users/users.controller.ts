import { Controller, Post, Get, Put, UseGuards, Param, Req, Res, Body, NotFoundException, Query, BadRequestException } from "@nestjs/common";
import { Pagination } from "nestjs-typeorm-paginate";
import { Observable } from "rxjs";
import JwtTwoFactorGuard from "src/auth/jwt-two-factor-auth.guard";
import { FriendRequest, FriendRequestStatus } from "./friend-request.interface";
import { UserStatus } from "./status/status.interface";
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

	@Get('/friend-request/me/friends')
	@UseGuards(JwtTwoFactorGuard)
	paginatedFriends(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Req() req): Observable<Pagination<User>> {
		limit = limit > 100 ? 100 : limit;
		
		return this.userService.paginateFriends({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/friend-request/me/friends' }, req.user);
	}

	@Get('/friend-request/me/received-requests')
	@UseGuards(JwtTwoFactorGuard)
	paginatedFriendRequestsFromRecipients(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Req() req): Observable<Pagination<FriendRequest>> {
		return this.userService.paginateFriendRequestsFromRecipients({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/friend-request/me/received-requests' }, req.user);
	}

	@Get('/friend-request/me/sent-requests')
	@UseGuards(JwtTwoFactorGuard)
	paginatedFriendRequestsToRecipients(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Req() req): Observable<Pagination<FriendRequest>> {
			return this.userService.paginateFriendRequestsToRecipients({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/friend-request/me/sent-requests' }, req.user);
	}

	@Get('users')
	@UseGuards(JwtTwoFactorGuard)
	paginatedUsers(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Query('username') username: string
		): Observable<Pagination<User>> {
		limit = limit > 100 ? 100 : limit;
		if (username == null) {
			return this.userService.paginateUsers({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/users' });
		} else {
			return this.userService.paginateUsersFilterByUsername({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/users' }, username);
		}
	}

	@Post('unfriend/:friendId')
	@UseGuards(JwtTwoFactorGuard)
	unfriendUser(@Param('friendId') friendStringId, @Req() req) {
		try {
			const friendId = parseInt(friendStringId);
			if (!friendId) {
				throw new BadRequestException();
			}
			this.userService.unfriendUser(req.user, friendId);
		} catch(e) {
			throw e;
		}

	}



	@Get(':userId')
	@UseGuards(JwtTwoFactorGuard)
	findUserById(@Param('userId') userStringId: string) {
		try {
			const userId = parseInt(userStringId);
			if (!userId) throw new BadRequestException();
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
		if (!receiverId) throw new BadRequestException();
		return this.userService.getFriendRequestStatus(receiverId, req.user);
	}

	@Put('/friend-request/response/:friendRequestId')
	@UseGuards(JwtTwoFactorGuard)
	respondToFriendRequest(@Param('friendRequestId') friendRequestStringId: string, @Body() responseStatus: FriendRequestStatus): Observable<FriendRequestStatus> {
		const friendRequestId = parseInt(friendRequestStringId);
		return this.userService.respondToFriendRequest(friendRequestId, responseStatus.status);
	}

	@Get('status/me')
	@UseGuards(JwtTwoFactorGuard)
	getCurrUserStatus(@Req() req): Observable<UserStatus> {
		return this.userService.getCurrUserStatus(req.user);
	}

	@Get('status/:userid')
	@UseGuards(JwtTwoFactorGuard)
	getUserStatus(@Param('userid') userStringId: string): Observable<UserStatus> {
		const userId = parseInt(userStringId);
		if (!userId) throw new BadRequestException();
		return this.userService.getUserStatus(userId);
	}

	@Post('change-status')
	@UseGuards(JwtTwoFactorGuard)
	changeCurrUserStatus(@Body('status') targetStatus: UserStatus, @Req() req): void {
		this.userService.changeCurrUserStatus(targetStatus, req.user.id)
	}
}
