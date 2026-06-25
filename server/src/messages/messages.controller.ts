import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateMessageSessionDto } from './dto/create-message-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

@UseGuards(AuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('sessions')
  getSessions(@CurrentUser() user: { userId: string }) {
    return this.messagesService.getSessions(user.userId);
  }

  @Post('sessions')
  createSession(@CurrentUser() user: { userId: string }, @Body() dto: CreateMessageSessionDto) {
    return this.messagesService.createSession(user.userId, dto);
  }

  @Get('sessions/:id/messages')
  getSessionMessages(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.messagesService.getSessionMessages(id, user.userId);
  }

  @Post('sessions/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(id, user.userId, dto);
  }
}
