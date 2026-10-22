import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'is_public_route';

// Marks an endpoint as bypassing JWT authentication requirements
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
