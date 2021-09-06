/* eslint-disable prettier/prettier */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, map } from 'rxjs';
import { Like, Raw, Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus, FriendRequest_Status } from './friend-request.interface';
import { FriendRequestEntity } from './friends-request.entity';
import { User } from './users.entity';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { UserStatus, User_Status } from './status.interface';
import { unlink } from 'fs';
import { Logger } from '@nestjs/common'

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User) 
		private usersRepository: Repository<User>, 
		@InjectRepository(FriendRequestEntity) 
		private friendRequestRepository: Repository<FriendRequestEntity>) {}

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
		const user = await this.usersRepository.findOne({ where: { id: id } });
		if (!user) {
			throw new NotFoundException();
		}
		delete user.isTwoFactorAuthenticationEnabled;
		delete user.twoFactorAuthenticationSecret;
		return user;
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
	async changeUserDisplayName(id: number, newDisplayName: string): Promise<string> {
		const invalidChars = /^[a-zA-Z0-9-_]+$/;
		if (newDisplayName.search(invalidChars) === -1 || newDisplayName.length > 15) { throw new ForbiddenException(); }
		const duplicate = await this.usersRepository.findOne({ where: { displayName: newDisplayName } });
		if (duplicate) { throw new BadRequestException(); }

		const user = await this.usersRepository.findOne({ where: {id: id} });
		user.displayName = newDisplayName;
		this.usersRepository.save(user);
		return user.displayName;
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
			const user = await this.usersRepository.findOne(userId);
			user.status = targetStatus;
			await this.usersRepository.save(user);
		} catch {
			throw new NotFoundException();
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
		if (hasFriendRequestBeenSentOrReceived === "true") throw new Error("A friend request already exists from or to this user");
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
			return { creatorId: friendRequest.creator.id, receiverId: friendRequest.receiver.id }
		} catch {
			throw new NotFoundException();
		}
	}


	/*
	** === Functions allowing to display users, in a paginated way ====
	*/

	/* Display all users, paginated */
	paginateUsers(options: IPaginationOptions): Observable<Pagination<User>> {
		return from(paginate(this.usersRepository, options)).pipe(
			map((usersPageable: Pagination<User>) => {
				usersPageable.items.forEach(function(v) { delete v.twoFactorAuthenticationSecret; delete v.isTwoFactorAuthenticationEnabled; delete v.avatar});
				return usersPageable;
			}) 
		)
	}

	/* Displays user matching a filter in their displayname, paginated */
	paginateUsersFilterByDisplayName(options: IPaginationOptions, displayName: string): Observable<Pagination<User>> {
		return from(this.usersRepository.findAndCount({
			skip: ((options.page as number) - 1) * (options.limit as number) || 0,
			take: (options.limit as number )|| 10,
			order: {displayName: 'ASC'},
			select: ['id', 'username', 'displayName', 'status'],
			where: { displayName: Raw(alias =>`LOWER(${alias}) Like ('%${displayName.toLowerCase()}%')`) }
		})).pipe(
			map(([users, totalUsers]) => {
				const usersPageable: Pagination<User> = {
					items: users,
					links: {
						first: options.route + `?limit=${options.limit}&username=${displayName}`,
						previous: options.route + `?limit=${options.limit}&?page=${options.page > 0 ? (options.page as number) - 1 : 0}&username=${displayName}`,
						next: options.route + `?limit=${options.limit}&?page=${options.page < Math.ceil(totalUsers / (options.limit as number)) ? (options.page as number) + 1 : options.page}&username=${displayName}`,
						last: options.route + `?limit=${options.limit}&page=${Math.ceil(totalUsers / (options.limit as number))}&username=${displayName}`
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
						delete element.creator.avatar;
						items.push(element.creator);
					} else {
						delete element.receiver.twoFactorAuthenticationSecret;
						delete element.receiver.isTwoFactorAuthenticationEnabled;
						delete element.receiver.avatar;
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
					delete element.creator.avatar;
					delete element.receiver.avatar;
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
					delete element.creator.avatar;
					delete element.receiver.avatar;
				});
				return friendRequests;
			})
		);
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
		return this.usersRepository.findOne({relations: ["channels"], where: [{username: name}]});
	}

	async findById(id: string): Promise<User>
	{
		return await this.usersRepository.findOne({relations: ["channels"], where: [{id: id}]});
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
	 * Increment by one the number of wins for a specific user.
	 * 
	 * @param userDbId Database ID retrieved after authentification.
	 * @return Promise with an the User updated in database.
	 */
	async incUserWins(userDbId: number): Promise<User>
	{
		try {
			const user = await this.usersRepository.findOne({ where: { id: userDbId } })
			user.wins++;
			return this.usersRepository.save(user);
		} 
		catch (e) {
			this.logger.log('Couldn\'t find user required in order to increment wins');
		}
	}

	/**
	 * Increment by one the number of loses for a specific user.
	 * 
	 * @param userDbId Database ID retrieved after authentification.
	 * @return Promise with the User object updated in database.
	 */
	async incUserLoses(userDbId: number): Promise<User>
	{
		try {
			const user = await this.usersRepository.findOne({ where: { id: userDbId } });
			user.loses++;
			return this.usersRepository.save(user);
		} 
		catch (e) {
			this.logger.log('Couldn\'t find user required in order to increment loses');
		}
	}

	/**
	 * Update the room ID for a specific user.
	 * 
	 * @param userDbId Database ID retrieved after authentification.
	 * @param newStatus Should be a room ID or 'none' in case of a reset.
	 * @return Promise with the User object updated in database.
	 */
	async updateRoomId(userDbId: number, roomId: string): Promise<User>
	{
		try {
			const user = await this.usersRepository.findOne({ where: { id: userDbId } });
			user.roomId = roomId;
			return this.usersRepository.save(user);
		} catch(e) {
			this.logger.log('Could\'t find user required in order to update room ID');
		}
	}
}









