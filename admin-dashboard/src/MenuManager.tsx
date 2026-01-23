import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Category {
    id: string;
    name: string;
    products?: Product[];
}

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image_url: string;
    category_id: string;
    sort_order: number;
}

const MenuManager = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Fetch Data
    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        setLoading(true);
        const { data: cats } = await supabase
            .from('categories')
            .select('*, products(*)')
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

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading menu data...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <h3 className="page-title">Menu Overview</h3>
                <button className="btn btn-primary">
                    <Plus size={18} /> New Product
                </button>
            </div>

            <div className="categories-list">
                {categories.map((category) => (
                    <div key={category.id} className="card">
                        <div
                            className="card-header"
                            onClick={() => toggleCategory(category.id)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    transition: 'transform 0.2s',
                                    transform: expandedCategory === category.id ? 'rotate(90deg)' : 'none'
                                }}>
                                    <ChevronRight size={20} color="#94a3b8" />
                                </div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{category.name}</h4>
                                <span className="badge">
                                    {category.products?.length || 0} items
                                </span>
                            </div>
                            <div className="actions">
                                <button className="action-btn"><Edit size={18} /></button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedCategory === category.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                >
                                    <div className="card-content">
                                        {category.products?.map(product => (
                                            <div key={product.id} className="product-item">
                                                <div className="product-info">
                                                    <div style={{ position: 'relative', width: 48, height: 48 }}>
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} className="product-thumb" />
                                                        ) : (
                                                            <div className="product-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <ImageIcon size={20} color="#cbd5e1" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h5 style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{product.name}</h5>
                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>€{product.price}</p>
                                                    </div>
                                                </div>

                                                <div className="actions">
                                                    <button className="btn" style={{ fontSize: '0.75rem', border: '1px solid #fdba74', color: '#c2410c', background: '#fff7ed' }}>
                                                        Add-ons
                                                    </button>
                                                    <button className="action-btn" title="Edit"><Edit size={18} /></button>
                                                    <button className="action-btn" title="Delete"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                        ))}

                                        <button className="btn" style={{
                                            width: '100%',
                                            marginTop: '1rem',
                                            justifyContent: 'center',
                                            border: '2px dashed #e2e8f0',
                                            background: 'transparent',
                                            color: '#64748b'
                                        }}>
                                            <Plus size={18} /> Add Product to {category.name}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MenuManager;
