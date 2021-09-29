/* eslint-disable prettier/prettier */
import { Controller, Post, Get, Put, UseGuards, Param, Req, Res, Body, NotFoundException, Query, BadRequestException, UseInterceptors, UploadedFile, ForbiddenException } from "@nestjs/common";
import { paginate, Pagination } from "nestjs-typeorm-paginate";
import { from, map, Observable } from "rxjs";
import JwtTwoFactorGuard from "src/auth/jwt-two-factor-auth.guard";
import JwtTwoFactorAdminGuard from "src/auth/jwt-two-factor-admin-auth-guard";
import { FriendRequest, FriendRequestStatus } from "./friend-request.interface";
import { UserStatus, User_Status } from "./status.interface";
import { User } from "./users.entity";
import { UsersService } from "./users.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { UserWithRank } from "./user.interface";
import { MatchHistoryEntity } from "src/users/match-history.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";


@Controller('/user')
export class UserController {
	constructor(private readonly userService: UsersService, @InjectRepository(MatchHistoryEntity)
	private matchHistoryRepository: Repository<MatchHistoryEntity>,) {}

	/* ==== Endpoints related to the current user ==== */

	/* Returns current user ID */
	@Get()
	@UseGuards(JwtTwoFactorGuard)
	findCurrentUserId(@Req() req) {
		return {id: req.user.id};
	}

	/* Returns current user status */
	@Get('status/me')
	@UseGuards(JwtTwoFactorGuard)
	getCurrUserStatus(@Req() req): Observable<UserStatus> {
		return this.userService.getCurrUserStatus(req.user);
	}

	/* Returns current user avatar */
	@Get('avatar/me')
	@UseGuards(JwtTwoFactorGuard)
	async getCurrentUserAvatar(@Req() req, @Res() res) {
		const user = await User.findOne(({ where: { id: req.user.id } }));
		res.sendFile(user.avatar, { root: 'images' });
	}

	/* Returns public infos about the current user */
	@Get('info/me')
	@UseGuards(JwtTwoFactorGuard)
	async getCurrUserInfo(@Req() req) {
		try {
			const user = await User.findOne({ where: { id: req.user.id } });
			if (!user) {
				throw new NotFoundException();
			}
			delete user.twoFactorAuthenticationSecret;
			return user;
		} catch (e) {
			throw e;
		}
	}

	/* This shouldn't be implemented here, but idk why I can't inject the MatchHistoryEntity repository in the UsersService */
	@Get('history/me')
	@UseGuards(JwtTwoFactorGuard)
	getCurrUserHistory(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Query('username') username: string,
		@Req() req): Observable<Pagination<MatchHistoryEntity>> {
			return from(paginate(this.matchHistoryRepository, { page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/history/me' }, {
				where: [{ winner: req.user }, { looser: req.user }],
				relations: ['winner', 'looser'],
				order: {time: 'DESC'},
				select: ['id', 'winner', 'looser', 'winnerScore', 'looserScore', 'time', 'gameOptions', 'looserdisconnected']
			})).pipe(
				map((matchHistoryPageable: Pagination<MatchHistoryEntity>) => {
					var items = [];
					matchHistoryPageable.items.forEach(function(element) { 
						delete element.winner.twoFactorAuthenticationSecret;
						delete element.winner.isTwoFactorAuthenticationEnabled;
						delete element.looser.twoFactorAuthenticationSecret;
						delete element.looser.isTwoFactorAuthenticationEnabled;
						items.push(element);
					});
					var historyPageable: Pagination<MatchHistoryEntity> = {
						items: items,
						links: matchHistoryPageable.links,
						meta: matchHistoryPageable.meta
					};
					return historyPageable;
				})
			)
	}
// 
	/* Allows to change the current user display name */
	@Post('displayname')
	@UseGuards(JwtTwoFactorGuard)
	changeUserdisplayname(@Body('displayname') newdisplayname: string, @Req() req): Promise<string> {
		try {
			return this.userService.changeUserdisplayname(req.user.id, newdisplayname);
		} catch (e) {
			throw e;
		}
	}

