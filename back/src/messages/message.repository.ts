import { EntityRepository, Repository } from "typeorm";
import { Message } from "./message.entity";

@EntityRepository(Message)
export default class MessageRepository extends Repository<Message>
{

};