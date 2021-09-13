/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchHistoryEntity } from '../users/match-history.entity';

@Module({
	imports: [
		AuthModule, 
		UsersModule, 
		ConfigModule,
		TypeOrmModule.forFeature([MatchHistoryEntity])],
	providers: [
		GameGateway, 
		GameService],
})

export class GameModule {}