	/* Updates the current user avatar (only allows jpg, jpeg, png and gif files ; limits the size of the file to 50MB*/
	@Post('avatar/update')
	@UseGuards(JwtTwoFactorGuard)
	@UseInterceptors(FileInterceptor('avatar', {
		limits: {
			fileSize: 5 * 10 * 10 * 10 * 10 * 10 * 10 * 10		// 50 MB max
		},
		storage: diskStorage({
			destination: './images',
		}),
		fileFilter: (req: Request, file, cb) => {
			if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
				return cb(new ForbiddenException('Only image files are allowed'), false);
			}
			return cb(null, true);
		}
	}))
	async saveAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
		try {
			await this.userService.updateAvatar(req.user.id, file.filename);
		} catch(e) {
			throw e;
		}
	}

	/* ==== Endpoint related to other users ==== */
	
	/* Paginated display of users (either all users, either filtered by display name) */
	@Get('users')
	// @UseGuards(JwtTwoFactorGuard)
	paginatedUsers(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Query('username') username: string
		): Promise<Pagination<User>> | Observable<Pagination<User>> {
		limit = limit > 100 ? 100 : limit;
		if (username == null) {
			return this.userService.paginateUsers({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/users' });
		} else {
			return this.userService.paginateUsersFilterBydisplayname({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/users' }, username);
		}
	}

	/* Paginated display of all users, ordered by score */
	@Get('users/leaderboard')
	paginateUsersOrderByScore(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
	): Promise<Pagination<UserWithRank>> {
		limit = limit > 100 ? 100 : limit;
		return this.userService.paginateUsersOrderByScore({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/users/leaderboard' });
	}

	/* Get public informations about a particular user (whose ID is in the URL) */
	@Get(':userId')
	@UseGuards(JwtTwoFactorGuard)
	async findUserById(@Param('userId') userStringId: string, @Req() req)
	{
		try
		{
			const userId = parseInt(userStringId);
			if (!userId) throw new BadRequestException();
			let ret = await this.userService.findUserById(userId);
			let user = await this.userService.findUserById(req.user.id);
			if (ret.blocked.findIndex(u => u.id == user.id) != -1
				|| user.blocked.findIndex(u => u.id == ret.id) != -1)
				ret["isBlocked"] = true;
			return (ret);
		}
		catch(e)
		{
			throw(e);
		}
	}

	/* Get the avatar located at a specified path (context : we got the informations about a particular user
	** with "findUserById", including the path of his avatar. We now request the avatar from this path)
	** No JWT Guard on this route
	*/
	@Post('/avatar')
	getUserAvatarFromPath(@Body() pathInfo: { path: string }, @Res() res) {
		try {
			res.sendFile(pathInfo.path, { root: 'images' })
		} catch {
			console.log("Couldn't find user avatar with path " + pathInfo.path);
			return new NotFoundException();
		}
	}

	/* Get the status of the specified user */
	@Get('status/:userid')
	@UseGuards(JwtTwoFactorGuard)
	getUserStatus(@Param('userid') userStringId: string): Observable<UserStatus> {
		const userId = parseInt(userStringId);
		if (!userId) throw new BadRequestException();
		return this.userService.getUserStatus(userId);
	}

	/* Change the status of the specified user */
	@Post('change-status/:userid')
	@UseGuards(JwtTwoFactorGuard)
	changeUserStatus(@Param('userid') userStringId: string, @Body('status') targetStatus: User_Status): void {
		try {
			const userId = parseInt(userStringId);
			if (!userId) throw new BadRequestException();
			this.userService.changeUserStatus(userId, targetStatus);
		} catch(e) {
			throw e;
		}
	}

	/* ==== Endpoints allowing to block or unblock a user from current user ====*/
	@Post('/:id/block')
	@UseGuards(JwtTwoFactorGuard)
	blockUser(@Param("id") blocked_id: number, @Req() req) {
		try
		{
			return this.userService.blockUser(req.user.id, blocked_id);
		}
		catch (e)
		{
			throw new ForbiddenException(e.message);
		}
	}

	@Post('/:id/unblock')
	@UseGuards(JwtTwoFactorGuard)
	unBlockUser(@Param("id") blocked_id: number, @Req() req) {
		try {
			return this.userService.unBlockUser(req.user.id, blocked_id);
		} catch (e) {
			throw new ForbiddenException(e.message);
		}
	}


	/* ==== Endpoints allowing to retrieve the friends and friend requests of current user ====*/

	/* Returns the friends of the current user */
	@Get('/friend-request/me/friends')
	@UseGuards(JwtTwoFactorGuard)
	paginatedFriends(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Req() req): Observable<Pagination<User>> {
		limit = limit > 100 ? 100 : limit;
		
		return this.userService.paginateFriends({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/friend-request/me/friends' }, req.user);
	}

	/* Returns the received friend requests of the current user */
	@Get('/friend-request/me/received-requests')
	@UseGuards(JwtTwoFactorGuard)
	paginatedFriendRequestsFromRecipients(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Req() req): Observable<Pagination<FriendRequest>> {
		return this.userService.paginateFriendRequestsFromRecipients({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/friend-request/me/received-requests' }, req.user);
	}

	/* Returns the send friend requests of the current user */
	@Get('/friend-request/me/sent-requests')
	@UseGuards(JwtTwoFactorGuard)
	paginatedFriendRequestsToRecipients(
		@Query('limit') limit: number = 10,
		@Query('page') page: number = 1,
		@Req() req): Observable<Pagination<FriendRequest>> {
			return this.userService.paginateFriendRequestsToRecipients({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/friend-request/me/sent-requests' }, req.user);
	}


	/* ==== Endpoint allowing to interact with friend requests */

	/* Allows to send a friend requests to the user whose ID is specified in the URL */
	@Post('friend-request/send/:receiverId')
	@UseGuards(JwtTwoFactorGuard)
	sendFriendRequest(@Param('receiverId') receiverStringId: string, @Req() req): Promise<FriendRequest> {
		const receiverId = parseInt(receiverStringId);
		return this.userService.sendFriendRequest(receiverId, req.user);
	}

	/* Get the friend request status between the current user and the user whose ID is specified in the URL */
	@Get('/friend-request/status/:receiverId')
	@UseGuards(JwtTwoFactorGuard)
	getFriendRequestStatus(@Param('receiverId') receiverStringId: string, @Req() req): Promise<FriendRequestStatus> {
		const receiverId = parseInt(receiverStringId);
		if (!receiverId) throw new BadRequestException();
		return this.userService.getFriendRequestStatus(receiverId, req.user);
	}

	/* Allows to respond to a friend request */
	@Put('/friend-request/response/:friendRequestId')
	@UseGuards(JwtTwoFactorGuard)
	respondToFriendRequest(@Param('friendRequestId') friendRequestStringId: string, @Body() responseStatus: FriendRequestStatus): Promise<FriendRequestStatus> {
		const friendRequestId = parseInt(friendRequestStringId);
		if (!friendRequestId) throw new BadRequestException();
		return this.userService.respondToFriendRequest(friendRequestId, responseStatus.status);
	}


	/* ==== Endpoints related to website administration  ==== */

	@Get('/administration/blocked_users')
	@UseGuards(JwtTwoFactorAdminGuard)
	async getWebsiteBlockedUsers(@Query('limit') limit: number = 10, @Query('page') page: number = 1): Promise<Pagination<User>> {
		return this.userService.getWebsiteBlockedUsersPaginated({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/administration/blocked_users' })
	}

	@Post('/administration/block_user')
	@UseGuards(JwtTwoFactorAdminGuard)
	async blockWebsiteUser(@Body() data: {targetUserId: number}, @Req() req): Promise<void> {
		const user = await this.userService.findUserById(data.targetUserId);
		if (user.is_admin !== "owner" && data.targetUserId !== req.user.id) return this.userService.blockWebsiteUser(data.targetUserId);
		else if (data.targetUserId === req.user.id) throw new ForbiddenException("You can't block yourself !");
		else throw new ForbiddenException("You can't block the website owner !");
	}

	@Post('/administration/unblock_user')
	@UseGuards(JwtTwoFactorAdminGuard)
	async unblockWebsiteUser(@Body() data: {targetUserId: number}, @Req() req): Promise<void> {
		return this.userService.unblockWebsiteUser(data.targetUserId);
	}

	@Get('/administration/owner')
	@UseGuards(JwtTwoFactorAdminGuard)
	async getWebsiteOwner(): Promise<User> {
		return await this.userService.getWebsiteOwner();
	}

	@Get('/administration/moderators')
	@UseGuards(JwtTwoFactorAdminGuard)
	getWebsiteModerators( @Query('limit') limit: number = 10, @Query('page') page: number = 1,): Promise<Pagination<User>> {
		return this.userService.getWebsiteModerators({ page: Number(page), limit: Number(limit), route: 'http://127.0.0.1:3000/user/administration/moderators' });
	}

	@Post('/administration/make_moderator')
	@UseGuards(JwtTwoFactorAdminGuard)
	async makeWebsiteModerator(@Body() data: {targetUserId: number}, @Req() req): Promise<void> {
		const user = await this.userService.findUserById(data.targetUserId);
		if (user.is_admin !== "owner") return this.userService.makeUserModerator(data.targetUserId);
		else throw new ForbiddenException("You can't make the website owner a moderator");
	}

	@Post('/administration/make_regular')
	@UseGuards(JwtTwoFactorAdminGuard)
	async makeuserRegular(@Body() data: {targetUserId: number}, @Req() req): Promise<void> {
		const user = await this.userService.findUserById(data.targetUserId);
		if (user.is_admin !== "owner") return this.userService.makeUserRegular(data.targetUserId);
		else throw new ForbiddenException("You can't make the website owner a regular user");
	}


}
