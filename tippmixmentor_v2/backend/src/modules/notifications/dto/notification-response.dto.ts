import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: any;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ required: false })
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;
} 