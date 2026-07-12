import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import crypto from 'crypto'
import { pexelsImageUrls, catsData } from './seed-cats-data.mjs'

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

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Image URLs and Cat Data are imported from seed-cats-data.mjs

async function downloadAndProcessImage(url, catId) {
  console.log(`Downloading image: ${url}`)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  })
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`)
  
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  console.log('Generating variants using sharp...')
  // Card variant: max edge 480px, WebP, quality 78
  const cardBuffer = await sharp(buffer)
    .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer()
    
  // Full variant: max edge 1600px, WebP, quality 82
  const fullBuffer = await sharp(buffer)
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
    
  const photoUuid = crypto.randomUUID()
  const pathCard = `${catId}/${photoUuid}-card.webp`
  const pathFull = `${catId}/${photoUuid}-full.webp`
  
  console.log(`Uploading card to storage: ${pathCard}`)
  const { error: cardUploadError } = await supabaseAdmin.storage
    .from('cat-photos')
    .upload(pathCard, cardBuffer, {
      contentType: 'image/webp',
      upsert: false
    })
  if (cardUploadError) throw cardUploadError
  
  console.log(`Uploading full to storage: ${pathFull}`)
  const { error: fullUploadError } = await supabaseAdmin.storage
    .from('cat-photos')
    .upload(pathFull, fullBuffer, {
      contentType: 'image/webp',
      upsert: false
    })
  if (fullUploadError) throw fullUploadError
  
  return { pathCard, pathFull }
}

async function run() {
  console.log('--- STARTING DYNAMIC DATA SEED ---')
  
  // 1. CLEAN UP existing users
  console.log('Cleaning up existing seed users...')
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) throw listError
  
  const targetEmails = ['admin@example.com', 'publisher1@example.com', 'publisher2@example.com']
  for (const user of users) {
    if (targetEmails.includes(user.email)) {
      console.log(`Deleting existing user: ${user.email} (${user.id})`)
      await supabaseAdmin.auth.admin.deleteUser(user.id)
    }
  }
  
  // 2. CREATE users via Admin API
  console.log('Creating users...')
  const credentials = {
    admin: { email: 'admin@example.com', password: 'password123', full_name: 'אדמין המערכת', phone: '050-0000000' },
    pub1: { email: 'publisher1@example.com', password: 'password123', full_name: 'משה כהן', phone: '052-1234567' },
    pub2: { email: 'publisher2@example.com', password: 'password123', full_name: 'עמותת גרגורים', phone: '054-7654321' }
  }
  
  const createdUsers = {}
  for (const [key, cred] of Object.entries(credentials)) {
    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cred.email,
      password: cred.password,
      email_confirm: true,
      user_metadata: {
        full_name: cred.full_name,
        phone: cred.phone
      }
    })
    if (createError) throw createError
    console.log(`Created user ${cred.email} with ID: ${user.id}`)
    createdUsers[key] = user.id
  }
  
  // 3. UPDATE user roles and publisher statuses in profiles
  // Note: the auth.users insert trigger will have created these rows automatically.
  // We wait 1 second to ensure the trigger runs and transactions commit.
  await new Promise(r => setTimeout(r, 1000))
  
  console.log('Updating profiles in database...')
  const { error: adminUpdateErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', createdUsers.admin)
  if (adminUpdateErr) throw adminUpdateErr
  
  const { error: pub1UpdateErr } = await supabaseAdmin
    .from('profiles')
    .update({
      publisher_status: 'approved',
      publisher_type: 'private',
      city: 'תל אביב',
      region: 'center'
    })
    .eq('id', createdUsers.pub1)
  if (pub1UpdateErr) throw pub1UpdateErr
  
  const { error: pub2UpdateErr } = await supabaseAdmin
    .from('profiles')
    .update({
      publisher_status: 'approved',
      publisher_type: 'organization',
      city: 'באר שבע',
      region: 'south'
    })
    .eq('id', createdUsers.pub2)
  if (pub2UpdateErr) throw pub2UpdateErr
  
  console.log('Profiles updated successfully.')
  
  // 4. CLEAN STORAGE bucket of any existing files (to prevent orphans)
  console.log('Cleaning storage bucket cat-photos...')
  const { data: storageFiles, error: storageErr } = await supabaseAdmin.storage
    .from('cat-photos')
    .list('', { limit: 100 })
  if (!storageErr && storageFiles) {
    for (const folder of storageFiles) {
      if (folder.name) {
        // List folder contents
        const { data: subFiles } = await supabaseAdmin.storage
          .from('cat-photos')
          .list(folder.name)
        if (subFiles && subFiles.length > 0) {
          const toDelete = subFiles.map(f => `${folder.name}/${f.name}`)
          await supabaseAdmin.storage.from('cat-photos').remove(toDelete)
        }
      }
    }
  }
  
  // 5. INSERT 15 seed cats
  console.log('Seeding cats...')

  console.log(`Inserting ${catsData.length} cats into the database...`)
  for (let i = 0; i < catsData.length; i++) {
    const cat = catsData[i]
    const ownerId = createdUsers[cat.owner_key]
    
    // Remove owner_key and insert
    const catInsertData = { ...cat }
    delete catInsertData.owner_key
    catInsertData.owner_id = ownerId
    
    // Add published_at date if published
    if (catInsertData.status === 'published') {
      catInsertData.published_at = new Date().toISOString()
    }
    
    const { data: insertedCat, error: insertErr } = await supabaseAdmin
      .from('cats')
      .insert(catInsertData)
      .select()
      .single()
      
    if (insertErr) throw insertErr
    console.log(`Inserted cat: ${cat.name} (${insertedCat.id})`)
    
    // Download, process and upload photo
    const pexelsUrl = pexelsImageUrls[i]
    try {
      const { pathCard, pathFull } = await downloadAndProcessImage(pexelsUrl, insertedCat.id)
      
      const { error: photoErr } = await supabaseAdmin
        .from('cat_photos')
        .insert({
          cat_id: insertedCat.id,
          path_card: pathCard,
          path_full: pathFull,
          sort_order: 0 // cover photo
        })
      if (photoErr) throw photoErr
      console.log(`Uploaded and registered photo for ${cat.name}`)
    } catch (photoUploadErr) {
      console.error(`Error processing photo for ${cat.name}:`, photoUploadErr.message)
    }
  }
  
  console.log('--- DYNAMIC DATA SEED COMPLETED ---')
}

run().catch(err => {
  console.error('SEED SCRIPT FAILED:', err.message)
  process.exit(1)
})
