import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt-strategy';
import { JwtTwoFactorStrategy } from './jwt-two-factor-strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TwoFactorAuthenticationController } from './twoFactorAuthentication.controller';
import { TwoFactorAuthenticationService } from './twoFactorAuthentication.service';
import { UsersModule } from 'src/users/users.module';


@Module({
	imports: [HttpModule, JwtModule.register({ secret: 'sup3r_secret_JWT_s3cret_strIng' }), ConfigModule, PassportModule, UsersModule],
	controllers: [AuthController, TwoFactorAuthenticationController],
	providers: [AuthService, JwtStrategy, JwtTwoFactorStrategy, TwoFactorAuthenticationService],
})
export class AuthModule {}
