/* eslint-disable max-lines */
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

const urlObj = new URL(supabaseUrl)
if (urlObj.hostname !== 'localhost' && urlObj.hostname !== '127.0.0.1') {
  console.error("Refusing to run rls-smoke: Target URL must be localhost/127.0.0.1 to prevent accidental production overwrite.")
  process.exit(1)
}

const createAnonClient = () => createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const supabaseAnon = createAnonClient()

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

  let userId;
  let adopterId;
  let thirdId;
  let draftCat;
  let requestId;
  let failed = false;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  const originalExit = process.exit;
  process.exit = (code) => {
    if (code !== 0) {
      throw new Error(`process.exit(${code}) called`);
    }
    originalExit(code);
  };

  try {
    // Generate a random user
    const email = `test_${Date.now()}@example.com`
    const password = "password123"
    const fullName = "ישראל ישראלי"
    const phone = "050-1234567"

    console.log(`Creating test user: ${email}...`)
    // 2. Signup new user
    const { data: authData, error: signupError } = await createAnonClient().auth.signUp({
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

    userId = authData.user.id
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
  const { data: insertedDraftCat, error: draftInsertError } = await supabaseUser
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

  if (draftInsertError || !insertedDraftCat) {
    console.error("TEST 7b FAILED: Approved publisher could not insert a draft cat:", draftInsertError?.message)
    process.exit(1)
  } else {
    draftCat = insertedDraftCat
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

  // TEST 9: Storage — owner can upload into own cat folder; others cannot.
  // Guards against the 0001 policy bug (unqualified `name` resolved to cats.name)
  // fixed in migration 0004. draftCat belongs to this (now approved) publisher.
  console.log("TEST 9: Storage upload policies...")
  const testBlob = new Blob(['rls-smoke storage probe'], { type: 'image/webp' })
  const ownProbePath = `${draftCat.id}/${crypto.randomUUID()}-card.webp`
  const foreignProbePath = `${publishedCatId}/${crypto.randomUUID()}-card.webp`

  const { error: ownUploadError } = await supabaseUser.storage
    .from('cat-photos')
    .upload(ownProbePath, testBlob, { contentType: 'image/webp' })

  if (ownUploadError) {
    console.error("TEST 9a FAILED: Owner could not upload photo to own cat folder:", ownUploadError.message)
    process.exit(1)
  }
  console.log("TEST 9a SUCCESS: Owner uploaded into own cat folder.")

  const { data: draftSignedUrl, error: draftSignedUrlError } = await supabaseAnon.storage
    .from('cat-photos')
    .createSignedUrl(ownProbePath, 60)

  if (!draftSignedUrlError || draftSignedUrl?.signedUrl) {
    console.error("TEST 9b FAILED: Anon obtained a signed URL for unmoderated media!")
    process.exit(1)
  }
  console.log("TEST 9b SUCCESS: Anon cannot access unmoderated media.")

  const { error: foreignUploadError } = await supabaseUser.storage
    .from('cat-photos')
    .upload(foreignProbePath, testBlob, { contentType: 'image/webp' })

  if (foreignUploadError) {
    console.log("TEST 9c SUCCESS: Upload into another owner's cat folder blocked. Error:", foreignUploadError.message)
  } else {
    console.error("TEST 9c FAILED: User uploaded into a cat folder they do not own!")
    process.exit(1)
  }

  const { data: removed, error: ownDeleteError } = await supabaseUser.storage
    .from('cat-photos')
    .remove([ownProbePath])

  if (ownDeleteError || !removed || removed.length === 0) {
    console.error("TEST 9d FAILED: Owner could not delete own object:", ownDeleteError?.message ?? 'no object removed')
    process.exit(1)
  }
  console.log("TEST 9d SUCCESS: Owner deleted own object.")

  // ============ TEST 10: Contact Isolation Before Approval ============
  console.log("TEST 10: Contact Isolation Before Approval...")
  
  // 1. Create Adopter X
  const adopterEmail = `adopter_${Date.now()}@example.com`
  const adopterPassword = "password123"
  const { data: adopterAuth, error: adopterSignupError } = await createAnonClient().auth.signUp({
    email: adopterEmail,
    password: adopterPassword,
    options: {
      data: {
        full_name: "משה המאמץ",
        phone: "052-1111111"
      }
    }
  })
  if (adopterSignupError) {
    console.error("Adopter signup failed:", adopterSignupError.message)
    process.exit(1)
  }
  adopterId = adopterAuth.user.id
  const supabaseAdopter = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
  await supabaseAdopter.auth.setSession(adopterAuth.session)

  // Complete Adopter X's questionnaire
  const { error: qErr } = await supabaseAdopter.from('adopter_profiles').upsert({
    user_id: adopterId,
    age: 30,
    city: 'ירושלים',
    household_desc: 'דירת 3 חדרים עם מרפסת סגורה',
    floor_type: 'floor_2',
    adoption_reason: 'אוהב חתולים ומחפש חבר לחיים',
    surrender_circumstances: 'לא יקרה מעולם',
    has_other_pets: false,
    has_cat_experience: true,
    has_window_screens: true,
    completed_at: new Date().toISOString()
  })
  if (qErr) {
    console.error("Adopter q-profile failed:", qErr.message)
    process.exit(1)
  }

  // 2. Create Third User Z
  const thirdEmail = `third_${Date.now()}@example.com`
  const thirdPassword = "password123"
  const { data: thirdAuth, error: thirdSignupError } = await createAnonClient().auth.signUp({
    email: thirdEmail,
    password: thirdPassword,
    options: {
      data: {
        full_name: "אורח זר",
        phone: "053-2222222"
      }
    }
  })
  if (thirdSignupError) {
    console.error("Third user signup failed:", thirdSignupError.message)
    process.exit(1)
  }
  thirdId = thirdAuth.user.id
  const supabaseThird = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
  await supabaseThird.auth.setSession(thirdAuth.session)

  // 3. Make Publisher's draft cat published (using admin client to bypass self-publish block)
  const { error: makePublishedError } = await supabaseAdmin
    .from('cats')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', draftCat.id)
  
  if (makePublishedError) {
    console.error("Failed to publish draft cat for test:", makePublishedError.message)
    process.exit(1)
  }

  // 4. Adopter X submits adoption request
  const { data: requestRow, error: reqInsertErr } = await supabaseAdopter
    .from('adoption_requests')
    .insert({
      cat_id: draftCat.id,
      adopter_id: adopterId,
      message: 'אשמח מאוד לאמץ את החתול המקסים הזה!'
    })
    .select('id')
    .single()

  if (reqInsertErr || !requestRow) {
    console.error("Failed to insert adoption request for isolation test:", reqInsertErr?.message)
    process.exit(1)
  }
  requestId = requestRow.id

  // 5. Verify Isolation Before Approval
  // Adopter X cannot select Publisher Y profile
  const { data: profSelectAdopter, error: profSelectAdopterErr } = await supabaseAdopter.from('profiles').select('full_name, phone').eq('id', userId)
  if (profSelectAdopterErr) {
    console.error("Unexpected error on Adopter direct profile select:", profSelectAdopterErr.message)
    process.exit(1)
  }
  if (profSelectAdopter && profSelectAdopter.length > 0) {
    console.error("TEST 10 FAILED: Adopter can read Publisher profile before approval!")
    process.exit(1)
  }

  // Publisher Y cannot select Adopter X profile
  const { data: profSelectPublisher, error: profSelectPublisherErr } = await supabaseUser.from('profiles').select('full_name, phone').eq('id', adopterId)
  if (profSelectPublisherErr) {
    console.error("Unexpected error on Publisher direct profile select:", profSelectPublisherErr.message)
    process.exit(1)
  }
  if (profSelectPublisher && profSelectPublisher.length > 0) {
    console.error("TEST 10 FAILED: Publisher can read Adopter profile before approval!")
    process.exit(1)
  }

  // Adopter X calling RPC get_handoff_contact returns zero rows
  const { data: rpcAdopterBefore, error: rpcAdopterBeforeErr } = await supabaseAdopter.rpc('get_handoff_contact', { request_id: requestId })
  if (rpcAdopterBeforeErr) {
    console.error("Unexpected error on Adopter RPC call:", rpcAdopterBeforeErr.message)
    process.exit(1)
  }
  if (rpcAdopterBefore && rpcAdopterBefore.length > 0) {
    console.error("TEST 10 FAILED: Adopter RPC returned contact before approval!")
    process.exit(1)
  }

  // Publisher Y calling RPC get_handoff_contact returns zero rows
  const { data: rpcPublisherBefore, error: rpcPublisherBeforeErr } = await supabaseUser.rpc('get_handoff_contact', { request_id: requestId })
  if (rpcPublisherBeforeErr) {
    console.error("Unexpected error on Publisher RPC call:", rpcPublisherBeforeErr.message)
    process.exit(1)
  }
  if (rpcPublisherBefore && rpcPublisherBefore.length > 0) {
    console.error("TEST 10 FAILED: Publisher RPC returned contact before approval!")
    process.exit(1)
  }

  console.log("TEST 10 SUCCESS: Contact isolation before approval is active.")

  // ============ TEST 11: Contact Handoff After Approval ============
  console.log("TEST 11: Contact Handoff After Approval...")

  const { data: adminProfile, error: adminProfileErr } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()
  if (adminProfileErr || !adminProfile) {
    console.error("Failed to query admin profile in test:", adminProfileErr?.message)
    process.exit(1)
  }

  const { error: adminApproveErr } = await supabaseAdmin
    .from('adoption_requests')
    .update({
      status: 'approved',
      decided_by: adminProfile.id,
      decided_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (adminApproveErr) {
    console.error("Failed to approve request via admin:", adminApproveErr.message)
    process.exit(1)
  }

  // 2. Direct profiles select STILL returns empty (both directions)
  const { data: profSelectAdopterAfter, error: profSelectAdopterAfterErr } = await supabaseAdopter.from('profiles').select('full_name, phone').eq('id', userId)
  if (profSelectAdopterAfterErr) {
    console.error("Unexpected error on Adopter direct profile select after approval:", profSelectAdopterAfterErr.message)
    process.exit(1)
  }
  if (profSelectAdopterAfter && profSelectAdopterAfter.length > 0) {
    console.error("TEST 11 FAILED: Direct select allowed profile read after approval (security leak)!")
    process.exit(1)
  }

  const { data: profSelectPublisherAfter, error: profSelectPublisherAfterErr } = await supabaseUser.from('profiles').select('full_name, phone').eq('id', adopterId)
  if (profSelectPublisherAfterErr) {
    console.error("Unexpected error on Publisher direct profile select after approval:", profSelectPublisherAfterErr.message)
    process.exit(1)
  }
  if (profSelectPublisherAfter && profSelectPublisherAfter.length > 0) {
    console.error("TEST 11 FAILED: Direct select allowed profile read after approval (security leak)!")
    process.exit(1)
  }

  // 3. Adopter calling RPC returns Publisher details
  const { data: rpcAdopterAfter, error: rpcAdopterAfterErr } = await supabaseAdopter.rpc('get_handoff_contact', { request_id: requestId })
  if (rpcAdopterAfterErr || !rpcAdopterAfter || rpcAdopterAfter.length === 0) {
    console.error("TEST 11 FAILED: Adopter RPC could not read Publisher contact after approval:", rpcAdopterAfterErr?.message)
    process.exit(1)
  }
  const adopterContactResult = rpcAdopterAfter[0]
  if (adopterContactResult.full_name !== fullName || adopterContactResult.phone !== phone) {
    console.error("TEST 11 FAILED: Adopter RPC contact details mismatch", adopterContactResult)
    process.exit(1)
  }

  // 4. Publisher calling RPC returns Adopter details
  const { data: rpcPublisherAfter, error: rpcPublisherAfterErr } = await supabaseUser.rpc('get_handoff_contact', { request_id: requestId })
  if (rpcPublisherAfterErr || !rpcPublisherAfter || rpcPublisherAfter.length === 0) {
    console.error("TEST 11 FAILED: Publisher RPC could not read Adopter contact after approval:", rpcPublisherAfterErr?.message)
    process.exit(1)
  }
  const publisherContactResult = rpcPublisherAfter[0]
  if (publisherContactResult.full_name !== "משה המאמץ" || publisherContactResult.phone !== "052-1111111") {
    console.error("TEST 11 FAILED: Publisher RPC contact details mismatch", publisherContactResult)
    process.exit(1)
  }

  // 5. Unrelated third user Z calling RPC returns zero rows
  const { data: rpcThirdAfter, error: rpcThirdAfterErr } = await supabaseThird.rpc('get_handoff_contact', { request_id: requestId })
  if (rpcThirdAfterErr) {
    console.error("Unexpected error on Third RPC call after approval:", rpcThirdAfterErr.message)
    process.exit(1)
  }
  if (rpcThirdAfter && rpcThirdAfter.length > 0) {
    console.error("TEST 11 FAILED: Unrelated user Z could read approved contact details!")
    process.exit(1)
  }

  console.log("TEST 11 SUCCESS: Contact handoff RPC functions correctly and securely.")

  // ============ TEST 11.5: Deletion & Archival RLS Policies ============
  console.log("TEST 11.5: Deletion & Archival RLS Policies...")

  // 1. Owner CAN delete their never-published draft cat
  console.log("TEST 11.5a: Owner CAN delete never-published draft cat...")
  const { data: tempCat1, error: tempCat1Err } = await supabaseAdmin
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'מחיקון',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'חתול זמני למחיקה לצורכי בדיקות מחיקה של מודעות',
      status: 'draft'
    })
    .select('id')
    .single()

  if (tempCat1Err || !tempCat1) {
    throw new Error("Failed to insert tempCat1 for delete test: " + tempCat1Err?.message)
  }

  const { data: deletedTemp1, error: deleteTemp1Err } = await supabaseUser
    .from('cats')
    .delete()
    .eq('id', tempCat1.id)
    .select()

  if (deleteTemp1Err) {
    throw new Error("Owner failed to delete never-published draft cat: " + deleteTemp1Err.message)
  }
  if (!deletedTemp1 || deletedTemp1.length !== 1) {
    throw new Error("Owner delete never-published draft cat did not affect exactly 1 row")
  }

  const { data: selectTemp1 } = await supabaseAdmin.from('cats').select('id').eq('id', tempCat1.id).maybeSingle()
  if (selectTemp1) {
    throw new Error("Temp cat 1 still exists after owner deletion")
  }
  console.log("TEST 11.5a SUCCESS: Owner deleted never-published draft cat successfully.")

  // 2. Owner CANNOT delete the cat once it has published_at set
  console.log("TEST 11.5b: Owner CANNOT delete cat with published_at set...")
  const { data: tempCat2, error: tempCat2Err } = await supabaseAdmin
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'לא-מחיקון',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'חתול זמני שלא יימחק לצורכי בדיקות מחיקה של מודעות',
      status: 'published',
      published_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (tempCat2Err || !tempCat2) {
    throw new Error("Failed to insert tempCat2 for delete test: " + tempCat2Err?.message)
  }

  const { data: deletedTemp2 } = await supabaseUser
    .from('cats')
    .delete()
    .eq('id', tempCat2.id)
    .select()

  if (deletedTemp2 && deletedTemp2.length > 0) {
    await supabaseAdmin.from('cats').delete().eq('id', tempCat2.id)
    throw new Error("Owner was able to delete cat with published_at set!")
  }
  console.log("TEST 11.5b SUCCESS: Owner delete of published cat returned 0 rows.")
  await supabaseAdmin.from('cats').delete().eq('id', tempCat2.id)

  // 3. Anon/other-user delete attempts affect 0 rows
  console.log("TEST 11.5c: Other user/anon CANNOT delete cat...")
  const { data: tempCat3, error: tempCat3Err } = await supabaseAdmin
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'זר-לא-ימחוק',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'חתול מוגן מפני זרים לצורכי בדיקת הרשאות מחיקה',
      status: 'draft'
    })
    .select('id')
    .single()

  if (tempCat3Err || !tempCat3) {
    throw new Error("Failed to insert tempCat3 for delete test: " + tempCat3Err?.message)
  }

  const { data: deletedTemp3 } = await supabaseThird
    .from('cats')
    .delete()
    .eq('id', tempCat3.id)
    .select()

  if (deletedTemp3 && deletedTemp3.length > 0) {
    await supabaseAdmin.from('cats').delete().eq('id', tempCat3.id)
    throw new Error("Other user was able to delete owner's cat!")
  }

  const { data: deletedAnon } = await supabaseAnon
    .from('cats')
    .delete()
    .eq('id', tempCat3.id)
    .select()

  if (deletedAnon && deletedAnon.length > 0) {
    await supabaseAdmin.from('cats').delete().eq('id', tempCat3.id)
    throw new Error("Anon user was able to delete cat!")
  }

  console.log("TEST 11.5c SUCCESS: Other user and anon delete attempts returned 0 rows.")
  await supabaseAdmin.from('cats').delete().eq('id', tempCat3.id)

  // ============ TEST S7: Adversarial RLS Tests ============
  console.log("TEST S7a: Non-admin trying to insert approved request...")
  const { error: s7aError } = await supabaseUser
    .from('adoption_requests')
    .insert({
      cat_id: publishedCatId,
      adopter_id: userId,
      message: 'הודעת בקשה תקינה באורך 20 תווים לפחות',
      status: 'approved'
    })
  if (!s7aError) {
    throw new Error("TEST S7a FAILED: Non-admin was able to insert approved request directly!")
  }
  console.log("TEST S7a SUCCESS: Direct insertion of approved request blocked as expected.")

  console.log("TEST S7b: Non-admin trying to insert request with decided_by...")
  const { error: s7bError } = await supabaseUser
    .from('adoption_requests')
    .insert({
      cat_id: publishedCatId,
      adopter_id: userId,
      message: 'הודעת בקשה תקינה באורך 20 תווים לפחות',
      decided_by: userId
    })
  if (!s7bError) {
    throw new Error("TEST S7b FAILED: Non-admin was able to insert request with decided_by set!")
  }
  console.log("TEST S7b SUCCESS: Direct insertion of request with decided_by blocked as expected.")

  console.log("TEST S7c: Non-admin trying to withdraw and tamper request fields...")
  // Find another published cat to request
  const { data: otherCats } = await supabaseAdmin
    .from('cats')
    .select('id')
    .eq('status', 'published')
    .neq('id', publishedCatId)
    .limit(1)
  const otherCatId = otherCats[0].id

  // Create a pending request
  const { data: s7cReq, error: s7cReqErr } = await supabaseAdopter
    .from('adoption_requests')
    .insert({
      cat_id: otherCatId,
      adopter_id: adopterId,
      message: 'בקשה לבדיקת Trigger מניעת זיוף שדות'
    })
    .select('id')
    .single()
  
  if (s7cReqErr || !s7cReq) {
    throw new Error("Failed to insert pending request for S7c: " + s7cReqErr?.message)
  }

  // Try to update it by changing message as well (should trigger exception)
  const { error: s7cError } = await supabaseAdopter
    .from('adoption_requests')
    .update({
      status: 'withdrawn',
      message: 'שינוי הודעה זדוני'
    })
    .eq('id', s7cReq.id)

  // Clean up
  await supabaseAdmin.from('adoption_requests').delete().eq('id', s7cReq.id)

  if (!s7cError) {
    throw new Error("TEST S7c FAILED: Non-admin was able to withdraw and modify message field in request!")
  }
  console.log("TEST S7c SUCCESS: Tampering during request withdrawal blocked as expected.")

  console.log("TEST S7d: Setting completed_at on incomplete adopter profile...")
  const { error: s7dError } = await supabaseThird
    .from('adopter_profiles')
    .insert({
      user_id: thirdId,
      completed_at: new Date().toISOString()
    })
  if (!s7dError) {
    throw new Error("TEST S7d FAILED: User was able to complete questionnaire with missing required fields!")
  }
  console.log("TEST S7d SUCCESS: Completing incomplete questionnaire blocked as expected.")

  console.log("TEST S7e: Owner trying to modify photos of a published cat...")
  const { data: pubCat, error: pubCatErr } = await supabaseAdmin
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'חתול מפורסם',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'תיאור של חתול מפורסם באורך מתאים בהחלט',
      status: 'published',
      published_at: new Date().toISOString()
    })
    .select('id')
    .single()
  if (pubCatErr || !pubCat) {
    throw new Error("Failed to create pubCat for S7e: " + pubCatErr?.message)
  }

  const { error: s7eError } = await supabaseUser
    .from('cat_photos')
    .insert({
      cat_id: pubCat.id,
      path_card: `${pubCat.id}/81cbcd7b-c2e3-469b-9c71-33157a41a4a1-card.webp`,
      path_full: `${pubCat.id}/81cbcd7b-c2e3-469b-9c71-33157a41a4a1-full.webp`,
      sort_order: 0
    })
  
  await supabaseAdmin.from('cats').delete().eq('id', pubCat.id)

  if (!s7eError) {
    throw new Error("TEST S7e FAILED: Owner was able to insert a photo record into a published cat!")
  }
  console.log("TEST S7e SUCCESS: Photo modification on published cat blocked as expected.")

  console.log("TEST S7f: Owner trying to upload file to published cat folder in storage...")
  const { data: pubCat2, error: pubCat2Err } = await supabaseAdmin
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'חתול מפורסם ב',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'תיאור של חתול מפורסם באורך מתאים בהחלט ב',
      status: 'published',
      published_at: new Date().toISOString()
    })
    .select('id')
    .single()
  if (pubCat2Err || !pubCat2) {
    throw new Error("Failed to create pubCat2 for S7f: " + pubCat2Err?.message)
  }

  const { error: s7fError } = await supabaseUser.storage
    .from('cat-photos')
    .upload(`${pubCat2.id}/test-photo-card.webp`, Buffer.from('RIFF....WEBP'), {
      contentType: 'image/webp',
      upsert: true
    })

  await supabaseAdmin.from('cats').delete().eq('id', pubCat2.id)

  if (!s7fError) {
    throw new Error("TEST S7f FAILED: Owner was able to upload a file to a published cat's folder!")
  }
  console.log("TEST S7f SUCCESS: Storage upload to published cat's folder blocked as expected.")

  console.log("TEST S7g: get_handoff_contact RPC validation with null decided_by...")
  const { data: reqS7g, error: reqS7gErr } = await supabaseAdmin
    .from('adoption_requests')
    .insert({
      cat_id: publishedCatId,
      adopter_id: userId,
      message: 'הודעת בקשה תקינה באורך 20 תווים לפחות',
      status: 'approved',
      decided_by: null
    })
    .select('id')
    .single()
  
  if (reqS7gErr || !reqS7g) {
    throw new Error("Failed to insert reqS7g: " + reqS7gErr?.message)
  }

  const { data: handoffData, error: handoffError } = await supabaseUser
    .rpc('get_handoff_contact', { request_id: reqS7g.id })

  await supabaseAdmin.from('adoption_requests').delete().eq('id', reqS7g.id)

  if (handoffError) {
    throw new Error("TEST S7g FAILED (RPC error): " + handoffError.message)
  }
  if (handoffData && handoffData.length > 0) {
    throw new Error("TEST S7g FAILED: get_handoff_contact returned contact details for request with null decided_by!")
  }
  console.log("TEST S7g SUCCESS: RPC returned nothing for null decided_by as expected.")

  console.log("TEST S7h: DB trigger rejects pending requests on cat status transition...")
  const { data: trgCat, error: trgCatErr } = await supabaseAdmin
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'חתול מעבר',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'תיאור של חתול מעבר באורך מתאים בהחלט',
      status: 'published',
      published_at: new Date().toISOString()
    })
    .select('id')
    .single()
  
  if (trgCatErr || !trgCat) {
    throw new Error("Failed to insert trgCat: " + trgCatErr?.message)
  }

  const { data: trgReq, error: trgReqErr } = await supabaseAdmin
    .from('adoption_requests')
    .insert({
      cat_id: trgCat.id,
      adopter_id: thirdId,
      message: 'אני מאוד רוצה לאמץ את החתול מעבר הזה',
      status: 'pending'
    })
    .select('id')
    .single()
  
  if (trgReqErr || !trgReq) {
    await supabaseAdmin.from('cats').delete().eq('id', trgCat.id)
    throw new Error("Failed to insert trgReq: " + trgReqErr?.message)
  }

  const { error: trgUpdateErr } = await supabaseAdmin
    .from('cats')
    .update({ status: 'adopted' })
    .eq('id', trgCat.id)
  
  if (trgUpdateErr) {
    await supabaseAdmin.from('cats').delete().eq('id', trgCat.id)
    throw new Error("Failed to update trgCat status: " + trgUpdateErr.message)
  }

  const { data: updatedReq, error: updatedReqErr } = await supabaseAdmin
    .from('adoption_requests')
    .select('status, admin_note, decided_at')
    .eq('id', trgReq.id)
    .single()

  await supabaseAdmin.from('cats').delete().eq('id', trgCat.id)

  if (updatedReqErr) {
    throw new Error("Failed to query updatedReq: " + updatedReqErr.message)
  }
  if (updatedReq.status !== 'rejected') {
    throw new Error(`TEST S7h FAILED: Request status is ${updatedReq.status} (expected rejected)`)
  }
  if (updatedReq.admin_note !== 'המודעה כבר אינה זמינה') {
    throw new Error(`TEST S7h FAILED: Request admin_note is '${updatedReq.admin_note}' (expected 'המודעה כבר אינה זמינה')`)
  }
  if (!updatedReq.decided_at) {
    throw new Error("TEST S7h FAILED: Request decided_at is null")
  }
  console.log("TEST S7h SUCCESS: DB trigger auto-rejected pending request on status transition.")

  console.log("TEST S7i: Owner-session status transition with pending sibling is fail-closed...")
  // The S5 safety-net trigger rejects siblings via an UPDATE that guard_request_update
  // blocks for non-admin sessions — so an owner-session transition with a pending
  // sibling must fail AS A WHOLE (fail-closed), leaving both rows unchanged. App flows
  // are unaffected: closeSiblings (service role) clears pending requests BEFORE the
  // status update. This test pins that behavior.
  const { data: fcCat, error: fcCatErr } = await supabaseAdmin
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'חתול נעילה',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'תיאור של חתול נעילה באורך מתאים בהחלט',
      status: 'published',
      published_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (fcCatErr || !fcCat) {
    throw new Error("Failed to insert fcCat for S7i: " + fcCatErr?.message)
  }

  const { data: fcReq, error: fcReqErr } = await supabaseAdmin
    .from('adoption_requests')
    .insert({
      cat_id: fcCat.id,
      adopter_id: thirdId,
      message: 'בקשה לחתול הנעילה עם מספיק תווים',
      status: 'pending'
    })
    .select('id')
    .single()

  if (fcReqErr || !fcReq) {
    await supabaseAdmin.from('cats').delete().eq('id', fcCat.id)
    throw new Error("Failed to insert fcReq for S7i: " + fcReqErr?.message)
  }

  const { data: fcUpdated, error: fcUpdateErr } = await supabaseUser
    .from('cats')
    .update({ status: 'adopted', adopted_at: new Date().toISOString() })
    .eq('id', fcCat.id)
    .select()

  const { data: fcCatAfter } = await supabaseAdmin.from('cats').select('status').eq('id', fcCat.id).single()
  const { data: fcReqAfter } = await supabaseAdmin.from('adoption_requests').select('status').eq('id', fcReq.id).single()

  await supabaseAdmin.from('adoption_requests').delete().eq('id', fcReq.id)
  await supabaseAdmin.from('cats').delete().eq('id', fcCat.id)

  if (!fcUpdateErr && fcUpdated && fcUpdated.length > 0) {
    throw new Error("TEST S7i FAILED: Owner-session transition succeeded despite pending sibling — safety net is not fail-closed!")
  }
  if (fcCatAfter?.status !== 'published') {
    throw new Error(`TEST S7i FAILED: Cat status is ${fcCatAfter?.status} (expected still published)`)
  }
  if (fcReqAfter?.status !== 'pending') {
    throw new Error(`TEST S7i FAILED: Sibling request is ${fcReqAfter?.status} (expected still pending)`)
  }
  console.log("TEST S7i SUCCESS: Owner-session transition with pending sibling failed closed; state unchanged.")

  console.log("TEST S7j: Owner unpublish-for-media-edit transition...")
  const { data: pubCat3, error: pubCat3Err } = await supabaseAdmin
    .from('cats')
    .insert({
      owner_id: userId,
      name: 'חתול מפורסם ג',
      sex: 'male',
      birth_est: '2025-01-01',
      region: 'center',
      city: 'תל אביב',
      description: 'תיאור של חתול מפורסם באורך מתאים בהחלט ג',
      status: 'published',
      published_at: new Date().toISOString()
    })
    .select('id')
    .single()
  if (pubCat3Err || !pubCat3) {
    throw new Error("Failed to create pubCat3 for S7j: " + pubCat3Err?.message)
  }

  const { data: s7jFlip, error: s7jFlipErr } = await supabaseUser
    .from('cats')
    .update({ status: 'pending' })
    .eq('id', pubCat3.id)
    .eq('status', 'published')
    .select('status')

  if (s7jFlipErr || !s7jFlip || s7jFlip.length !== 1 || s7jFlip[0].status !== 'pending') {
    await supabaseAdmin.from('cats').delete().eq('id', pubCat3.id)
    throw new Error("TEST S7j FAILED: Owner could not flip own published cat to pending: " + (s7jFlipErr?.message ?? 'no row updated'))
  }

  const { error: s7jRepubErr } = await supabaseUser
    .from('cats')
    .update({ status: 'published' })
    .eq('id', pubCat3.id)

  const { error: s7jModErr } = await supabaseUser
    .from('cats')
    .update({ published_at: new Date().toISOString() })
    .eq('id', pubCat3.id)

  await supabaseAdmin.from('cats').delete().eq('id', pubCat3.id)

  if (!s7jRepubErr) {
    throw new Error("TEST S7j FAILED: Owner was able to set status back to published directly!")
  }
  if (!s7jModErr) {
    throw new Error("TEST S7j FAILED: Owner was able to change published_at (moderation-owned field)!")
  }
  console.log("TEST S7j SUCCESS: Owner published→pending allowed; direct re-publish and moderation-owned fields blocked.")

} catch (err) {
  // exiting here would skip the finally below (process.exit does not unwind);
  // flag the failure and exit only after cleanup has run.
  console.error("TEST RUN ENCOUNTERED ERROR:", err.message || err)
  failed = true
} finally {
  // ============ TEST 12: Clean Up & Invariant Verification ============
  console.log("TEST 12: Cleaning up and verifying invariant...")
  
  // Delete the requests, cat, and users to return database to its exact original state
  if (requestId) {
    await supabaseAdmin.from('adoption_requests').delete().eq('id', requestId)
  }
  if (draftCat && draftCat.id) {
    await supabaseAdmin.from('cats').delete().eq('id', draftCat.id)
  }
  if (thirdId) {
    await supabaseAdmin.auth.admin.deleteUser(thirdId).catch(() => {})
  }
  if (adopterId) {
    await supabaseAdmin.auth.admin.deleteUser(adopterId).catch(() => {})
  }

  // Clean up user using service role client
  if (userId) {
    console.log("Cleaning up original test user...")
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error("Cleanup failed:", deleteError.message)
    } else {
      console.log("Cleanup succeeded.")
    }
  }

  // Verify 12 published cats invariant
  const { data: postCats, error: postCatsError } = await supabaseAnon.from('cats').select('*').eq('status', 'published')
  if (postCatsError) {
    console.error("Failed to query cats post-cleanup:", postCatsError.message)
    originalExit(1)
  }
  if (postCats.length !== 12) {
    console.error(`TEST 12 FAILED: Invariant violated! Found ${postCats.length} published cats post-cleanup (expected 12).`)
    originalExit(1)
  }
  console.log("TEST 12 SUCCESS: Invariant verified: exactly 12 published cats remain in database.")
  if (failed) {
    console.error("--- RLS SMOKE TEST FAILED — see error above (cleanup ran) ---")
    originalExit(1)
  }
  console.log("--- RLS SMOKE TEST COMPLETED ---")
}
}

run()
