/// <reference types="multer" />
import { NotFoundException } from "@nestjs/common";
import { Pagination } from "nestjs-typeorm-paginate";
import { Observable } from "rxjs";
import { FriendRequest, FriendRequestStatus } from "./friend-request.interface";
import { UserStatus, User_Status } from "./status.interface";
import { User } from "./users.entity";
import { UsersService } from "./users.service";
import { UserWithRank } from "./user.interface";
import { MatchHistoryEntity } from "src/users/match-history.entity";
import { Repository } from "typeorm";
export declare class UserController {
    private readonly userService;
    private matchHistoryRepository;
    constructor(userService: UsersService, matchHistoryRepository: Repository<MatchHistoryEntity>);
    findCurrentUserId(req: any): {
        id: any;
    };
    getCurrUserStatus(req: any): Observable<UserStatus>;
    getCurrentUserAvatar(req: any, res: any): Promise<void>;
    getCurrUserInfo(req: any): Promise<User>;
    getCurrUserHistory(limit: number, page: number, username: string, req: any): Observable<Pagination<MatchHistoryEntity>>;
    changeUserdisplayname(newdisplayname: string, req: any): Promise<string>;
    saveAvatar(req: any, file: Express.Multer.File): Promise<void>;
    paginatedUsers(limit: number, page: number, username: string): Promise<Pagination<User>> | Observable<Pagination<User>>;
    paginateUsersOrderByScore(limit?: number, page?: number): Promise<Pagination<UserWithRank>>;
    findUserById(userStringId: string, req: any): Promise<User>;
    getUserAvatarFromPath(pathInfo: {
        path: string;
    }, res: any): NotFoundException;
    getUserStatus(userStringId: string): Observable<UserStatus>;
    changeUserStatus(userStringId: string, targetStatus: User_Status): void;
    blockUser(blocked_id: number, req: any): Promise<void>;
    unBlockUser(blocked_id: number, req: any): Promise<void>;
    paginatedFriends(limit: number, page: number, req: any): Observable<Pagination<User>>;
    paginatedFriendRequestsFromRecipients(limit: number, page: number, req: any): Observable<Pagination<FriendRequest>>;
    paginatedFriendRequestsToRecipients(limit: number, page: number, req: any): Observable<Pagination<FriendRequest>>;
    sendFriendRequest(receiverStringId: string, req: any): Promise<FriendRequest>;
    getFriendRequestStatus(receiverStringId: string, req: any): Promise<FriendRequestStatus>;
    respondToFriendRequest(friendRequestStringId: string, responseStatus: FriendRequestStatus): Promise<FriendRequestStatus>;
    getWebsiteBlockedUsers(limit?: number, page?: number): Promise<Pagination<User>>;
    blockWebsiteUser(data: {
        targetUserId: number;
    }, req: any): Promise<void>;
    unblockWebsiteUser(data: {
        targetUserId: number;
    }, req: any): Promise<void>;
    getWebsiteOwner(): Promise<User>;
    getWebsiteModerators(limit?: number, page?: number): Promise<Pagination<User>>;
    makeWebsiteModerator(data: {
        targetUserId: number;
    }, req: any): Promise<void>;
    makeuserRegular(data: {
        targetUserId: number;
    }, req: any): Promise<void>;
}
