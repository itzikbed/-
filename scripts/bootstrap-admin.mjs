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
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables in .env.local!")
  process.exit(1)
}

// Refuse to run unless NEXT_PUBLIC_SUPABASE_URL is a localhost/127.* URL
const urlObj = new URL(supabaseUrl)
if (urlObj.hostname !== 'localhost' && urlObj.hostname !== '127.0.0.1') {
  console.error("Refusing to run bootstrap-admin: Target URL must be localhost/127.0.0.1 to prevent accidental production overwrite.")
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function run() {
  console.log('--- BOOTSTRAPPING ADMIN ACCOUNT ---')
  
  const email = 'arch-review-admin@example.com'
  const password = 'Review!2026'
  const fullName = 'אדמין סוקר'
  const phone = '050-9999999'

  // Clean up user if exists
  console.log(`Checking if user ${email} already exists...`)
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) throw listError

  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    console.log(`Deleting existing admin user: ${email} (${existingUser.id})`)
    await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
  }

  // Create admin user
  console.log(`Creating admin user: ${email}...`)
  const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone
    }
  })

  if (createError) {
    console.error("Failed to create admin user:", createError.message)
    process.exit(1)
  }

  console.log(`Admin user created with ID: ${user.id}`)

  // Wait with a resilient retry loop for trigger to create profile row
  console.log('Updating profile role to admin (with verification retry loop)...')
  let retries = 10
  let updated = false
  while (retries > 0) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select()

      if (!updateError && updateData && updateData.length === 1 && updateData[0].role === 'admin') {
        updated = true
        console.log(`Success: role updated to admin and verified for profile ${user.id}`)
        break
      }
    }

    console.log(`Profile row not ready or update failed. Retrying in 500ms... (${retries} retries left)`)
    await new Promise(r => setTimeout(r, 500))
    retries--
  }

  if (!updated) {
    console.error("BOOTSTRAP ERROR: Failed to update role. Exact 1 profile row verification failed.")
    process.exit(1)
  }

  console.log('--- ADMIN BOOTSTRAP COMPLETED SUCCESSFULLY ---')
}

run().catch(err => {
  console.error('BOOTSTRAP FAILED:', err.message)
  process.exit(1)
})
