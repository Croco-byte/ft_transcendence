/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchHistoryEntity } from '../users/match-history.entity';
import { User } from 'src/users/users.entity';
import { GameController } from './game.controller'

@Module({
	imports: [
		AuthModule, 
		UsersModule, 
		ConfigModule,
		TypeOrmModule.forFeature([MatchHistoryEntity, User])],
	controllers: [GameController],
	providers: [
		GameGateway, 
		GameService],
})

export class GameModule {}
