import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronRight, X, Clock, Check, FolderPlus } from 'lucide-react';
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

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading menu data...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h3 className="page-title" style={{ margin: 0 }}>Menu Overview</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={openAddCategory} style={{ background: '#f1f5f9' }}>
                        <FolderPlus size={18} /> New Category
                    </button>
                    <button className="btn btn-primary" onClick={() => { setSelectedCategoryId(categories[0]?.id || null); setShowProductModal(true); }}>
                        <Plus size={18} /> New Product
                    </button>
                </div>
            </div>

            <div className="categories-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {categories.map((category) => (
                    <div key={category.id} className="card" style={{ overflow: 'hidden' }}>
                        <div
                            className="card-header"
                            onClick={() => toggleCategory(category.id)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem 1.25rem',
                                cursor: 'pointer',
                                background: category.coming_soon ? '#fffbeb' : 'white'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    transition: 'transform 0.2s',
                                    transform: expandedCategory === category.id ? 'rotate(90deg)' : 'none'
                                }}>
                                    <ChevronRight size={20} color="#94a3b8" />
                                </div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{category.name}</h4>
                                <span className="badge" style={{
                                    background: '#f1f5f9',
                                    padding: '4px 10px',
                                    borderRadius: 12,
                                    fontSize: '0.75rem'
                                }}>
                                    {category.products?.length || 0} items
                                </span>
                                {category.coming_soon && (
                                    <span style={{
                                        background: '#fef3c7',
                                        color: '#92400e',
                                        padding: '4px 10px',
                                        borderRadius: 12,
                                        fontSize: '0.7rem',
                                        fontWeight: 600
                                    }}>
                                        <Clock size={12} style={{ marginRight: 4 }} /> Coming Soon
                                    </span>
                                )}
                            </div>
                            <div className="actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="action-btn"
                                    onClick={(e) => openEditCategory(category, e)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
                                >
                                    <Edit size={18} color="#64748b" />
                                </button>
                                <button
                                    className="action-btn"
                                    onClick={(e) => deleteCategory(category.id, e)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
                                >
                                    <Trash2 size={18} color="#ef4444" />
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedCategory === category.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <div className="card-content" style={{ padding: '1rem 1.25rem', background: '#f8fafc' }}>
                                        {category.products?.map(product => (
                                            <div key={product.id} className="product-item" style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                background: product.coming_soon ? '#fffbeb' : 'white',
                                                borderRadius: 8,
                                                marginBottom: 8,
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <div className="product-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ position: 'relative', width: 48, height: 48 }}>
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} style={{
                                                                width: 48, height: 48, borderRadius: 8, objectFit: 'cover'
                                                            }} />
                                                        ) : (
                                                            <div style={{
                                                                width: 48, height: 48, borderRadius: 8, background: '#f1f5f9',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}>
                                                                <ImageIcon size={20} color="#cbd5e1" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <h5 style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{product.name}</h5>
                                                            {product.coming_soon && (
                                                                <span style={{
                                                                    background: '#fef3c7',
                                                                    color: '#92400e',
                                                                    padding: '2px 8px',
                                                                    borderRadius: 10,
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 600
                                                                }}>
                                                                    Coming Soon
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>€{product.price}</p>
                                                    </div>
                                                </div>

                                                <div className="actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => toggleProductComingSoon(product)}
                                                        title={product.coming_soon ? 'Mark as Available' : 'Mark as Coming Soon'}
                                                        style={{
                                                            background: product.coming_soon ? '#dcfce7' : '#fef3c7',
                                                            border: 'none',
                                                            borderRadius: 6,
                                                            padding: '6px 10px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        {product.coming_soon ? <Check size={14} /> : <Clock size={14} />}
                                                        {product.coming_soon ? 'Available' : 'Coming Soon'}
                                                    </button>
                                                    <button
                                                        onClick={() => openEditProduct(product)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} color="#64748b" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteProduct(product.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => openAddProduct(category.id)}
                                            className="btn"
                                            style={{
                                                width: '100%',
                                                marginTop: '0.5rem',
                                                justifyContent: 'center',
                                                border: '2px dashed #e2e8f0',
                                                background: 'transparent',
                                                color: '#64748b'
                                            }}
                                        >
                                            <Plus size={18} /> Add Product to {category.name}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Category Modal */}
            {showCategoryModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: 450, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                            <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={saveCategory}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Sort Order</label>
                                <input
                                    type="number"
                                    value={categoryForm.sort_order}
                                    onChange={e => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={categoryForm.is_active}
                                        onChange={e => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                    />
                                    Active
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={categoryForm.coming_soon}
                                        onChange={e => setCategoryForm({ ...categoryForm, coming_soon: e.target.checked })}
                                    />
                                    Coming Soon
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                {editingCategory ? 'Save Changes' : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, overflow: 'auto', padding: '2rem 0'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: 550, padding: '1.5rem', margin: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                            <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={saveProduct}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
                                <select
                                    value={selectedCategoryId || ''}
                                    onChange={e => setSelectedCategoryId(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                                <input
                                    type="text"
                                    value={productForm.name}
                                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Price (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productForm.price}
                                        onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Sort Order</label>
                                    <input
                                        type="number"
                                        value={productForm.sort_order}
                                        onChange={e => setProductForm({ ...productForm, sort_order: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                                <textarea
                                    value={productForm.description}
                                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                    rows={2}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ingredients (comma separated)</label>
                                <input
                                    type="text"
                                    value={productForm.ingredients}
                                    onChange={e => setProductForm({ ...productForm, ingredients: e.target.value })}
                                    placeholder="Mozzarella, Tomato, Basil"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Image URL</label>
                                <input
                                    type="url"
                                    value={productForm.image_url}
                                    onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                                    placeholder="https://..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={productForm.is_active}
                                        onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })}
                                    />
                                    Active
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={productForm.coming_soon}
                                        onChange={e => setProductForm({ ...productForm, coming_soon: e.target.checked })}
                                    />
                                    Coming Soon
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                {editingProduct ? 'Save Changes' : 'Create Product'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuManager;
