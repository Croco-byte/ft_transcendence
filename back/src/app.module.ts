import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { StatusGateway } from './users/status.gateway';
import { FriendRequestsGateway } from './users/friend-request.gateway';

@Module(
{
	imports: [HttpModule, AuthModule, UsersModule, DatabaseModule, ConfigModule.forRoot()],
	controllers: [],
	providers: [StatusGateway, FriendRequestsGateway],
})

export class AppModule {}
