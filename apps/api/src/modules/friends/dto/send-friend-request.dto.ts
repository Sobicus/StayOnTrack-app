import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendFriendRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  username!: string;
}
