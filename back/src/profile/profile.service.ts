import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/users.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'fs';

@Injectable()
export class ProfileService {
	constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

	async getAccountInfo(user_id: number) {
		try {
			return await User.findOne({ where: { id: user_id } });
		} catch {
			console.log("Couldn't find user with id " + user_id + " for account infos");
			throw new UnauthorizedException();
		}
	}

	async updateAvatar(user_id: number, filename: string) {
		try {
			const user = await User.findOne({ where: { id: user_id } });
			if (user.avatar === "default") {
				this.usersRepository.update(user_id, { avatar: filename });
			}
			else {
				unlink("./images/" + user.avatar, () => { console.log("Successfully deleted previous avatar with path ./images/" + user.avatar) });
				this.usersRepository.update(user_id, { avatar: filename });
			}
		} catch {
			console.log("Couldn't find user with id " + user_id + " to update avatar");
			throw new UnauthorizedException();
		}
	}
}
