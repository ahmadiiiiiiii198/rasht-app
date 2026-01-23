const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hnoadcbppldmawognwdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhub2FkY2JwcGxkbWF3b2dud2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODgwMjEsImV4cCI6MjA3MjA2NDAyMX0.cMQBW7VFcWFdVsXY-0H0PaLRDSY13jicT4lPGh9Pmlo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectOffers() {
  console.log('🔍 Inspecting special_offers table...');
  
  const { data, error } = await supabase
    .from('special_offers')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error fetching special_offers:', error);
  } else {
    console.log('✅ special_offers columns:', data && data.length > 0 ? Object.keys(data[0]) : 'Table is empty');
    if (data && data.length > 0) {
        console.log('Sample row:', data[0]);
        if ('category_id' in data[0]) {
            console.log('✅ category_id column exists in special_offers!');
        } else {
            console.log('❌ category_id column MISSING in special_offers!');
        }
    }
  }

  // Check if offer_categories exists
  console.log('\n🔍 Checking for offer_categories table...');
  const { data: catData, error: catError } = await supabase
    .from('offer_categories')
    .select('*')
    .limit(5);

    if (catError) {
        console.log('❌ offer_categories table likely does not exist:', catError.message);
    } else {
        console.log('✅ offer_categories table exists!');
        console.log('Columns:', catData && catData.length > 0 ? Object.keys(catData[0]) : 'Table is empty');
        console.log('Samples:', catData);
    }
}

inspectOffers();
