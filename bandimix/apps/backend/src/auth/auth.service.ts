import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prismaService: UsersService, // Assuming PrismaService is used in UsersService
    private jwtService: JwtService,
  ) {}

  // register
  async signUp(
    username: string,
    email: string,
    password: string,
  ): Promise<User> {
    console.log('Signing up user:', { username, email, password });
    const user = await this.prismaService.findOneByUsername(username);
    if (user) {
      throw new UnauthorizedException('Username already in use');
    }
    const existingEmail = await this.prismaService.findOneByEmail(email);
    if (existingEmail) {
      throw new UnauthorizedException('Email already in use');
    }
    if (!username || !email || !password) {
      throw new UnauthorizedException('Username, email, and password are required');
    }
    if (username.length < 3 || username.length > 20) {
      throw new UnauthorizedException('Username must be between 3 and 20 characters');
    }
    if (password.length < 6 || password.length > 20) {
      throw new UnauthorizedException('Password must be between 6 and 20 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new UnauthorizedException('Username can only contain letters, numbers, and underscores');
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      throw new UnauthorizedException('Invalid email format');
    }
    if (password.includes(username)) {
      throw new UnauthorizedException('Password cannot contain the username');
    }
    if (password.includes(email)) {
      throw new UnauthorizedException('Password cannot contain the email');
    }
   // hash the password and save the user
   const hashedPassword = await bcrypt.hash(password, 10)
    return this.usersService.create({
      username,
      email,
      password: hashedPassword,
    });
  }

  // login
  async signIn(
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.prismaService.findOneByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  // logout
  async signOut(): Promise<void> {
    // Invalidate the user's session or token here

  }
}
