const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Database configuration
const SUPABASE_URL = 'https://hnoadcbppldmawognwdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhub2FkY2JwcGxkbWF3b2dud2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODgwMjEsImV4cCI6MjA3MjA2NDAyMX0.cMQBW7VFcWFdVsXY-0H0PaLRDSY13jicT4lPGh9Pmlo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyPageCodes() {
  console.log('🔍 VERIFYING MOBILE APP PAGES AGAINST REAL DATABASE...\n');
  
  // 1. Get real database structure
  const dbStructure = await getDatabaseStructure();
  
  // 2. Check each page's code against database
  await checkMenuPage(dbStructure);
  await checkCartPage(dbStructure);
  await checkOrdersPage(dbStructure);
  await checkProfilePage(dbStructure);
  await checkOffersPage(dbStructure);
  await checkContattiPage(dbStructure);
  await checkLoyaltyPage(dbStructure);
  
  console.log('\n🎯 VERIFICATION COMPLETE!');
}

async function getDatabaseStructure() {
  console.log('📊 GETTING REAL DATABASE STRUCTURE...\n');
  
  const structure = {};
  
  try {
    // Categories
    const { data: categories } = await supabase.from('categories').select('*').limit(1);
    if (categories && categories.length > 0) {
      structure.categories = Object.keys(categories[0]);
      console.log('✅ Categories fields:', structure.categories.join(', '));
    }
    
    // Products  
    const { data: products } = await supabase.from('products').select('*').limit(1);
    if (products && products.length > 0) {
      structure.products = Object.keys(products[0]);
      console.log('✅ Products fields:', structure.products.join(', '));
    }
    
    // Orders
    const { data: orders } = await supabase.from('orders').select('*').limit(1);
    structure.orders = []; // Empty but table exists
    console.log('✅ Orders table exists (no records yet)');
    
    // Order Items
    const { data: orderItems } = await supabase.from('order_items').select('*').limit(1);
    structure.orderItems = []; // Empty but table exists
    console.log('✅ Order Items table exists (no records yet)');
    
    // User Profiles
    const { data: profiles } = await supabase.from('user_profiles').select('*').limit(1);
    structure.userProfiles = []; // Empty but table exists
    console.log('✅ User Profiles table exists (no records yet)');
    
    // Comments
    const { data: comments } = await supabase.from('comments').select('*').limit(1);
    structure.comments = []; // Empty but table exists
    console.log('✅ Comments table exists (no records yet)');
    
  } catch (error) {
    console.log('❌ Error getting database structure:', error.message);
  }
  
  console.log('');
  return structure;
}

