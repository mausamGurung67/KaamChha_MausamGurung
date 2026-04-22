import prisma from '../../../config/database';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryByName,
} from '../../category.service';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

type MockDb = {
  category: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('category.service core behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAllCategories should return only active categories by default', async () => {
    mockedPrisma.category.findMany.mockResolvedValue([{ id: 'cat-1', name: 'Plumbing' }]);

    const result = await getAllCategories();

    expect(mockedPrisma.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      include: {
        _count: {
          select: { services: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual([{ id: 'cat-1', name: 'Plumbing' }]);
  });

  it('getAllCategories should include inactive categories when requested', async () => {
    mockedPrisma.category.findMany.mockResolvedValue([{ id: 'cat-2', name: 'Legacy', isActive: false }]);

    await getAllCategories(true);

    expect(mockedPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('getCategoryById should include active services and service count', async () => {
    mockedPrisma.category.findUnique.mockResolvedValue({ id: 'cat-3', name: 'Electrical' });

    await getCategoryById('cat-3');

    expect(mockedPrisma.category.findUnique).toHaveBeenCalledWith({
      where: { id: 'cat-3' },
      include: {
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            image: true,
          },
        },
        _count: {
          select: { services: true },
        },
      },
    });
  });

  it('createCategory should persist provided category payload', async () => {
    const payload = {
      name: 'Cleaning',
      description: 'Home and office cleaning',
      image: 'https://img.example/cleaning.png',
    };

    mockedPrisma.category.create.mockResolvedValue({ id: 'cat-4', ...payload });

    const result = await createCategory(payload);

    expect(mockedPrisma.category.create).toHaveBeenCalledWith({
      data: payload,
    });
    expect(result).toEqual({ id: 'cat-4', ...payload });
  });

  it('updateCategory should update only the specified category', async () => {
    mockedPrisma.category.update.mockResolvedValue({ id: 'cat-5', name: 'Updated' });

    const result = await updateCategory('cat-5', { name: 'Updated', isActive: true });

    expect(mockedPrisma.category.update).toHaveBeenCalledWith({
      where: { id: 'cat-5' },
      data: { name: 'Updated', isActive: true },
    });
    expect(result).toEqual({ id: 'cat-5', name: 'Updated' });
  });

  it('deleteCategory should delete by id', async () => {
    mockedPrisma.category.delete.mockResolvedValue({ id: 'cat-6' });

    await deleteCategory('cat-6');

    expect(mockedPrisma.category.delete).toHaveBeenCalledWith({
      where: { id: 'cat-6' },
    });
  });

  it('getCategoryByName should query unique category by name', async () => {
    mockedPrisma.category.findUnique.mockResolvedValue({ id: 'cat-7', name: 'Painting' });

    const result = await getCategoryByName('Painting');

    expect(mockedPrisma.category.findUnique).toHaveBeenCalledWith({
      where: { name: 'Painting' },
    });
    expect(result).toEqual({ id: 'cat-7', name: 'Painting' });
  });
});
