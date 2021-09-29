/* eslint-disable prettier/prettier */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, map } from 'rxjs';
import { Like, Raw, Repository, getConnection, MoreThan } from 'typeorm';
import { FriendRequest, FriendRequestStatus, FriendRequest_Status } from './friend-request.interface';
import { FriendRequestEntity } from './friends-request.entity';
import { User } from './users.entity';
import { UserWithRank } from './user.interface';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { UserStatus, User_Status } from './status.interface';
import { unlink } from 'fs';
import { Logger } from '@nestjs/common'
import ChannelService from 'src/channels/channel.service';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User) 
		private usersRepository: Repository<User>,
		@InjectRepository(FriendRequestEntity) 
		private friendRequestRepository: Repository<FriendRequestEntity>,
		) {}

		private logger: Logger = new Logger('UsersService');

	/*
	** ==== Functions related to the Two Factor Authentication ====
	*/

	/* Explicit */
	async setTwoFactorAuthenticationSecret(secret: string, id: number) {
		return this.usersRepository.update(id, { twoFactorAuthenticationSecret: secret });
	}

	/* Explicit */
	async turnOnTwoFactorAuthentication(id: number) {
		return this.usersRepository.update(id, { isTwoFactorAuthenticationEnabled: true });
	}

	/* Explicit */
	async turnOffTwoFactorAuthentication(id: number) {
		return this.usersRepository.update(id, { isTwoFactorAuthenticationEnabled: false });
	}


	/*
	** ==== Functions retrieving information about a user ====
	*/

	/* Returns all public informations about the user (everything but 2FA status and secret) */
	async findUserById(id: number): Promise<User> {
		const user = await this.usersRepository.findOne({ where: { id: id }, relations: ["blocked"]});
		if (!user) {
			throw new NotFoundException();
		}
		delete user.isTwoFactorAuthenticationEnabled;
		delete user.twoFactorAuthenticationSecret;
		return user;
	}

	async getUserRank(id: number): Promise<number> {
		const user = await this.usersRepository.findOne({ where: { id: id } });
		const allBetterScores = await this.usersRepository.createQueryBuilder()
														.select('DISTINCT score')
														.where("score > :userScore", { userScore: user.score })
														.execute()
		return (allBetterScores.length + 1);
	}

	/* Explicit */
	getCurrUserStatus(currUser: User): Observable<UserStatus> {
		return from(this.usersRepository.findOne(currUser.id)).pipe(
			map((user: User) => {
				return { status: user.status as User_Status }
			})
		)
	}

	/* Explicit */
	getUserStatus(userId: number): Observable<UserStatus> {
		return from(this.usersRepository.findOne(userId)).pipe(
			map((user: User) => {
				return { status: user.status as User_Status }
			})
		)
	}


	/*
	** ==== Functions updating information for a user ====
	*/

	/* Allows to change the user display name. If the name contains caracters that are not letters, numbers, of '_', '-', or if the
	** chosen name is already taken, throws an exception.
	*/
	async changeUserdisplayname(id: number, newdisplayname: string): Promise<string> {
		const invalidChars = /^[a-zA-Z0-9-_]+$/;
		if (newdisplayname.search(invalidChars) === -1 || newdisplayname.length > 15) { throw new ForbiddenException(); }
		const duplicate = await this.usersRepository.findOne({ where: { displayname: newdisplayname } });
		if (duplicate) { throw new BadRequestException(); }

		const user = await this.usersRepository.findOne({ where: {id: id} });
		user.displayname = newdisplayname;
		this.usersRepository.save(user);
		return user.displayname;
	}

	/* This function updates the path of the avatar of the user in the database (the file was already uploaded from the controller).
	** If the user already had a custom avatar, we delete his previous avatar with "unlink".
	*/
	async updateAvatar(id: number, filename: string) {
		try {
			const user = await User.findOne({ where: { id: id } });
			if (user.avatar === "default") {
				this.usersRepository.update(id, { avatar: filename });
			}
			else {
				unlink("./images/" + user.avatar, () => { console.log("Successfully deleted previous avatar with path ./images/" + user.avatar) });
				this.usersRepository.update(id, { avatar: filename });
			}
		} catch(e) {
			console.log(e.message);
			throw new BadRequestException();
		}
	}

	/* Explicit */
	async changeUserStatus(userId: number, targetStatus: User_Status): Promise<void> {
		try {
			await getConnection().createQueryBuilder()
			.update(User)
			.set({ 
				status: targetStatus,
			})
			.where("id = :id", { id: userId })
			.execute();
		} catch {
			throw new NotFoundException();
		}
	}

	/*
	** ==== Functions to block and unblock a user ====
	*/

	async isUserAlreadyBlocked(currUser: User, blockedUser: User): Promise<string> {
		for (const user of currUser.blocked) {
			if (user.id === blockedUser.id) return "blocked-by-me"; 
		}
		for (const user of blockedUser.blocked) {
			if (user.id === currUser.id) return "blocked-by-other-user";
		}
		return "not-blocked";
	}

	async blockUser(currUserId: number, blockedUserId: number)
	{
		if (currUserId === blockedUserId) throw new ForbiddenException("You can't block yourself !");
		const currUser: User = await this.usersRepository.findOne({
			relations: ['blocked'],
			where: { id: currUserId }
		});
		const blockedUser: User = await this.usersRepository.findOne({
			relations: ['blocked'],
			where: { id: blockedUserId }
		});
		let userAlreadyBlocked = await this.isUserAlreadyBlocked(currUser, blockedUser);
		if (userAlreadyBlocked === "not-blocked")
		{
			return await getConnection()
					.createQueryBuilder()
					.relation(User, "blocked")
					.of(currUser)
					.add(blockedUser);
		}
		else
		{
			throw new ForbiddenException("You already blocked this user, or this user already blocked you");
		}
	}

	async unBlockUser(currUserId: number, blockedUserId: number) {
		if (currUserId === blockedUserId) throw new ForbiddenException("You can't unblock yourself !");
		const currUser: User = await this.usersRepository.findOne({
			relations: ['blocked'],
			where: { id: currUserId }
		});
		const blockedUser: User = await this.usersRepository.findOne({
			relations: ['blocked'],
			where: { id: blockedUserId }
		});
		let userAlreadyBlocked = await this.isUserAlreadyBlocked(currUser, blockedUser);
		if (userAlreadyBlocked === "blocked-by-me") {
			return await getConnection()
					.createQueryBuilder()
					.relation(User, "blocked")
					.of(currUser)
					.remove(blockedUser);
		} else {
			throw new ForbiddenException("This user isn't blocked, or he is the one that blocked you");
		}
	}


	/*
	** ==== Functions allowing to interact with friend requests ====
	*/

	/* Returns a specific friend request by his ID, as well as the two Users related to it */
	async getFriendRequestById(friendRequestId: number): Promise<FriendRequest> {
		const friendRequest: FriendRequest = await this.friendRequestRepository.findOne({where:
			[{ id: friendRequestId}],
			relations: ['creator', 'receiver']
		});
		return friendRequest;
	}

	/* Allows to send a friend request. If a friend request already exists between the two users or if the user tries to 
	** send a friend request to himself, raise an exception.
	** The "hasFriendRequestBeenSentOrReceived" function also checks the case in which the request has been declined. If this is
	** the case, we only allow the user that declined it to re-send the request to the other user.
	*/
	async sendFriendRequest(receiverId: number, creatorId: number): Promise<FriendRequest> {
		if (receiverId === creatorId) {
			throw new Error("You can't send a friend request to yourself !")
		}

		const receiver: User = await this.findUserById(receiverId);
		const creator: User = await this.findUserById(creatorId);
		const hasFriendRequestBeenSentOrReceived: string = await this.hasFriendRequestBeenSentOrReceived(creator, receiver);
		if (hasFriendRequestBeenSentOrReceived === "true") throw new Error("Can't send friend request. Possible reasons are : 1. You're already friends 2. A request already exists from or to this user 3. The user has already declined a request coming from you, and only him can send you one now ");
		if (hasFriendRequestBeenSentOrReceived === "allow-resend") return this.reSendFriendRequest(creator, receiver);

		let friendRequest: FriendRequest = {
			creator,
			receiver,
			status: 'pending'
		}
		return this.friendRequestRepository.save(friendRequest);
	}

	/* This function allows tor re-send a friend request that had been declined. It simply updates the status of the friend request from
	** "declined" to "pending"
	*/
	async reSendFriendRequest(creator: User, receiver: User): Promise<FriendRequest> {
		const friendRequest: FriendRequest = await this.friendRequestRepository.findOne({ where:
			[ { creator, receiver}, { creator: receiver, receiver: creator } ],
			relations: ['creator', 'receiver']})
		friendRequest.creator = creator;
		friendRequest.receiver = receiver;
		friendRequest.status = "pending";
		return this.friendRequestRepository.save(friendRequest);
	}

	/* Change the friend request status to the desired state (accepted, declined, pending) */
	async respondToFriendRequest(friendRequestId: number, responseStatus: FriendRequest_Status): Promise<FriendRequest> {
		const friendRequest: FriendRequest = await this.getFriendRequestById(friendRequestId);
		return this.friendRequestRepository.save(
			{
				...friendRequest,
				status: responseStatus
			}
		);
	}

	/* The user can send the request in two cases :
		>> There is no existing friend request between the user.
		>> There is a declined request, but the user is the one that declined it
	*/
	async hasFriendRequestBeenSentOrReceived(creator: User, receiver: User): Promise<string> {
		const friendRequest: FriendRequest = await this.friendRequestRepository.findOne({ where:
			[ { creator, receiver}, { creator: receiver, receiver: creator } ],
			relations: ['creator', 'receiver']});
		if (!friendRequest) return ("false");
		if (friendRequest.status === "declined" && friendRequest.receiver.id == creator.id) return ("allow-resend");
		return ("true");
	}

	/* Allows to know the status of the friend request :
		>> If the friend request was received by current user but not accepted or declined, we are waiting for him to respond.
		>> If the friend request was received by current user and declined, it was declined by him.
		>> Else, it wasn't sent.
	*/
	async getFriendRequestStatus(receiverId: number, currentUser: User): Promise<FriendRequestStatus> {
		const receiver: User = await this.findUserById(receiverId);
		const friendRequest: FriendRequest = await this.friendRequestRepository.findOne({ where:
		[
			{ creator: currentUser, receiver: receiver},
			{ creator: receiver, receiver: currentUser}
		],
		relations: ['creator', 'receiver']});
		if (friendRequest?.receiver.id === currentUser.id && friendRequest?.status !== "accepted" && friendRequest?.status !== "declined") {
			return ({ status: 'waiting-for-current-user-response' });
		}
		if (friendRequest?.receiver.id == currentUser.id && friendRequest?.status === "declined") {
			return ({ status: 'declined-by-me' });
		}
		return { status: friendRequest?.status || 'not-sent' };
	}

	/* Allows to unfriend a user by simply deleting the associated friend request in the database. */
	async unfriendUser(currUserId: number, friendId: number): Promise<{ creatorId: number, receiverId: number }> {
		try {
			let friend = await this.findUserById(friendId);
			let currentUser = await this.findUserById(currUserId);
			let friendRequest = await this.friendRequestRepository.findOne({
				where: [
					{ creator: currentUser, receiver: friend, status: 'accepted'},
					{ creator: friend, receiver: currentUser, status: 'accepted'}
				],
				relations: ['creator', 'receiver']
			});
			this.friendRequestRepository.delete(friendRequest.id);
			return { creatorId: friendRequest.creator.id, receiverId: friendRequest.receiver.id };
		} catch {
			throw new NotFoundException();
		}
	}

	async cancelFriendRequest(currUserId: number, receiverId: number): Promise<{ creatorId: number, receiverId: number}> {
		try {
			let currUser = await this.findUserById(currUserId);
			let receiver = await this.findUserById(receiverId);
			let friendRequest = await this.friendRequestRepository.findOne({
				where: [
					{ creator: currUser, receiver: receiver, status: 'pending' }
				],
			});
			this.friendRequestRepository.delete(friendRequest.id);
			return { creatorId: currUserId, receiverId: receiverId };
		} catch (e) {
			console.log(e.message);
			throw new NotFoundException();
		}
	}


	/*
	** === Functions allowing to display users, in a paginated way ====
	*/

	/* Display all users, paginated */
	async paginateUsers(options: IPaginationOptions): Promise<Pagination<User>> {
		let ref = this;
		const queryBuilder = this.usersRepository.createQueryBuilder('c');
		queryBuilder.select(["c.id", "c.displayname", "c.avatar", "c.score", "c.wins", "c.loses", "c.is_admin", "c.is_blocked"]);
		queryBuilder.orderBy('c.displayname', 'ASC');
		return await paginate(queryBuilder, options);
	}

	async paginateUsersOrderByScore(options: IPaginationOptions): Promise<Pagination<UserWithRank>> {
		let ref = this;
		const queryBuilder = this.usersRepository.createQueryBuilder('c');
		queryBuilder.select(["c.id", "c.displayname", "c.avatar", "c.score", "c.wins", "c.loses"]);
		queryBuilder.orderBy('c.score', 'DESC');
		const result = await paginate(queryBuilder, options);

		let items = [];
		for (const element of result.items) {
			var rank = await ref.getUserRank(element.id);
			var userWithRank: UserWithRank = { user: element, rank: rank };
			items.push(userWithRank);
		};
		
		let usersWithRankPageable: Pagination<UserWithRank> = {
			items: items,
			links: result.links,
			meta: result.meta
		}
		return usersWithRankPageable;
	}

	/* Displays user matching a filter in their displayname, paginated */
	paginateUsersFilterBydisplayname(options: IPaginationOptions, displayname: string): Observable<Pagination<User>> {
		return from(this.usersRepository.findAndCount({
			skip: ((options.page as number) - 1) * (options.limit as number) || 0,
			take: (options.limit as number ) || 10,
			order: {displayname: 'ASC'},
			select: ['id', 'username', 'displayname', 'status', 'avatar', 'score'],
			where: { displayname: Raw(alias =>`LOWER(${alias}) Like ('%${displayname.toLowerCase()}%')`) }
		})).pipe(
			map(([users, totalUsers]) => {
				const usersPageable: Pagination<User> = {
					items: users,
					links: {
						first: options.route + `?limit=${options.limit}&username=${displayname}`,
						previous: options.route + `?limit=${options.limit}&?page=${options.page > 0 ? (options.page as number) - 1 : 0}&username=${displayname}`,
						next: options.route + `?limit=${options.limit}&?page=${options.page < Math.ceil(totalUsers / (options.limit as number)) ? (options.page as number) + 1 : options.page}&username=${displayname}`,
						last: options.route + `?limit=${options.limit}&page=${Math.ceil(totalUsers / (options.limit as number))}&username=${displayname}`
					},
					meta: {
						currentPage: (options.page as number),
						itemCount: users.length,
						itemsPerPage: (options.limit as number),
						totalItems: totalUsers,
						totalPages: Math.ceil(totalUsers / (options.limit as number))
					}
				};
				return usersPageable;
			})
		)
	}


	/*
	** ==== Functions allowing to display the friends of a user and its friend requests, in a paginated way ====
	*/

	/* Shows current user friends, paginated */
	paginateFriends(options: IPaginationOptions, currentUser: User): Observable<Pagination<User>> {
		return from(paginate(this.friendRequestRepository, options, {
			where: [{ creator: currentUser, status: "accepted" }, { receiver: currentUser, status: "accepted"}],
			relations: ['receiver', 'creator'],
			select: ['id', 'receiver', 'creator']
		})).pipe(
			map((friendRequestPageable: Pagination<FriendRequest>) => {
				var items = [];
				friendRequestPageable.items.forEach(function(element) { 
					if (element.creator.id != currentUser.id) {
						delete element.creator.twoFactorAuthenticationSecret;
						delete element.creator.isTwoFactorAuthenticationEnabled;
						items.push(element.creator);
					} else {
						delete element.receiver.twoFactorAuthenticationSecret;
						delete element.receiver.isTwoFactorAuthenticationEnabled;
						items.push(element.receiver);
					}
				});
				var usersPageable: Pagination<User> = {
					items: items,
					links: friendRequestPageable.links,
					meta: friendRequestPageable.meta
				};
				return usersPageable;
			})
		)
	}

	/* Shows received friend requests, paginated */
	paginateFriendRequestsFromRecipients(options: IPaginationOptions, currentUser: User): Observable<Pagination<FriendRequest>> {
		return from(paginate(this.friendRequestRepository, options, {
			where: { receiver: currentUser, status: "pending" },
			relations: ['creator', 'receiver']
		})).pipe(
			map((friendRequestPageable: Pagination<FriendRequest>) => {
				friendRequestPageable.items.forEach(function(element) {
					delete element.creator.twoFactorAuthenticationSecret;
					delete element.receiver.twoFactorAuthenticationSecret;
					delete element.creator.isTwoFactorAuthenticationEnabled;
					delete element.receiver.isTwoFactorAuthenticationEnabled;
				});
				return friendRequestPageable;
			}) 
		)
	}

	/* Shows sent friend requests, paginated */
	paginateFriendRequestsToRecipients(options: IPaginationOptions, currentUser: User): Observable<Pagination<FriendRequest>> {
		return from(paginate(this.friendRequestRepository, options, {
			where: { creator: currentUser, status: "pending" },
			relations: ['creator', 'receiver']
		})).pipe(
			map((friendRequests: Pagination<FriendRequest>) => {
				friendRequests.items.forEach(element => {
					delete element.creator.twoFactorAuthenticationSecret;
					delete element.receiver.twoFactorAuthenticationSecret;
					delete element.creator.isTwoFactorAuthenticationEnabled;
					delete element.receiver.isTwoFactorAuthenticationEnabled;
				});
				return friendRequests;
			})
		);
	}


	/* ==== Functions related to website administration */

	async getWebsiteOwner(): Promise<User> {
		return await this.usersRepository.createQueryBuilder("user")
		.select([
			"user.id",
			"user.username",
			"user.displayname",
			"user.avatar"
		])
		.where("user.is_admin = 'owner'")
		.getOne()
	}

	async getWebsiteModerators(options: IPaginationOptions): Promise<Pagination<User>> {
		const queryBuilder = this.usersRepository.createQueryBuilder("c");
		queryBuilder.select([ "c.id", "c.username", "c.displayname", "c.avatar" ]);
		queryBuilder.where("is_admin = 'moderator'");
		return await paginate(queryBuilder, options);
	}

	async getWebsiteBlockedUsersPaginated(options: IPaginationOptions): Promise<Pagination<User>> {
		const queryBuilder = this.usersRepository.createQueryBuilder("c");
		queryBuilder.select([ "c.id", "c.username", "c.displayname", "c.avatar" ]);
		queryBuilder.where("is_blocked = true");
		return await paginate(queryBuilder, options);
	}

	async makeUserModerator(userId: number): Promise<void> {
		await this.usersRepository.createQueryBuilder()
		.update(User)
		.set({ is_admin: "moderator" })
		.where("id = :id", { id: userId })
		.execute();
	}

	async makeUserRegular(userId: number): Promise<void> {
		await this.usersRepository.createQueryBuilder()
		.update(User)
		.set({ is_admin: "regular" })
		.where("id = :id", { id: userId })
		.execute();
	}

	async blockWebsiteUser(userId: number): Promise<void> {
		await this.usersRepository.createQueryBuilder()
		.update(User)
		.set({ is_blocked: true })
		.where("id = :id", { id: userId })
		.execute();
	}

	async unblockWebsiteUser(userId: number): Promise<void> {
		await this.usersRepository.createQueryBuilder()
		.update(User)
		.set({ is_blocked: false })
		.where("id = :id", { id: userId })
		.execute();
	}


	/* ==== Yassine's utility functions ==== */

	async insert(user: User)
	{
		return this.usersRepository.save(user);
	}

	async findAll(): Promise<User[]>
	{
		return (await this.usersRepository.find());
	}
	
	async findOne(id: string): Promise<User>
	{
		return this.usersRepository.findOne(id);
	}

	async findByUsername(name: string): Promise<User>
	{
		return this.usersRepository.findOne({relations: ["channels", "blocked"], where: [{username: name}]});
	}

	async findById(id: string): Promise<User>
	{
		return await this.usersRepository.findOne({relations: ["channels", "blocked", "pending_channels"], where: [{id: id}]});
	}
	
	async delete(id: string): Promise<void>
	{
		await this.usersRepository.delete(id);
	}

	async save(user: User)
	{
		await this.usersRepository.save(user);
	}


	/* ==== Lucas' utility functions ==== */

	/**
	 * Increments by one the number of wins for a specific user.
	 * 
	 * @param userDbId Database ID retrieved after authentification.
	 */
	async incUserWins(userDbId: number): Promise<void>
	{
		try {
			await getConnection().createQueryBuilder()
			.update(User)
			.set({ 
				wins: () => "wins + 1",
				score: () => "score + 50"
			})
			.where("id = :id", { id: userDbId })
			.execute();
		} 
		catch (e) {
			this.logger.log(`Couldn\'t find user required in order to increment wins (userId: ${userDbId})`);
		}
	}

	/**
	 * Increments by one the number of loses for a specific user.
	 * 
	 * @param userDbId Database ID retrieved after authentification.
	 */
	async incUserLoses(userDbId: number): Promise<void>
	{
		try {
			await getConnection().createQueryBuilder()
			.update(User)
			.set({ 
				loses: () => "loses + 1",
				score: () => "score - 30"
			})
			.where("id = :id", { id: userDbId })
			.execute();
		} 
		catch (e) {
			this.logger.log(`Couldn\'t find user required in order to increment loses (userId: ${userDbId})`);
		}
	}

	/**
	 * Updates the room ID for a specific user.
	 * 
	 * @param userDbId Database ID retrieved after authentification.
	 * @param newRoomId Should be a room ID or 'none' in case of a reset.
	 * @return Promise with an user entity.
	 */
	async updateRoomId(userDbId: number, newRoomId: string): Promise<User>
	{
		try {
			await getConnection().createQueryBuilder()
			.update(User)
			.set({ 
				roomId: newRoomId
			})
			.where("id = :id", { id: userDbId })
			.execute();
			
			return await getConnection()
			.getRepository(User)
			.createQueryBuilder("user")
			.where("user.id = :id", { id: userDbId })
			.getOne();
		}
		catch(e) {
			this.logger.log(`Could\'t find user required in order to update room ID (userId: ${userDbId})`);
		}
	}

	async resetRoomId(roomToReset: string) : Promise<void>
	{
		try {
			await getConnection().createQueryBuilder()
			.update(User)
			.set({ 
				roomId: 'none'
			})
			.where("roomId = :roomId", { roomId: roomToReset })
			.execute();
		}
		catch (e) {
			this.logger.log(`Could\'t find room required in order to reset it (roomId: ${roomToReset})`);
		}
	}

	async rankUsers(): Promise<User[]>
	{
		return await this.usersRepository.find(
		{
			order:
			{
				"score": "DESC"
			}
		})
	}

	async getBiDirectionalBlockedUsers(user: User): Promise<User[]>
	{
		let res = user.blocked ? user.blocked : [];
		let users = await this.usersRepository.find(
		{
			relations: ["blocked"]
		});
		for (let tmp_user of users)
		{
			if (tmp_user.blocked.findIndex((tmp) => tmp.id == user.id) != -1)
				res.push(tmp_user);
		}
		return res;
	}
}

