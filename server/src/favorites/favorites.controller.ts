import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { FavoritesService } from './favorites.service';

@UseGuards(AuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  getMyFavorites(@CurrentUser() user: { userId: string }) {
    return this.favoritesService.getMyFavorites(user.userId);
  }

  @Post(':productId')
  addFavorite(@CurrentUser() user: { userId: string }, @Param('productId') productId: string) {
    return this.favoritesService.addFavorite(user.userId, productId);
  }

  @Delete(':productId')
  removeFavorite(@CurrentUser() user: { userId: string }, @Param('productId') productId: string) {
    return this.favoritesService.removeFavorite(user.userId, productId);
  }

  @Get(':productId/status')
  getFavoriteStatus(@CurrentUser() user: { userId: string }, @Param('productId') productId: string) {
    return this.favoritesService.getFavoriteStatus(user.userId, productId);
  }
}
