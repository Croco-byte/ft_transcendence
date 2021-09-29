import { Repository } from "typeorm";
import { User } from "./users.entity";
export default class UserRepository extends Repository<User> {
}
