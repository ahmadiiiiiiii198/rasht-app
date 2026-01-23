
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hnoadcbppldmawognwdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhub2FkY2JwcGxkbWF3b2dud2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODgwMjEsImV4cCI6MjA3MjA2NDAyMX0.cMQBW7VFcWFdVsXY-0H0PaLRDSY13jicT4lPGh9Pmlo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('Checking database connection...');
  
  try {
    // 1. Check Categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('name')
      .limit(5);

    if (catError) throw catError;
    console.log('Categories found:', categories.map(c => c.name));

    // 2. Check Products
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('name, description')
      .limit(5);

    if (prodError) throw prodError;
    console.log('Products found:', products.map(p => `${p.name} (${p.description})`));
    
    // 3. Check for specific "Efes" branding in product names
    const { data: efesProducts, error: efesError } = await supabase
        .from('products')
        .select('name')
        .ilike('name', '%efes%')
        .limit(5);
        
    if (efesError) throw efesError;
    if (efesProducts.length > 0) {
        console.log('Found "Efes" branded products:', efesProducts.map(p => p.name));
    } else {
        console.log('No specific "Efes" branded products found in top search.');
    }

  } catch (error) {
    console.error('Error connecting to database:', error.message);
  }
}

checkDatabase();
