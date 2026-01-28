const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://crhmtzrnahdpgrpmxmjk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaG10enJuYWhkcGdycG14bWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTk2NDYsImV4cCI6MjA4NDY5NTY0Nn0.Ig3jcGDMMVmOlSIp3G3Zy6sD-78mOYlpfIlc51ml2-k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchPizzas() {
    const { data: categories } = await supabase.from('categories').select('id, name');
    const pizzaCategory = categories.find(c => c.name.toLowerCase().includes('pizz'));

    if (!pizzaCategory) return;

    const { data: products } = await supabase
        .from('products')
        .select('name, description')
        .eq('category_id', pizzaCategory.id);

    if (products) {
        products.forEach(p => {
            console.log(`PRODUCT: ${p.name} | INGREDIENTS: ${p.description}`);
        });
    }
}

fetchPizzas();
