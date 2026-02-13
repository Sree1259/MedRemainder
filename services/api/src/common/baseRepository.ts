import { prisma } from './prisma';
import { AppError } from './errorHandler';

/**
 * Base Repository Class implementing Repository Pattern
 * Provides common CRUD operations with user ownership validation
 * Follows SOLID principles and DRY
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected abstract modelName: string;
  protected abstract userIdField: string;

  /**
   * Check if resource belongs to user
   */
  protected async belongsToUser(id: string, userId: string): Promise<boolean> {
    const model = prisma[this.modelName as keyof typeof prisma] as any;
    const resource = await model.findFirst({
      where: { id, [this.userIdField]: userId },
      select: { id: true },
    });
    return !!resource;
  }

  /**
   * Get resource by ID with ownership check
   */
  async findById(id: string, userId: string, include?: Record<string, any>): Promise<T> {
    const model = prisma[this.modelName as keyof typeof prisma] as any;
    
    const resource = await model.findFirst({
      where: { id, [this.userIdField]: userId },
      include,
    });

    if (!resource) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    return resource as T;
  }

  /**
   * Get all resources for a user
   */
  async findByUser(userId: string, where?: Record<string, any>, orderBy?: Record<string, any>): Promise<T[]> {
    const model = prisma[this.modelName as keyof typeof prisma] as any;
    
    return model.findMany({
      where: { [this.userIdField]: userId, ...where },
      orderBy: orderBy || { createdAt: 'desc' },
    });
  }

  /**
   * Create resource
   */
  async create(data: CreateInput & { [key: string]: any }): Promise<T> {
    const model = prisma[this.modelName as keyof typeof prisma] as any;
    return model.create({ data });
  }

  /**
   * Update resource with ownership check
   */
  async update(id: string, userId: string, data: UpdateInput): Promise<T> {
    const belongs = await this.belongsToUser(id, userId);
    if (!belongs) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    const model = prisma[this.modelName as keyof typeof prisma] as any;
    return model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete resource with ownership check
   */
  async delete(id: string, userId: string): Promise<void> {
    const belongs = await this.belongsToUser(id, userId);
    if (!belongs) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    const model = prisma[this.modelName as keyof typeof prisma] as any;
    await model.delete({ where: { id } });
  }

  /**
   * Count resources for user
   */
  async count(userId: string, where?: Record<string, any>): Promise<number> {
    const model = prisma[this.modelName as keyof typeof prisma] as any;
    return model.count({
      where: { [this.userIdField]: userId, ...where },
    });
  }
}