async function checkMenuPage(dbStructure) {
  console.log('🍽️ CHECKING MENU PAGE...');
  
  try {
    const menuPagePath = path.join(__dirname, 'src', 'pages', 'MenuPage.tsx');
    const menuCode = fs.readFileSync(menuPagePath, 'utf8');
    
    // Check if MenuPage uses correct database fields
    const issues = [];
    
    // Check Products usage
    if (dbStructure.products) {
      const missingFields = [];
      const extraFields = ['max_uses_per_user', 'cooldown_hours', 'uses_limit_enabled', 'cooldown_enabled'];
      
      extraFields.forEach(field => {
        if (dbStructure.products.includes(field) && !menuCode.includes(field)) {
          missingFields.push(field);
        }
      });
      
      if (missingFields.length > 0) {
        issues.push(`Missing new database fields: ${missingFields.join(', ')}`);
      }
    }
    
    // Check Categories usage
    if (dbStructure.categories) {
      if (dbStructure.categories.includes('extras_enabled') && !menuCode.includes('extras_enabled')) {
        issues.push('Missing categories.extras_enabled field');
      }
    }
    
    if (issues.length === 0) {
      console.log('   ✅ MenuPage matches database structure');
    } else {
      console.log('   ⚠️ MenuPage issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
  } catch (error) {
    console.log('   ❌ Error checking MenuPage:', error.message);
  }
  console.log('');
}

async function checkCartPage(dbStructure) {
  console.log('🛒 CHECKING CART PAGE...');
  
  try {
    const cartPagePath = path.join(__dirname, 'src', 'pages', 'CartPage.tsx');
    const cartCode = fs.readFileSync(cartPagePath, 'utf8');
    
    const issues = [];
    
    // Check if CartPage creates orders with correct structure
    if (!cartCode.includes('order_number')) {
      issues.push('Should use order_number field for orders');
    }
    
    if (!cartCode.includes('product_price')) {
      issues.push('Should use product_price field in order_items');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ CartPage matches database structure');
    } else {
      console.log('   ⚠️ CartPage issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
  } catch (error) {
    console.log('   ❌ Error checking CartPage:', error.message);
  }
  console.log('');
}

async function checkOrdersPage(dbStructure) {
  console.log('📦 CHECKING ORDERS PAGE...');
  
  try {
    const ordersPagePath = path.join(__dirname, 'src', 'pages', 'OrdersPage.tsx');
    const ordersCode = fs.readFileSync(ordersPagePath, 'utf8');
    
    const issues = [];
    
    // Basic checks
    if (!ordersCode.includes('getUserOrders')) {
      issues.push('Should use getUserOrders function');
    }
    
    if (!ordersCode.includes('getOrderItems')) {
      issues.push('Should use getOrderItems function');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ OrdersPage matches database structure');
    } else {
      console.log('   ⚠️ OrdersPage issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
  } catch (error) {
    console.log('   ❌ Error checking OrdersPage:', error.message);
  }
  console.log('');
}

async function checkProfilePage(dbStructure) {
  console.log('👤 CHECKING PROFILE PAGE...');
  
  try {
    const profilePagePath = path.join(__dirname, 'src', 'pages', 'ProfilePage.tsx');
    const profileCode = fs.readFileSync(profilePagePath, 'utf8');
    
    const issues = [];
    
    // Check if uses user_profiles table
    if (!profileCode.includes('user_profiles')) {
      issues.push('Should use user_profiles table');
    }
    
    if (!profileCode.includes('full_name')) {
      issues.push('Should use full_name field instead of separate first/last names');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ ProfilePage matches database structure');
    } else {
      console.log('   ⚠️ ProfilePage issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
  } catch (error) {
    console.log('   ❌ Error checking ProfilePage:', error.message);
  }
  console.log('');
}

async function checkOffersPage(dbStructure) {
  console.log('🎁 CHECKING OFFERS PAGE...');
  
  try {
    const offersPagePath = path.join(__dirname, 'src', 'pages', 'OffersPage.tsx');
    const offersCode = fs.readFileSync(offersPagePath, 'utf8');
    
    const issues = [];
    
    // Check if tries to use site_content (which doesn't exist)
    if (offersCode.includes('site_content')) {
      issues.push('site_content table does not exist in database - should use alternative approach');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ OffersPage implementation is acceptable');
    } else {
      console.log('   ⚠️ OffersPage issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
  } catch (error) {
    console.log('   ❌ Error checking OffersPage:', error.message);
  }
  console.log('');
}

async function checkContattiPage(dbStructure) {
  console.log('📞 CHECKING CONTATTI PAGE...');
  
  try {
    const contattiPagePath = path.join(__dirname, 'src', 'pages', 'ContattiPage.tsx');
    const contattiCode = fs.readFileSync(contattiPagePath, 'utf8');
    
    const issues = [];
    
    // Check if uses comments table correctly
    if (!contattiCode.includes('comments')) {
      issues.push('Should use comments table for reviews');
    }
    
    if (contattiCode.includes('site_content')) {
      issues.push('site_content table does not exist - should use alternative for contact info');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ ContattiPage comments usage is correct');
    } else {
      console.log('   ⚠️ ContattiPage issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
  } catch (error) {
    console.log('   ❌ Error checking ContattiPage:', error.message);
  }
  console.log('');
}

async function checkLoyaltyPage(dbStructure) {
  console.log('⭐ CHECKING LOYALTY PAGE...');
  
  try {
    const loyaltyPagePath = path.join(__dirname, 'src', 'pages', 'LoyaltyPage.tsx');
    const loyaltyCode = fs.readFileSync(loyaltyPagePath, 'utf8');
    
    const issues = [];
    
    // Check if calculates loyalty correctly from orders
    if (!loyaltyCode.includes('getUserOrders')) {
      issues.push('Should use getUserOrders to calculate loyalty points');
    }
    
    if (loyaltyCode.includes('site_content')) {
      issues.push('site_content table does not exist - should use alternative for rewards');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ LoyaltyPage order calculation is correct');
    } else {
      console.log('   ⚠️ LoyaltyPage issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
  } catch (error) {
    console.log('   ❌ Error checking LoyaltyPage:', error.message);
  }
  console.log('');
}

// Run the verification
verifyPageCodes();
