const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://crhmtzrnahdpgrpmxmjk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaG10enJuYWhkcGdycG14bWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTk2NDYsImV4cCI6MjA4NDY5NTY0Nn0.Ig3jcGDMMVmOlSIp3G3Zy6sD-78mOYlpfIlc51ml2-k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchPizzas() {
    // First get category ID for 'Pizze'
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name');

    if (catError) {
        console.error('Error fetching categories:', catError);
        return;
    }

    const pizzaCategory = categories.find(c => c.name.toLowerCase().includes('pizz'));

    if (!pizzaCategory) {
        console.log('No Pizza category found. Categories:', categories.map(c => c.name));
        return;
    }

    console.log('Pizza Category ID:', pizzaCategory.id);

    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('name, description')
        .eq('category_id', pizzaCategory.id);

    if (prodError) {
        console.error('Error fetching products:', prodError);
        return;
    }

    console.log(JSON.stringify(products, null, 2));
}

fetchPizzas();