/*
--- DEPRECATED FUNCTIONS ; USE THE PAGINATED VERSION INSTEAD ---

getFriends(currentUser: User): Observable<User[]> {
		let myFriends: User[] = [];
		return from(this.friendRequestRepository.find({
			where: [{ creator: currentUser, status: "accepted" }, { receiver: currentUser, status: "accepted"}],
			relations: ['creator', 'receiver']
		})).pipe(
			switchMap((acceptedRequests: FriendRequest[]) => {
				acceptedRequests.forEach(element => {
					if (element.creator.id !== currentUser.id) {
						delete element.creator.twoFactorAuthenticationSecret;
						delete element.creator.isTwoFactorAuthenticationEnabled;
						delete element.creator.avatar;
						myFriends.push(element.creator);
					} else {
						delete element.receiver.twoFactorAuthenticationSecret;
						delete element.receiver.isTwoFactorAuthenticationEnabled;
						delete element.receiver.avatar;
						myFriends.push(element.receiver);
					}
				})
				return of(myFriends);
			})
		)
	}

	getFriendRequestsFromRecipients(currentUser: User): Observable<FriendRequest[]> {
		return from(this.friendRequestRepository.find({
			where: { receiver: currentUser, status: "pending" },
			relations: ['creator', 'receiver']
		})).pipe(
			switchMap((friendRequests: FriendRequest[]) => {
				friendRequests.forEach(element => {
					delete element.creator.twoFactorAuthenticationSecret;
					delete element.receiver.twoFactorAuthenticationSecret;
					delete element.creator.isTwoFactorAuthenticationEnabled;
					delete element.receiver.isTwoFactorAuthenticationEnabled;
					delete element.creator.avatar;
					delete element.receiver.avatar;
				});
				return of(friendRequests);
			})
		);
	}

	getFriendRequestsToRecipients(currentUser: User): Observable<FriendRequest[]> {
		return from(this.friendRequestRepository.find({
			where: { creator: currentUser, status: "pending" },
			relations: ['creator', 'receiver']
		})).pipe(
			switchMap((friendRequests: FriendRequest[]) => {
				friendRequests.forEach(element => {
					delete element.creator.twoFactorAuthenticationSecret;
					delete element.receiver.twoFactorAuthenticationSecret;
					delete element.creator.isTwoFactorAuthenticationEnabled;
					delete element.receiver.isTwoFactorAuthenticationEnabled;
					delete element.creator.avatar;
					delete element.receiver.avatar;
				});
				return of(friendRequests);
			})
		);
	}



	--- DEPRECATED FUNCTIONS : FRIEND REQUESTS HANDLING WITH OBSERVABLES, SWITCHING TO PLAIN PROMISES ---

	hasFriendRequestBeenSentOrReceived(creator: User, receiver: User): Observable<string> {
		return from(this.friendRequestRepository.findOne({ where: [ { creator, receiver}, { creator: receiver, receiver: creator } ], relations: ['creator', 'receiver']})).pipe(
			switchMap((friendRequest: FriendRequest) => {
				if (!friendRequest) return of("false");
				if (friendRequest.status === "declined" && friendRequest.receiver.id == creator.id) return of("allow-resend");
				return of("true");
			}))
	}

	sendFriendRequest(receiverId: number, creator: User): Observable<FriendRequest> {
		if (receiverId === creator.id) {
			throw new Error("You can't send a friend request to yourself !")
		}
		return from(this.findUserById(receiverId)).pipe(
			switchMap((receiver: User) => {
				return this.hasFriendRequestBeenSentOrReceived(creator, receiver).pipe(
					switchMap((hasFriendRequestBeenSentOrReceived: string) => {
						if (hasFriendRequestBeenSentOrReceived === "true")  throw new Error("A friend request already exists from or to this user");
						if (hasFriendRequestBeenSentOrReceived === "allow-resend") return this.reSendFriendRequest(creator, receiver);
						let friendRequest: FriendRequest = {
							creator,
							receiver,
							status: 'pending'
						}
						return from(this.friendRequestRepository.save(friendRequest));
					})
				)
			})
		)
	}

	reSendFriendRequest(creator: User, receiver: User): Observable<FriendRequest> {
		return from(this.friendRequestRepository.findOne({ where: [ { creator, receiver}, { creator: receiver, receiver: creator } ], relations: ['creator', 'receiver']})).pipe(
			switchMap((friendRequest: FriendRequest) => {
				friendRequest.creator = creator;
				friendRequest.receiver = receiver;
				friendRequest.status = "pending";
				return from(this.friendRequestRepository.save(friendRequest));
			}))
	}

	getFriendRequestStatus(receiverId: number, currentUser: User): Observable<FriendRequestStatus> {
		return from(this.findUserById(receiverId)).pipe(
			switchMap((receiver: User) => {
				return from(this.friendRequestRepository.findOne({
					where: [
						{ creator: currentUser, receiver: receiver },
						{ creator: receiver, receiver: currentUser}
					],
					relations: ['creator', 'receiver']
				})).pipe(
					switchMap((friendRequest: FriendRequest) => {
						if (friendRequest?.receiver.id === currentUser.id && friendRequest?.status !== "accepted" && friendRequest?.status !== "declined") {
							return of({ status: 'waiting-for-current-user-response' as FriendRequest_Status })
						}
						if (friendRequest?.receiver.id == currentUser.id && friendRequest?.status === "declined") {
							return of({ status: 'declined-by-me' as FriendRequest_Status })
						}
						return of({ status: friendRequest?.status || 'not-sent' })
					})
				)
			}) 
		)
	}

	getFriendRequestById(friendRequestId: number): Observable<FriendRequest> {
		return from(this.friendRequestRepository.findOne({where: [{ id: friendRequestId}], relations: ['creator', 'receiver']}));
	}

	respondToFriendRequest(friendRequestId: number, responseStatus: FriendRequest_Status): Observable<FriendRequest> {
		return from(this.getFriendRequestById(friendRequestId)).pipe(
			switchMap((friendRequest: FriendRequest) => {
				return from(this.friendRequestRepository.save(
					{ ...friendRequest,
					status: responseStatus }
				))
			})
		)
	}


	 * Update the game status for a specific user.
	 * 
	 * @param userDbId Database ID retrieved after authentification.
	 * @param newStatus Possible values: 'none', 'spectating', 'inGame'.
	 * @return Promise with the User object updated in database.

	async updateGameStatus(userDbId: number, newStatus: string): Promise<User>
	{
		try {
			const user = await this.usersRepository.findOne({ where: { id: userDbId } });
			user.gameStatus = newStatus;
			return this.usersRepository.save(user);
		} catch(e) {
			this.logger.log('Could\'t find user required in order to update game status');
		}
	}



*/
