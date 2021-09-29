/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { MatchHistoryEntity } from './match-history.entity';
import { FriendRequestEntity } from './friends-request.entity';
import { UserController } from './users.controller';

@Module({
	imports: [TypeOrmModule.forFeature([MatchHistoryEntity, User, FriendRequestEntity])],
	providers: [UsersService],
	controllers: [UserController],
	exports: [UsersService]
})
export class UsersModule {}
