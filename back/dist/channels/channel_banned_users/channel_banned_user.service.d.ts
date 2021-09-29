import { Channel } from "src/channels/channel.entity";
import { User } from "src/users/users.entity";
export default class ChannelBannedUserService {
    private repository;
    constructor(repository: any);
    isBanned(channel: Channel, user: User): Promise<boolean>;
    insert(channel: Channel, user: User, to: string): Promise<void>;
    delete(channel: Channel, user: User): Promise<any>;
    removeAllFromChannel(channel: Channel): Promise<Channel>;
}
