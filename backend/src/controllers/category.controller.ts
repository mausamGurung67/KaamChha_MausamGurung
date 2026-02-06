import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  const { includeInactive } = req.query;
  const categories = await categoryService.getAllCategories(includeInactive === 'true');
  
  res.json({
    success: true,
    data: categories,
  });
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const category = await categoryService.getCategoryById(id);
  
  if (!category) {
    res.status(404).json({
      success: false,
      message: 'Category not found',
    });
    return;
  }
  
  res.json({
    success: true,
    data: category,
  });
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.createCategory(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const category = await categoryService.updateCategory(id, req.body);
  
  res.json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await categoryService.deleteCategory(id);
  
  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
};
