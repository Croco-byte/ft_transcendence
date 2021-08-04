import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, of, map, switchMap } from 'rxjs';
import { Like, Raw, Repository } from 'typeorm';
import { FriendRequest, FriendRequestStatus, FriendRequest_Status } from './friend-request.interface';
import { FriendRequestEntity } from './friends-request.entity';
import { User } from './users.entity';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { UserStatus, User_Status } from './status/status.interface';

@Injectable()
export class UsersService {
	constructor(@InjectRepository(User) private usersRepository: Repository<User>, @InjectRepository(FriendRequestEntity) private friendRequestRepository: Repository<FriendRequestEntity>) {}

	async setTwoFactorAuthenticationSecret(secret: string, id: number) {
		return this.usersRepository.update(id, { twoFactorAuthenticationSecret: secret });
	}

	async turnOnTwoFactorAuthentication(id: number) {
		return this.usersRepository.update(id, { isTwoFactorAuthenticationEnabled: true });
	}

	async turnOffTwoFactorAuthentication(id: number) {
		return this.usersRepository.update(id, { isTwoFactorAuthenticationEnabled: false });
	}

	async findUserById(id: number): Promise<User> {
		const user = await this.usersRepository.findOne({ where: { id: id } });
		if (!user) {
			throw new NotFoundException();
		}
		delete user.isTwoFactorAuthenticationEnabled;
		delete user.twoFactorAuthenticationSecret;
		return user;
	}

	hasFriendRequestBeenSentOrReceived(creator: User, receiver: User): Observable<string> {
		return from(this.friendRequestRepository.findOne({ where: [ { creator, receiver}, { creator: receiver, receiver: creator } ], relations: ['creator', 'receiver']})).pipe(
			switchMap((friendRequest: FriendRequest) => {
				if (!friendRequest) return of("false");
				if (friendRequest.status === "declined" && friendRequest.receiver.id == creator.id) return of("allow-resend");
				return of("true");
			}))
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

	sendFriendRequest(receiverId: number, creator: User): Observable<FriendRequest | { error: string }> {
		if (receiverId === creator.id) {
			return of({ error: "You can't send a friend request to yourself !" });
		}
		return from(this.findUserById(receiverId)).pipe(
			switchMap((receiver: User) => {
				return this.hasFriendRequestBeenSentOrReceived(creator, receiver).pipe(
					switchMap((hasFriendRequestBeenSentOrReceived: string) => {
						if (hasFriendRequestBeenSentOrReceived === "true") return of({ error: "A friend request from or to this user has already been made"});
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

	async unfriendUser(currentUser: User, friendId: number) {
		try {
			var friend = await this.findUserById(friendId);
			var friendRequest = await this.friendRequestRepository.findOne({
				where: [
					{ creator: currentUser, receiver: friend, status: 'accepted'},
					{ creator: friend, receiver: currentUser, status: 'accepted'}
				],
				relations: ['creator', 'receiver']
			});
			this.friendRequestRepository.delete(friendRequest.id);
		} catch {
			throw new NotFoundException();
		}
	}

	getFriendRequestById(friendRequestId: number): Observable<FriendRequest> {
		return from(this.friendRequestRepository.findOne({where: { id: friendRequestId}}));
	}

	respondToFriendRequest(friendRequestId: number, responseStatus: FriendRequest_Status): Observable<FriendRequestStatus> {
		return from(this.getFriendRequestById(friendRequestId)).pipe(
			switchMap((friendRequest: FriendRequest) => {
				return from(this.friendRequestRepository.save(
					{ ...friendRequest,
					status: responseStatus }
				))
			})
		)
	}

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

	paginateUsers(options: IPaginationOptions): Observable<Pagination<User>> {
		return from(paginate(this.usersRepository, options)).pipe(
			map((usersPageable: Pagination<User>) => {
				usersPageable.items.forEach(function(v) { delete v.twoFactorAuthenticationSecret; delete v.isTwoFactorAuthenticationEnabled; delete v.avatar});
				return usersPageable;
			}) 
		)
	}

	paginateUsersFilterByUsername(options: IPaginationOptions, username: string): Observable<Pagination<User>> {
		return from(this.usersRepository.findAndCount({
			skip: (options.page - 1) * options.limit || 0,
			take: options.limit || 10,
			order: {username: 'ASC'},
			select: ['id', 'username'],
			where: { username: Raw(alias =>`LOWER(${alias}) Like ('%${username.toLowerCase()}%')`) }
		})).pipe(
			map(([users, totalUsers]) => {
				const usersPageable: Pagination<User> = {
					items: users,
					links: {
						first: options.route + `?limit=${options.limit}&username=${username}`,
						previous: options.route + `?limit=${options.limit}&?page=${options.page > 0 ? options.page - 1 : 0}&username=${username}`,
						next: options.route + `?limit=${options.limit}&?page=${options.page < Math.ceil(totalUsers / options.limit) ? options.page + 1 : options.page}&username=${username}`,
						last: options.route + `?limit=${options.limit}&page=${Math.ceil(totalUsers / options.limit)}&username=${username}`
					},
					meta: {
						currentPage: options.page,
						itemCount: users.length,
						itemsPerPage: options.limit,
						totalItems: totalUsers,
						totalPages: Math.ceil(totalUsers / options.limit)
					}
				};
				return usersPageable;
			})
		)
	}

	getCurrUserStatus(currUser: User): Observable<UserStatus> {
		return from(this.usersRepository.findOne(currUser.id)).pipe(
			map((user: User) => {
				return { status: user.status as User_Status }
			})
		)
	}

	getUserStatus(userId: number): Observable<UserStatus> {
		return from(this.usersRepository.findOne(userId)).pipe(
			map((user: User) => {
				return { status: user.status as User_Status }
			})
		)
	}

	async changeCurrUserStatus(targetStatus: UserStatus, userId: number): Promise<void> {
		try {
			const currUser = await this.usersRepository.findOne(userId);
			currUser.status = targetStatus.status;
			await this.usersRepository.save(currUser);
		} catch {
			throw new NotFoundException();
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


*/
