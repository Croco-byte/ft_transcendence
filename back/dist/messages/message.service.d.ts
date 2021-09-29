import { Channel } from "src/channels/channel.entity";
import { User } from "src/users/users.entity";
import { Message } from './message.entity';
export default class MessageService {
    private repository;
    constructor(repository: any);
    add(channel: Channel, user: User, content: string): Promise<any>;
    insert(message: Message): Promise<any>;
    findAll(): Promise<Message[]>;
    findOne(id: string): Promise<Message>;
    findByChannel(channel: Channel): Promise<any>;
    delete(id: string): Promise<void>;
    save(message: Message): Promise<void>;
}
