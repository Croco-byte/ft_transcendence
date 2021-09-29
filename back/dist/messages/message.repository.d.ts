import { Repository } from "typeorm";
import { Message } from "./message.entity";
export default class MessageRepository extends Repository<Message> {
}
