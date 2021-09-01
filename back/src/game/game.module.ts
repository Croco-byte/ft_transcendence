/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [
		AuthModule, 
		UsersModule, 
		ConfigModule],
	providers: [
		GameGateway, 
		GameService],
})

export class GameModule {}
