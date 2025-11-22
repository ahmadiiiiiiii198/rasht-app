#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hnoadcbppldmawognwdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhub2FkY2JwcGxkbWF3b2dud2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODgwMjEsImV4cCI6MjA3MjA2NDAyMX0.cMQBW7VFcWFdVsXY-0H0PaLRDSY13jicT4lPGh9Pmlo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function studyDatabase() {
  console.log('🔍 STUDYING DATABASE STRUCTURE...\n');

  // Get all tables
  console.log('📋 AVAILABLE TABLES:');
  const { data: tables } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
  if (tables) {
    tables.forEach(t => console.log(`  - ${t.table_name}`));
  }

  // Study products table
  console.log('\n📦 PRODUCTS TABLE STRUCTURE:');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (products && products.length > 0) {
    console.log('Sample product:', JSON.stringify(products[0], null, 2));
  }

  // Check for options/variants table
  console.log('\n🔎 LOOKING FOR OPTIONS/VARIANTS/EXTRAS TABLES:');
  const tableNames = ['options', 'opzioni', 'variants', 'product_options', 'product_variants', 'extras', 'product_extras'];
  
  for (const tableName of tableNames) {
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      if (!error && data) {
        console.log(`✅ Found table: ${tableName}`);
        console.log(`   Sample record:`, JSON.stringify(data[0], null, 2));
      }
    } catch (e) {
      // Table doesn't exist
    }
  }

  // Study categories
  console.log('\n📂 CATEGORIES TABLE:');
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(2);
  
  if (categories) {
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id})`);
      console.log(`    extras_enabled: ${cat.extras_enabled}`);
    });
  }

  // Get products with their categories
  console.log('\n🍕 SAMPLE PRODUCTS WITH CATEGORIES:');
  const { data: productsWithCats } = await supabase
    .from('products')
    .select('id, name, category_id, price')
    .limit(5);
  
  if (productsWithCats) {
    productsWithCats.forEach(p => {
      console.log(`  - ${p.name} (Category: ${p.category_id}, Price: €${p.price})`);
    });
  }

  // Study order items to see how options are stored
  console.log('\n📝 ORDER ITEMS STRUCTURE (to see how options are stored):');
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*')
    .limit(3);
  
  if (orderItems && orderItems.length > 0) {
    console.log('Sample order item:', JSON.stringify(orderItems[0], null, 2));
  }

  // Check for any table with 'option' in the name
  console.log('\n🔍 SEARCHING FOR OPTION-RELATED TABLES:');
  const { data: allTables } = await supabase.rpc('get_tables');
  console.log('All tables:', allTables);
}

studyDatabase().catch(console.error);
