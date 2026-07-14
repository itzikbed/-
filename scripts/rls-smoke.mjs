import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Missing environment variables in .env.local!")
  process.exit(1)
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log("--- STARTING RLS SMOKE TEST ---")

  // TEST 1: Anon sees only published cats, and exactly the published count (12)
  const { data: anonCats, error: anonCatsError } = await supabaseAnon
    .from('cats')
    .select('*')
  
  if (anonCatsError) {
    console.error("TEST 1 FAILED (error):", anonCatsError.message)
    process.exit(1)
  }
  
  const nonPublished = anonCats.filter(c => c.status !== 'published')
  if (nonPublished.length > 0) {
    console.error(`TEST 1 FAILED: Anon can see non-published cats! Mismatched rows:`, nonPublished)
    process.exit(1)
  }
  
  if (anonCats.length !== 12) {
    console.error(`TEST 1 FAILED: Anon sees ${anonCats.length} cats (expected 12)`)
    process.exit(1)
  }
  
  console.log(`TEST 1 SUCCESS: Anon sees only published cats, and exactly 12 of them.`)

  // Generate a random user
  const email = `test_${Date.now()}@example.com`
  const password = "password123"
  const fullName = "ישראל ישראלי"
  const phone = "050-1234567"

  console.log(`Creating test user: ${email}...`)
  // 2. Signup new user
  const { data: authData, error: signupError } = await supabaseAnon.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone
      }
    }
  })

  if (signupError) {
    console.error("Signup failed:", signupError.message)
    process.exit(1)
  }

  const userId = authData.user.id
  console.log(`User created successfully with ID: ${userId}`)

  // Create user authenticated client
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
  await supabaseUser.auth.setSession(authData.session)

  // TEST 2: Check profile row auto-created on signup
  const { data: profileRow, error: profileError } = await supabaseUser
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error("TEST 2 FAILED: Profile row was not auto-created:", profileError.message)
    process.exit(1)
  } else {
    console.log("TEST 2 SUCCESS: Profile row auto-created:", JSON.stringify(profileRow, null, 2))
    if (profileRow.full_name === fullName && profileRow.phone === phone && profileRow.role === 'user') {
      console.log("TEST 2b SUCCESS: Profile fields correctly populated")
    } else {
      console.error("TEST 2b FAILED: Profile fields mismatch", profileRow)
      process.exit(1)
    }
  }

  // TEST 3: User can upsert own adopter_profile
  const { data: upsertData, error: upsertError } = await supabaseUser
    .from('adopter_profiles')
    .upsert({
      user_id: userId,
      age: 25,
      city: 'תל אביב',
      household_desc: 'גר לבד בדירה',
      has_other_pets: false,
      has_cat_experience: true,
      vet_clinic: 'מרפאה עירונית',
      adoption_reason: 'אוהב חתולים',
      surrender_circumstances: 'אף פעם לא',
      floor_type: 'floor_2',
      has_window_screens: true
    })
    .select()

  if (upsertError) {
    console.error("TEST 3 FAILED: Cannot upsert own adopter_profile:", upsertError.message)
    process.exit(1)
  } else {
    console.log("TEST 3 SUCCESS: Upserted own adopter_profile successfully:", JSON.stringify(upsertData, null, 2))
  }

  // TEST 4: User cannot change own role to 'admin' (trigger blocks)
  console.log("Attempting privilege escalation (changing role to admin)...")
  const { error: escalateError } = await supabaseUser
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)

  if (escalateError) {
    console.log("TEST 4 SUCCESS: Privilege escalation blocked as expected with error:", escalateError.message)
  } else {
    console.error("TEST 4 FAILED: Escalation succeeded! This is a vulnerability.")
    process.exit(1)
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Get a seeded published cat ID for request tests
  const { data: publishedCats } = await supabaseAdmin
    .from('cats')
    .select('id')
    .eq('status', 'published')
    .limit(1)

  const publishedCatId = publishedCats?.[0]?.id
  if (!publishedCatId) {
    console.error("Could not find any published cats in the DB for request testing!")
    process.exit(1)
  }

  // TEST 5: Non-approved publisher cannot insert a cat
  console.log("TEST 5: Checking that non-approved publisher cannot insert a cat...")
  const { error: insertCatError } = await supabaseUser
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'שלג',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'חתול לבן מתוק ומשחק עם כדורים',
      status: 'draft'
    })

  if (insertCatError) {
    console.log("TEST 5 SUCCESS: Cat insertion blocked as expected for non-approved publisher.")
  } else {
    console.error("TEST 5 FAILED: Non-approved publisher was able to insert a cat!")
    process.exit(1)
  }

  // TEST 6: Adopter without completed questionnaire cannot insert adoption request
  console.log("TEST 6: Checking that adopter without completed questionnaire cannot insert request...")
  const { error: insertRequestError } = await supabaseUser
    .from('adoption_requests')
    .insert({
      cat_id: publishedCatId,
      adopter_id: userId,
      message: 'אני מאוד רוצה לאמץ את החתול הזה!'
    })

  if (insertRequestError) {
    console.log("TEST 6 SUCCESS: Request blocked as expected for incomplete questionnaire.")
  } else {
    console.error("TEST 6 FAILED: Adopter was able to submit request without completed questionnaire!")
    process.exit(1)
  }

  // TEST 7: Complete questionnaire, approve publisher, check self-publish restriction
  console.log("TEST 7: Completing questionnaire and approving publisher...")
  // Complete questionnaire
  const { error: completeQError } = await supabaseUser
    .from('adopter_profiles')
    .update({ completed_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (completeQError) {
    console.error("Failed to complete questionnaire for test:", completeQError.message)
    process.exit(1)
  }

  // Approve publisher status via admin
  const { error: approvePubError } = await supabaseAdmin
    .from('profiles')
    .update({ publisher_status: 'approved' })
    .eq('id', userId)

  if (approvePubError) {
    console.error("Failed to approve publisher status for test:", approvePubError.message)
    process.exit(1)
  }

  // Try to insert a cat with status 'published' directly (should fail)
  console.log("Trying to insert a cat with status 'published' directly...")
  const { error: directPublishError } = await supabaseUser
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'שלג',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'חתול לבן מתוק ומשחק עם כדורים',
      status: 'published'
    })

  if (directPublishError) {
    console.log("TEST 7a SUCCESS: Direct insertion of published cat blocked.")
  } else {
    console.error("TEST 7a FAILED: Uploader was able to insert a cat directly with status 'published'!")
    process.exit(1)
  }

  // Insert cat as 'draft' (should succeed)
  console.log("Inserting a cat as 'draft'...")
  const { data: draftCat, error: draftInsertError } = await supabaseUser
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'שלג',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'חתול לבן מתוק ומשחק עם כדורים',
      status: 'draft'
    })
    .select('id')
    .single()

  if (draftInsertError || !draftCat) {
    console.error("TEST 7b FAILED: Approved publisher could not insert a draft cat:", draftInsertError?.message)
    process.exit(1)
  } else {
    console.log("TEST 7b SUCCESS: Inserted draft cat with ID:", draftCat.id)
  }

  // Try to update status of draft cat to 'published' (should fail)
  console.log("Trying to update status of draft cat to 'published'...")
  const { error: selfPublishUpdateError } = await supabaseUser
    .from('cats')
    .update({ status: 'published' })
    .eq('id', draftCat.id)

  if (selfPublishUpdateError) {
    console.log("TEST 7c SUCCESS: Uploader self-publish update blocked.")
  } else {
    console.error("TEST 7c FAILED: Uploader was able to set status to 'published'!")
    process.exit(1)
  }

  // TEST 8: Duplicate open request is blocked
  console.log("TEST 8: Testing duplicate request blocking...")
  // First insert request (should succeed since questionnaire is now completed)
  const { error: req1Error } = await supabaseUser
    .from('adoption_requests')
    .insert({
      cat_id: publishedCatId,
      adopter_id: userId,
      message: 'שלום, אשמח מאוד לאמץ את החתול המקסים הזה.'
    })

  if (req1Error) {
    console.error("TEST 8a FAILED: Adopter could not insert first adoption request:", req1Error.message)
    process.exit(1)
  } else {
    console.log("TEST 8a SUCCESS: First adoption request submitted successfully.")
  }

  // Try to insert second request for same cat (should fail)
  const { error: req2Error } = await supabaseUser
    .from('adoption_requests')
    .insert({
      cat_id: publishedCatId,
      adopter_id: userId,
      message: 'פנייה שנייה - אנא חזרו אליי בהקדם!'
    })

  if (req2Error) {
    console.log("TEST 8b SUCCESS: Duplicate adoption request blocked. Error:", req2Error.message)
  } else {
    console.error("TEST 8b FAILED: Duplicate adoption request was allowed!")
    process.exit(1)
  }

  // Clean up user using service role client
  console.log("Cleaning up test user...")
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (deleteError) {
    console.error("Cleanup failed:", deleteError.message)
  } else {
    console.log("Cleanup succeeded.")
  }

  console.log("--- RLS SMOKE TEST COMPLETED ---")
}

run()
