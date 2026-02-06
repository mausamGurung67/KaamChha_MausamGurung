import prisma from '../config/database';

export interface CreateCategoryData {
  name: string;
  description?: string;
  image?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

export const getAllCategories = async (includeInactive: boolean = false): Promise<any[]> => {
  const where = includeInactive ? {} : { isActive: true };
  
  return prisma.category.findMany({
    where,
    include: {
      _count: {
        select: { services: true },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const getCategoryById = async (id: string): Promise<any | null> => {
  return prisma.category.findUnique({
    where: { id },
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
};

export const createCategory = async (data: CreateCategoryData): Promise<any> => {
  return prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
      image: data.image,
    },
  });
};

export const updateCategory = async (id: string, data: UpdateCategoryData): Promise<any> => {
  return prisma.category.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: string): Promise<void> => {
  await prisma.category.delete({
    where: { id },
  });
};

export const getCategoryByName = async (name: string): Promise<any | null> => {
  return prisma.category.findUnique({
    where: { name },
  });
};
