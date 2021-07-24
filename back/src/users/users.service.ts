import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
	constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

	async setTwoFactorAuthenticationSecret(secret: string, id: number) {
		console.log("Trying to save secret " + secret + " for user with id " + id);
		return this.usersRepository.update(id, { twoFactorAuthenticationSecret: secret });
	}

	async turnOnTwoFactorAuthentication(id: number) {
		console.log("Turning on 2FA for user with id " + id);
		return this.usersRepository.update(id, { isTwoFactorAuthenticationEnabled: true });
	}

	async turnOffTwoFactorAuthentication(id: number) {
		console.log("Turning off 2FA for user with id " + id);
		return this.usersRepository.update(id, { isTwoFactorAuthenticationEnabled: false });
	}
}
