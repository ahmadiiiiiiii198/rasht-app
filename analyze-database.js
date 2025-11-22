const { createClient } = require('@supabase/supabase-js');

// Database configuration
const SUPABASE_URL = 'https://hnoadcbppldmawognwdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhub2FkY2JwcGxkbWF3b2dud2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODgwMjEsImV4cCI6MjA3MjA2NDAyMX0.cMQBW7VFcWFdVsXY-0H0PaLRDSY13jicT4lPGh9Pmlo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function analyzeDatabase() {
  console.log('🔍 ANALYZING SUPABASE DATABASE STRUCTURE...\n');
  
  try {
    // 1. Analyze Categories table
    console.log('📋 CATEGORIES TABLE:');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(3);
    
    if (catError) {
      console.log('❌ Categories Error:', catError.message);
    } else {
      console.log('✅ Sample Categories:', categories?.length || 0, 'records');
      if (categories && categories.length > 0) {
        console.log('   Fields:', Object.keys(categories[0]));
        console.log('   Sample:', categories[0]);
      }
    }
    console.log('');

    // 2. Analyze Products table
    console.log('🍽️ PRODUCTS TABLE:');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(3);
    
    if (prodError) {
      console.log('❌ Products Error:', prodError.message);
    } else {
      console.log('✅ Sample Products:', products?.length || 0, 'records');
      if (products && products.length > 0) {
        console.log('   Fields:', Object.keys(products[0]));
        console.log('   Sample:', products[0]);
      }
    }
    console.log('');

    // 3. Analyze Orders table
    console.log('📦 ORDERS TABLE:');
    const { data: orders, error: ordError } = await supabase
      .from('orders')
      .select('*')
      .limit(3);
    
    if (ordError) {
      console.log('❌ Orders Error:', ordError.message);
    } else {
      console.log('✅ Sample Orders:', orders?.length || 0, 'records');
      if (orders && orders.length > 0) {
        console.log('   Fields:', Object.keys(orders[0]));
        console.log('   Sample:', orders[0]);
      }
    }
    console.log('');

    // 4. Analyze Order Items table
    console.log('🛒 ORDER_ITEMS TABLE:');
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .limit(3);
    
    if (itemsError) {
      console.log('❌ Order Items Error:', itemsError.message);
    } else {
      console.log('✅ Sample Order Items:', orderItems?.length || 0, 'records');
      if (orderItems && orderItems.length > 0) {
        console.log('   Fields:', Object.keys(orderItems[0]));
        console.log('   Sample:', orderItems[0]);
      }
    }
    console.log('');

    // 5. Analyze User Profiles table
    console.log('👤 USER_PROFILES TABLE:');
    const { data: profiles, error: profError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3);
    
    if (profError) {
      console.log('❌ User Profiles Error:', profError.message);
    } else {
      console.log('✅ Sample User Profiles:', profiles?.length || 0, 'records');
      if (profiles && profiles.length > 0) {
        console.log('   Fields:', Object.keys(profiles[0]));
        console.log('   Sample:', profiles[0]);
      }
    }
    console.log('');

    // 6. Analyze Comments table
    console.log('💬 COMMENTS TABLE:');
    const { data: comments, error: commError } = await supabase
      .from('comments')
      .select('*')
      .limit(3);
    
    if (commError) {
      console.log('❌ Comments Error:', commError.message);
    } else {
      console.log('✅ Sample Comments:', comments?.length || 0, 'records');
      if (comments && comments.length > 0) {
        console.log('   Fields:', Object.keys(comments[0]));
        console.log('   Sample:', comments[0]);
      }
    }
    console.log('');

    // 7. Analyze Site Content table
    console.log('📄 SITE_CONTENT TABLE:');
    const { data: siteContent, error: contentError } = await supabase
      .from('site_content')
      .select('*')
      .limit(3);
    
    if (contentError) {
      console.log('❌ Site Content Error:', contentError.message);
    } else {
      console.log('✅ Sample Site Content:', siteContent?.length || 0, 'records');
      if (siteContent && siteContent.length > 0) {
        console.log('   Fields:', Object.keys(siteContent[0]));
        console.log('   Sample:', siteContent[0]);
      }
    }
    console.log('');

    // 8. Check table schema with information_schema
    console.log('🔍 CHECKING TABLE SCHEMAS...');
    const { data: tableInfo, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (schemaError) {
      console.log('❌ Schema Error:', schemaError.message);
    } else if (tableInfo) {
      console.log('✅ All Tables:', tableInfo.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('🚨 ANALYSIS ERROR:', error.message);
  }
}

// Run the analysis
analyzeDatabase();
