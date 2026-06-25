import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@UseGuards(AuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('my')
  getMyOrders(@CurrentUser() user: { userId: string }) {
    return this.ordersService.getMyOrders(user.userId);
  }

  @Post()
  createOrder(@CurrentUser() user: { userId: string }, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.userId, dto);
  }

  @Patch(':id/confirm')
  confirmOrder(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.ordersService.confirmOrder(id, user.userId);
  }

  @Patch(':id/cancel')
  cancelOrder(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.ordersService.cancelOrder(id, user.userId);
  }

  @Patch(':id/complete')
  completeOrder(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.ordersService.completeOrder(id, user.userId);
  }

  @Post('clear-canceled')
  clearCanceledOrders(@CurrentUser() user: { userId: string }) {
    return this.ordersService.clearCanceledOrders(user.userId);
  }
}
