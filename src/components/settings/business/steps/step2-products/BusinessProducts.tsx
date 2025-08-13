'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import { authenticatedFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  SettingsIcon,
} from '@/components/icons';

interface BusinessProfile {
  business_type?: string;
  business_name?: string;
  [key: string]: any;
}

interface ProductCategory {
  id: string;
  business_type: string;
  category_name: string;
  category_description?: string;
  is_active: boolean;
}

interface BusinessProduct {
  id: string;
  user_id: string;
  business_type: string;
  category_id?: string;
  product_name: string;
  product_description?: string;
  brand?: string;
  price?: number;
  price_currency?: string;
  is_active: boolean;
  product_categories?: ProductCategory;
}

interface BusinessProductsProps {
  user: User;
  onProductsUpdate: (hasProducts: boolean) => void;
}

export function BusinessProducts({
  user,
  onProductsUpdate,
}: BusinessProductsProps) {
  const t = useTranslations('businessProducts');
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [businessProfile, setBusinessProfile] =
    useState<BusinessProfile | null>(null);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    []
  );
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    category_name: '',
    category_description: '',
  });

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BusinessProduct | null>(
    null
  );
  const [productForm, setProductForm] = useState({
    category_id: 'none',
    product_name: '',
    product_description: '',
    brand: '',
    price: '',
    price_currency: 'USD',
  });

  // Inline editing state
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState({
    product_name: '',
    product_description: '',
    brand: '',
    price: '',
  });
  const [inlineSaving, setInlineSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadBusinessProfileAndData();
    }
  }, [user]);

  useEffect(() => {
    const hasData = productCategories.length > 0 && products.length > 0;
    onProductsUpdate(hasData);
  }, [productCategories.length, products.length, onProductsUpdate]);

  const loadBusinessProfileAndData = async () => {
    setLoading(true);
    try {
      // First load business profile to get business type
      const profileResponse = await authenticatedFetch(
        `/api/business/profile?user_id=${user.id}`
      );
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setBusinessProfile(profileData.profile);

        // If we have a business type, load product categories and products
        if (profileData.profile?.business_type) {
          await Promise.all([
            loadProductCategories(profileData.profile.business_type),
            loadProducts(profileData.profile.business_type),
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductCategories = async (businessType: string) => {
    try {
      const response = await authenticatedFetch(
        `/api/business/product-categories?business_type=${businessType}`
      );
      if (response.ok) {
        const data = await response.json();
        setProductCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to load product categories:', error);
    }
  };

  const loadProducts = async (businessType: string) => {
    try {
      const response = await authenticatedFetch(
        `/api/business/products?business_type=${businessType}&user_id=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.category_name || !businessProfile?.business_type) {
      toast.error(
        'Category name is required and business type must be configured'
      );
      return;
    }

    setSaving(true);
    try {
      const response = await authenticatedFetch(
        '/api/business/product-categories',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            business_type: businessProfile.business_type,
            category_name: categoryForm.category_name,
            category_description: categoryForm.category_description,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProductCategories(prev => [...prev, data.category]);
        resetCategoryForm();
        setShowCategoryForm(false);
        setHasUnsavedChanges(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      toast.error('Failed to add category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryForm.category_name) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await authenticatedFetch(
        '/api/business/product-categories',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingCategory.id,
            category_name: categoryForm.category_name,
            category_description: categoryForm.category_description,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProductCategories(prev =>
          prev.map(c => (c.id === editingCategory.id ? data.category : c))
        );
        resetCategoryForm();
        setEditingCategory(null);
        setShowCategoryForm(false);
        setHasUnsavedChanges(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error('Failed to update category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Category',
      description:
        'Are you sure you want to delete this category? This will also affect any associated products.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `/api/business/product-categories?id=${id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setProductCategories(prev => prev.filter(c => c.id !== id));
        // Reload products as they might be affected
        if (businessProfile?.business_type) {
          await loadProducts(businessProfile.business_type);
        }
        setHasUnsavedChanges(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category. Please try again.');
    }
  };

  const startEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      category_name: category.category_name,
      category_description: category.category_description || '',
    });
    setShowCategoryForm(true);
  };

  const handleSaveChanges = async () => {
    setSaveStatus('saving');

    try {
      // Since individual updates already saved to the database,
      // we just need to update the UI status
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay for UX

      setSaveStatus('success');
      setHasUnsavedChanges(false);

      // Clear success status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');

      // Clear error status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.product_name || !businessProfile?.business_type) {
      toast.error(
        'Product name is required and business type must be configured'
      );
      return;
    }

    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/business/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_type: businessProfile.business_type,
          category_id:
            productForm.category_id && productForm.category_id !== 'none'
              ? productForm.category_id
              : null,
          user_id: user.id,
          product_name: productForm.product_name,
          product_description: productForm.product_description,
          brand: productForm.brand,
          price: productForm.price ? parseFloat(productForm.price) : null,
          price_currency: productForm.price_currency,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(prev => [...prev, data.product]);
        resetProductForm();
        setShowProductForm(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      category_name: '',
      category_description: '',
    });
  };

  const resetProductForm = () => {
    setProductForm({
      category_id: 'none',
      product_name: '',
      product_description: '',
      brand: '',
      price: '',
      price_currency: 'USD',
    });
  };

  const startEditProduct = (product: BusinessProduct) => {
    setEditingProduct(product);
    setProductForm({
      category_id: product.category_id || 'none',
      product_name: product.product_name,
      product_description: product.product_description || '',
      brand: product.brand || '',
      price: product.price?.toString() || '',
      price_currency: product.price_currency || 'USD',
    });
    setShowProductForm(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !productForm.product_name) {
      toast.error('Product name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await authenticatedFetch('/api/business/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingProduct.id,
          product_name: productForm.product_name,
          product_description: productForm.product_description,
          brand: productForm.brand,
          price: productForm.price ? parseFloat(productForm.price) : null,
          price_currency: productForm.price_currency,
          category_id:
            productForm.category_id && productForm.category_id !== 'none'
              ? productForm.category_id
              : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(prev =>
          prev.map(p => (p.id === editingProduct.id ? data.product : p))
        );
        resetProductForm();
        setEditingProduct(null);
        setShowProductForm(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Product',
      description: 'Are you sure you want to delete this product?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `/api/business/products?id=${id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product. Please try again.');
    }
  };

  const getProductsForCategory = (categoryId: string) => {
    return products.filter(p => p.category_id === categoryId);
  };

  const getUncategorizedProducts = () => {
    return products.filter(p => !p.category_id);
  };

  const startInlineAdd = (categoryId: string) => {
    setAddingToCategory(categoryId);
    setInlineForm({
      product_name: '',
      product_description: '',
      brand: '',
      price: '',
    });
  };

  const cancelInlineAdd = () => {
    setAddingToCategory(null);
    setInlineForm({
      product_name: '',
      product_description: '',
      brand: '',
      price: '',
    });
  };

  const saveInlineProduct = async (categoryId: string) => {
    if (!inlineForm.product_name.trim()) {
      toast.error('Product name is required');
      return;
    }

    setInlineSaving(true);
    try {
      const response = await authenticatedFetch('/api/business/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_type: businessProfile?.business_type,
          category_id: categoryId,
          user_id: user.id,
          product_name: inlineForm.product_name.trim(),
          product_description: inlineForm.product_description.trim() || null,
          brand: inlineForm.brand.trim() || null,
          price: inlineForm.price ? parseFloat(inlineForm.price) : null,
          price_currency: 'USD',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(prev => [...prev, data.product]);
        cancelInlineAdd();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product. Please try again.');
    } finally {
      setInlineSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-green-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!businessProfile?.business_type) {
    return (
      <div className="text-center py-12 border rounded-lg bg-amber-50">
        <SettingsIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('businessTypeRequired')}
        </h3>
        <p className="text-gray-600 mb-4">
          Please complete the Business Information step first to configure your
          business type.
        </p>
        <p className="text-sm text-gray-500">
          Current business profile: {businessProfile ? 'Found' : 'Not found'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                {t('title')}
              </CardTitle>
              <CardDescription>
                Manage your product inventory for your{' '}
                <strong>{businessProfile.business_type}</strong> business
                {businessProfile.business_name &&
                  ` (${businessProfile.business_name})`}
                . Products are items you sell that don't require appointments.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Product Categories & Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                {t('categoriesTitle')}
              </CardTitle>
              <CardDescription>{t('categoriesDescription')}</CardDescription>
            </div>
            <Button
              onClick={() => {
                resetCategoryForm();
                setEditingCategory(null);
                setShowCategoryForm(true);
              }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <PlusIcon className="h-4 w-4" />
              {t('addCategory')}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {productCategories.length === 0 ? (
            <div className="text-center py-8">
              <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('noCategories')}
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first product category to organize your{' '}
                {businessProfile.business_type} inventory.
              </p>
              <Button
                onClick={() => {
                  resetCategoryForm();
                  setEditingCategory(null);
                  setShowCategoryForm(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Category
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Show products organized by category */}
              {productCategories.map(category => {
                const categoryProducts = getProductsForCategory(category.id);
                return (
                  <div
                    key={category.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                            {category.category_name}
                          </h4>
                          {category.category_description && (
                            <span className="text-sm text-blue-600 dark:text-blue-300">
                              - {category.category_description}
                            </span>
                          )}
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 px-2 py-1 rounded">
                            {categoryProducts.length} products
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditCategory(category)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                          >
                            <EditIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startInlineAdd(category.id)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30"
                            disabled={addingToCategory === category.id}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Products Table for this category */}
                    {categoryProducts.length > 0 ? (
                      <>
                        {/* Products Header */}
                        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                            <div className="col-span-3">Product Name</div>
                            <div className="col-span-3">Description</div>
                            <div className="col-span-2">Brand</div>
                            <div className="col-span-2">Price</div>
                            <div className="col-span-2 text-right">Actions</div>
                          </div>
                        </div>

                        {/* Product Rows */}
                        {categoryProducts.map((product, index) => (
                          <div
                            key={product.id}
                            className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div className="col-span-3 font-medium text-black dark:text-white">
                              {product.product_name}
                            </div>
                            <div className="col-span-3 text-sm text-black dark:text-gray-300">
                              {product.product_description || '-'}
                            </div>
                            <div className="col-span-2 text-sm text-black dark:text-gray-300">
                              {product.brand || '-'}
                            </div>
                            <div className="col-span-2 text-sm text-black dark:text-gray-300">
                              {product.price
                                ? `${product.price_currency} ${product.price}`
                                : '-'}
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-1 bg-transparent dark:bg-gray-800">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditProduct(product)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                              >
                                <EditIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Inline Add Row */}
                        {addingToCategory === category.id && (
                          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-yellow-50 dark:bg-yellow-900/20">
                            <div className="col-span-3">
                              <Input
                                value={inlineForm.product_name}
                                onChange={e =>
                                  setInlineForm(prev => ({
                                    ...prev,
                                    product_name: e.target.value,
                                  }))
                                }
                                placeholder="Product name"
                                className="h-8 text-sm"
                                autoFocus
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                value={inlineForm.product_description}
                                onChange={e =>
                                  setInlineForm(prev => ({
                                    ...prev,
                                    product_description: e.target.value,
                                  }))
                                }
                                placeholder="Description"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                value={inlineForm.brand}
                                onChange={e =>
                                  setInlineForm(prev => ({
                                    ...prev,
                                    brand: e.target.value,
                                  }))
                                }
                                placeholder="Brand"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={inlineForm.price}
                                onChange={e =>
                                  setInlineForm(prev => ({
                                    ...prev,
                                    price: e.target.value,
                                  }))
                                }
                                placeholder="Price"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-1 bg-transparent dark:bg-gray-800">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveInlineProduct(category.id)}
                                disabled={
                                  inlineSaving ||
                                  !inlineForm.product_name.trim()
                                }
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                {inlineSaving ? (
                                  <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckIcon className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelInlineAdd}
                                disabled={inlineSaving}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {addingToCategory === category.id ? (
                          <>
                            {/* Products Header */}
                            <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                                <div className="col-span-3">Product Name</div>
                                <div className="col-span-3">Description</div>
                                <div className="col-span-2">Brand</div>
                                <div className="col-span-2">Price</div>
                                <div className="col-span-2 text-right">
                                  Actions
                                </div>
                              </div>
                            </div>
                            {/* Inline Add Row for empty category */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-yellow-50 dark:bg-yellow-900/20">
                              <div className="col-span-3">
                                <Input
                                  value={inlineForm.product_name}
                                  onChange={e =>
                                    setInlineForm(prev => ({
                                      ...prev,
                                      product_name: e.target.value,
                                    }))
                                  }
                                  placeholder="Product name"
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  value={inlineForm.product_description}
                                  onChange={e =>
                                    setInlineForm(prev => ({
                                      ...prev,
                                      product_description: e.target.value,
                                    }))
                                  }
                                  placeholder="Description"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  value={inlineForm.brand}
                                  onChange={e =>
                                    setInlineForm(prev => ({
                                      ...prev,
                                      brand: e.target.value,
                                    }))
                                  }
                                  placeholder="Brand"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={inlineForm.price}
                                  onChange={e =>
                                    setInlineForm(prev => ({
                                      ...prev,
                                      price: e.target.value,
                                    }))
                                  }
                                  placeholder="Price"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="col-span-2 flex items-center justify-end gap-1 bg-transparent dark:bg-gray-800">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveInlineProduct(category.id)}
                                  disabled={
                                    inlineSaving ||
                                    !inlineForm.product_name.trim()
                                  }
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  {inlineSaving ? (
                                    <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <CheckIcon className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelInlineAdd}
                                  disabled={inlineSaving}
                                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                >
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="p-6 text-center text-gray-500">
                            <SettingsIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm">
                              No products in this category yet.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Click the + icon in the header to add a product
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Uncategorized Products */}
              {(() => {
                const uncategorizedProducts = getUncategorizedProducts();
                if (uncategorizedProducts.length === 0) return null;

                return (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    {/* Uncategorized Header */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                            Uncategorized Products
                          </h4>
                          <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-1 rounded">
                            {uncategorizedProducts.length} products
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Products Header */}
                    <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <div className="col-span-3">Product Name</div>
                        <div className="col-span-3">Description</div>
                        <div className="col-span-2">Brand</div>
                        <div className="col-span-2">Price</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                    </div>

                    {/* Product Rows */}
                    {uncategorizedProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="col-span-3 font-medium text-black dark:text-white">
                          {product.product_name}
                        </div>
                        <div className="col-span-3 text-sm text-black dark:text-gray-300">
                          {product.product_description || '-'}
                        </div>
                        <div className="col-span-2 text-sm text-black dark:text-gray-300">
                          {product.brand || '-'}
                        </div>
                        <div className="col-span-2 text-sm text-black dark:text-gray-300">
                          {product.price
                            ? `${product.price_currency} ${product.price}`
                            : '-'}
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditProduct(product)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                          >
                            <EditIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>

        {/* Save Changes Section */}
        {hasUnsavedChanges && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                <p className="text-sm text-amber-800">
                  You have unsaved changes to product categories
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saveStatus === 'success' && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckIcon className="h-4 w-4" />
                    Changes saved successfully!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-sm text-red-600">
                    Failed to save changes
                  </span>
                )}
                <Button
                  onClick={handleSaveChanges}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-3 w-3" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Category Form */}
      {showCategoryForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? t('editCategory') : t('addCategory')}
            </CardTitle>
            <CardDescription>
              {editingCategory
                ? 'Update the product category details below.'
                : `Create a new product category for your ${businessProfile.business_type} inventory.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category-name">{t('categoryName')}</Label>
              <Input
                id="category-name"
                value={categoryForm.category_name}
                onChange={e =>
                  setCategoryForm(prev => ({
                    ...prev,
                    category_name: e.target.value,
                  }))
                }
                placeholder="e.g., Electronics, Accessories"
                required
              />
            </div>

            <div>
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.category_description}
                onChange={e =>
                  setCategoryForm(prev => ({
                    ...prev,
                    category_description: e.target.value,
                  }))
                }
                placeholder="Describe what products this category covers..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={
                  editingCategory ? handleUpdateCategory : handleAddCategory
                }
                disabled={saving || !categoryForm.category_name}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingCategory ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                  resetCategoryForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Form */}
      {showProductForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </CardTitle>
            <CardDescription>
              {editingProduct
                ? 'Update the product details below.'
                : 'Define a specific product with pricing and details.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  value={productForm.product_name}
                  onChange={e =>
                    setProductForm(prev => ({
                      ...prev,
                      product_name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Smartphone, Laptop"
                  required
                />
              </div>
              <div>
                <Label htmlFor="product-category">Category</Label>
                <Select
                  value={productForm.category_id}
                  onValueChange={value =>
                    setProductForm(prev => ({ ...prev, category_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {productCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productForm.product_description}
                onChange={e =>
                  setProductForm(prev => ({
                    ...prev,
                    product_description: e.target.value,
                  }))
                }
                placeholder="Describe the product..."
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={productForm.brand}
                  onChange={e =>
                    setProductForm(prev => ({ ...prev, brand: e.target.value }))
                  }
                  placeholder="Brand name"
                />
              </div>
              <div>
                <Label htmlFor="price">Product Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={e =>
                    setProductForm(prev => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={productForm.price_currency}
                  onValueChange={value =>
                    setProductForm(prev => ({ ...prev, price_currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={
                  editingProduct ? handleUpdateProduct : handleAddProduct
                }
                disabled={saving || !productForm.product_name}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingProduct ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  resetProductForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <SettingsIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-900 dark:text-green-200">
                Products Status
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Business Type: <strong>{businessProfile.business_type}</strong>{' '}
                | Categories: <strong>{productCategories.length}</strong> |
                Products: <strong>{products.length}</strong>
                {productCategories.length > 0 && products.length > 0 && (
                  <span className="block mt-1">
                    ✅ Ready for inventory management and sales!
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
