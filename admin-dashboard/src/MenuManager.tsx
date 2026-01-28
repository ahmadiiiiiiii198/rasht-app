import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronRight, X, Clock, Check, FolderPlus, Upload, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Category {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    coming_soon: boolean;
    sort_order: number | null;
    products?: Product[];
}

interface Product {
    id: string;
    name: string;
    price: number;
    description: string | null;
    image_url: string | null;
    category_id: string;
    sort_order: number | null;
    is_active: boolean;
    coming_soon: boolean;
    ingredients: string[] | null;
}

const MenuManager = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modals
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Category Form
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        is_active: true,
        coming_soon: false,
        sort_order: 0
    });

    // Product Form
    const [productForm, setProductForm] = useState({
        name: '',
        price: 0,
        description: '',
        image_url: '',
        is_active: true,
        coming_soon: false,
        sort_order: 0,
        ingredients: ''
    });

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        setLoading(true);
        const { data: cats } = await supabase
            .from('categories')
            .select('*, products(*)')
            .eq('is_extra_group', false)
            .order('sort_order', { ascending: true });

        if (cats) {
            const sortedCats = cats.map(c => ({
                ...c,
                products: c.products?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) || []
            }));
            setCategories(sortedCats);
        }
        setLoading(false);
    };

    const toggleCategory = (id: string) => {
        setExpandedCategory(expandedCategory === id ? null : id);
    };

    // Image Upload Handler
    const handleImageUpload = async (file: File): Promise<string | null> => {
        try {
            setUploading(true);
            setUploadProgress(0);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `product-images/${fileName}`;

            // Simulate progress (Supabase doesn't provide upload progress natively)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (error) {
                console.error('Upload error:', error);
                alert('Failed to upload image. Make sure storage bucket exists.');
                return null;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);

            return urlData.publicUrl;
        } catch (err) {
            console.error('Upload error:', err);
            setUploading(false);
            return null;
        }
    };

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        const url = await handleImageUpload(file);
        if (url) {
            setProductForm({ ...productForm, image_url: url });
        }
    };

    // Category Actions
    const openAddCategory = () => {
        setEditingCategory(null);
        setCategoryForm({ name: '', is_active: true, coming_soon: false, sort_order: categories.length });
        setShowCategoryModal(true);
    };

    const openEditCategory = (cat: Category, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCategory(cat);
        setCategoryForm({
            name: cat.name,
            is_active: cat.is_active,
            coming_soon: cat.coming_soon || false,
            sort_order: cat.sort_order || 0
        });
        setShowCategoryModal(true);
    };

    const saveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const slug = categoryForm.name.toLowerCase().replace(/\s+/g, '-');

        if (editingCategory) {
            await supabase
                .from('categories')
                .update({ ...categoryForm, slug })
                .eq('id', editingCategory.id);
        } else {
            await supabase
                .from('categories')
                .insert([{ ...categoryForm, slug, is_extra_group: false }]);
        }

        setShowCategoryModal(false);
        fetchMenu();
    };

    const deleteCategory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this category and all its products?')) return;
        await supabase.from('products').delete().eq('category_id', id);
        await supabase.from('categories').delete().eq('id', id);
        fetchMenu();
    };

    // Product Actions
    const openAddProduct = (categoryId: string) => {
        setEditingProduct(null);
        setSelectedCategoryId(categoryId);
        setProductForm({
            name: '',
            price: 0,
            description: '',
            image_url: '',
            is_active: true,
            coming_soon: false,
            sort_order: 0,
            ingredients: ''
        });
        setShowProductModal(true);
    };

    const openEditProduct = (product: Product) => {
        setEditingProduct(product);
        setSelectedCategoryId(product.category_id);
        setProductForm({
            name: product.name,
            price: product.price,
            description: product.description || '',
            image_url: product.image_url || '',
            is_active: product.is_active,
            coming_soon: product.coming_soon || false,
            sort_order: product.sort_order || 0,
            ingredients: product.ingredients?.join(', ') || ''
        });
        setShowProductModal(true);
    };

    const saveProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: productForm.name,
            price: productForm.price,
            description: productForm.description || null,
            image_url: productForm.image_url || null,
            is_active: productForm.is_active,
            coming_soon: productForm.coming_soon,
            sort_order: productForm.sort_order,
            ingredients: productForm.ingredients ? productForm.ingredients.split(',').map(i => i.trim()) : null,
            category_id: selectedCategoryId
        };

        if (editingProduct) {
            await supabase
                .from('products')
                .update(payload)
                .eq('id', editingProduct.id);
        } else {
            await supabase
                .from('products')
                .insert([payload]);
        }

        setShowProductModal(false);
        fetchMenu();
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        await supabase.from('products').delete().eq('id', id);
        fetchMenu();
    };

    const toggleProductComingSoon = async (product: Product) => {
        await supabase
            .from('products')
            .update({ coming_soon: !product.coming_soon })
            .eq('id', product.id);
        fetchMenu();
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '50vh',
                gap: '1rem',
                color: 'var(--persian-gold)'
            }}>
                <Loader className="animate-spin" size={24} />
                <span>Loading menu...</span>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                gap: '1rem',
                flexWrap: 'wrap'
            }}>
                <div>
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.75rem',
                        background: 'linear-gradient(135deg, #c9a45c, #d4b76a)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Menu Management
                    </h2>
                    <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {categories.length} categories • {categories.reduce((acc, c) => acc + (c.products?.length || 0), 0)} products
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={openAddCategory}>
                        <FolderPlus size={18} /> New Category
                    </button>
                    <button className="btn btn-primary" onClick={() => { setSelectedCategoryId(categories[0]?.id || null); setShowProductModal(true); }}>
                        <Plus size={18} /> New Product
                    </button>
                </div>
            </div>

            {/* Categories List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {categories.map((category) => (
                    <motion.div
                        key={category.id}
                        className="card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div
                            className="card-header"
                            onClick={() => toggleCategory(category.id)}
                            style={{
                                background: category.coming_soon ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <motion.div
                                    animate={{ rotate: expandedCategory === category.id ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronRight size={20} color="var(--persian-gold)" />
                                </motion.div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                    {category.name}
                                </h4>
                                <span className="badge badge-muted">
                                    {category.products?.length || 0} items
                                </span>
                                {category.coming_soon && (
                                    <span className="badge badge-warning">
                                        <Clock size={12} style={{ marginRight: 4 }} /> Coming Soon
                                    </span>
                                )}
                            </div>
                            <div className="actions">
                                <button className="action-btn" onClick={(e) => openEditCategory(category, e)}>
                                    <Edit size={18} />
                                </button>
                                <button className="action-btn danger" onClick={(e) => deleteCategory(category.id, e)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedCategory === category.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="card-content">
                                        {category.products?.map(product => (
                                            <motion.div
                                                key={product.id}
                                                className="product-item"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                style={{
                                                    background: product.coming_soon ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-secondary)'
                                                }}
                                            >
                                                <div className="product-info">
                                                    <div style={{ position: 'relative', width: 56, height: 56 }}>
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="product-thumb"
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                width: 56,
                                                                height: 56,
                                                                borderRadius: 10,
                                                                background: 'var(--persian-emerald)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                border: '2px solid var(--border-color)'
                                                            }}>
                                                                <ImageIcon size={24} color="var(--persian-gold)" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span className="product-name">{product.name}</span>
                                                            {product.coming_soon && (
                                                                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                                                    Coming Soon
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="product-price">€{product.price.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <div className="actions">
                                                    <button
                                                        onClick={() => toggleProductComingSoon(product)}
                                                        title={product.coming_soon ? 'Mark as Available' : 'Mark as Coming Soon'}
                                                        style={{
                                                            background: product.coming_soon ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                            border: 'none',
                                                            borderRadius: 8,
                                                            padding: '8px 12px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            color: product.coming_soon ? 'var(--success)' : 'var(--warning)'
                                                        }}
                                                    >
                                                        {product.coming_soon ? <Check size={14} /> : <Clock size={14} />}
                                                        {product.coming_soon ? 'Available' : 'Coming Soon'}
                                                    </button>
                                                    <button className="action-btn" onClick={() => openEditProduct(product)}>
                                                        <Edit size={18} />
                                                    </button>
                                                    <button className="action-btn danger" onClick={() => deleteProduct(product.id)}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}

                                        <button
                                            onClick={() => openAddProduct(category.id)}
                                            className="btn btn-secondary"
                                            style={{
                                                width: '100%',
                                                marginTop: '1rem',
                                                justifyContent: 'center',
                                                border: '2px dashed var(--border-color)',
                                                background: 'transparent'
                                            }}
                                        >
                                            <Plus size={18} /> Add Product to {category.name}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Category Modal */}
            <AnimatePresence>
                {showCategoryModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h3 className="modal-title">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                                <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={saveCategory}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={categoryForm.name}
                                            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                            required
                                            placeholder="e.g. Pizze, Bevande..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Sort Order</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={categoryForm.sort_order}
                                            onChange={e => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) })}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <label className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={categoryForm.is_active}
                                                onChange={e => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                            />
                                            <span>Active</span>
                                        </label>
                                        <label className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={categoryForm.coming_soon}
                                                onChange={e => setCategoryForm({ ...categoryForm, coming_soon: e.target.checked })}
                                            />
                                            <span>Coming Soon</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingCategory ? 'Save Changes' : 'Create Category'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Product Modal */}
            <AnimatePresence>
                {showProductModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal"
                            style={{ maxWidth: 600 }}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h3 className="modal-title">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                                <button className="modal-close" onClick={() => setShowProductModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={saveProduct}>
                                <div className="modal-body">
                                    {/* Image Upload Zone */}
                                    <div className="form-group">
                                        <label className="form-label">Product Image</label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={onFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                        <div
                                            className={`image-upload-zone ${productForm.image_url ? 'has-image' : ''}`}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {uploading ? (
                                                <div style={{ padding: '2rem', textAlign: 'center' }}>
                                                    <Loader className="animate-spin" size={32} color="var(--persian-gold)" />
                                                    <p style={{ margin: '1rem 0 0', color: 'var(--text-secondary)' }}>
                                                        Uploading... {uploadProgress}%
                                                    </p>
                                                    <div className="upload-progress" style={{ width: `${uploadProgress}%` }} />
                                                </div>
                                            ) : productForm.image_url ? (
                                                <img src={productForm.image_url} alt="Product" />
                                            ) : (
                                                <>
                                                    <Upload size={40} className="image-upload-icon" />
                                                    <p className="image-upload-text">Click to upload image</p>
                                                    <p className="image-upload-hint">PNG, JPG up to 5MB</p>
                                                </>
                                            )}
                                        </div>
                                        {productForm.image_url && (
                                            <button
                                                type="button"
                                                onClick={() => setProductForm({ ...productForm, image_url: '' })}
                                                style={{
                                                    marginTop: '0.5rem',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--danger)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                Remove Image
                                            </button>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-select"
                                            value={selectedCategoryId || ''}
                                            onChange={e => setSelectedCategoryId(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={productForm.name}
                                            onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                            required
                                            placeholder="e.g. Margherita, Diavola..."
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Price (€)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-input"
                                                value={productForm.price}
                                                onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Sort Order</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={productForm.sort_order}
                                                onChange={e => setProductForm({ ...productForm, sort_order: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-textarea"
                                            value={productForm.description}
                                            onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                            placeholder="Brief description of the product..."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Ingredients (comma separated)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={productForm.ingredients}
                                            onChange={e => setProductForm({ ...productForm, ingredients: e.target.value })}
                                            placeholder="Mozzarella, Pomodoro, Basilico..."
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                        <label className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={productForm.is_active}
                                                onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })}
                                            />
                                            <span>Active</span>
                                        </label>
                                        <label className="form-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={productForm.coming_soon}
                                                onChange={e => setProductForm({ ...productForm, coming_soon: e.target.checked })}
                                            />
                                            <span>Coming Soon</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={uploading}>
                                        {editingProduct ? 'Save Changes' : 'Create Product'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MenuManager;
