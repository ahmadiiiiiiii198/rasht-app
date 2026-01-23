import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Image as ImageIcon, Check, X, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Basic Types
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
        // Fetch categories with products
        const { data: cats, error } = await supabase
            .from('categories')
            .select('*, products(*)')
            .order('sort_order', { ascending: true });

        if (cats) {
            // Sort products within categories
            const sortedCats = cats.map(c => ({
                ...c,
                products: c.products.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            }));
            setCategories(sortedCats);
        }
        setLoading(false);
    };

    const toggleCategory = (id: string) => {
        setExpandedCategory(expandedCategory === id ? null : id);
    };

    if (loading) return <div className="text-center p-10">Loading menu data...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Menu Categories</h3>
                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800">
                    <Plus size={18} /> New Product
                </button>
            </div>

            <div className="space-y-4">
                {categories.map((category) => (
                    <div key={category.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleCategory(category.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-1 rounded-full bg-slate-100 transition-transform ${expandedCategory === category.id ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={18} className="text-slate-500" />
                                </div>
                                <h4 className="font-bold text-lg text-slate-800">{category.name}</h4>
                                <span className="text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                    {category.products?.length || 0} products
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-slate-400 hover:text-blue-500"><Edit size={18} /></button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedCategory === category.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-slate-100"
                                >
                                    <div className="p-4 space-y-2 bg-slate-50/50">
                                        {category.products?.map(product => (
                                            <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden relative">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-semibold text-slate-800">{product.name}</h5>
                                                        <p className="text-sm text-slate-500 font-mono">€{product.price}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button className="px-3 py-1 text-xs text-orange-600 border border-orange-200 bg-orange-50 rounded hover:bg-orange-100 transition-colors">
                                                        Config Add-ons
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Edit Product">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2">
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
