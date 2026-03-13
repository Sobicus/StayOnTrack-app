import { IsArray, ArrayMinSize, ArrayMaxSize, IsString } from 'class-validator';

export class InviteMultipleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(19)
  @IsString({ each: true })
  usernames!: string[];
}
