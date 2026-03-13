import { IsString, Length } from 'class-validator';

export class JoinChallengeDto {
  @IsString()
  @Length(8, 8)
  code!: string;
}
