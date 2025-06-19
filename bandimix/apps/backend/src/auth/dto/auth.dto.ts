import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'bandi', description: 'Felhasználónév' })
  username!: string;

  @ApiProperty({ example: 'bandi@email.com', description: 'Email cím' })
  email!: string;

  @ApiProperty({ example: 'jelszo123', description: 'Jelszó' })
  password!: string;
}

export class SignInDto {
  @ApiProperty({ example: 'bandi', description: 'Felhasználónév' })
  username!: string;

  @ApiProperty({ example: 'jelszo123', description: 'Jelszó' })
  password!: string;
}
