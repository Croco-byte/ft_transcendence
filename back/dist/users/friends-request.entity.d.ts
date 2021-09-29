import { FriendRequest_Status } from './friend-request.interface';
import { User } from './users.entity';
export declare class FriendRequestEntity {
    id: number;
    creator: User;
    receiver: User;
    status: FriendRequest_Status;
}
