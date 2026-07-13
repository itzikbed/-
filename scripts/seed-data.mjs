import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { pexelsImageUrls, catsData } from './seed-cats-data.mjs'
import { downloadAndProcessImage, downloadAndProcessVideo } from './process-media.mjs'

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
  
  await new Promise(r => setTimeout(r, 1000))
  
  console.log('Updating profiles in database...')
  await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', createdUsers.admin)
  await supabaseAdmin.from('profiles').update({
    publisher_status: 'approved',
    publisher_type: 'private',
    city: 'תל אביב',
    region: 'center'
  }).eq('id', createdUsers.pub1)
  await supabaseAdmin.from('profiles').update({
    publisher_status: 'approved',
    publisher_type: 'organization',
    city: 'באר שבע',
    region: 'south'
  }).eq('id', createdUsers.pub2)
  
  console.log('Profiles updated successfully.')
  
  console.log('Cleaning storage bucket cat-photos...')
  const { data: storageFiles, error: storageErr } = await supabaseAdmin.storage
    .from('cat-photos')
    .list('', { limit: 100 })
  if (!storageErr && storageFiles) {
    for (const folder of storageFiles) {
      if (folder.name) {
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
  
  console.log('Seeding cats...')
  for (let i = 0; i < catsData.length; i++) {
    const cat = catsData[i]
    const ownerId = createdUsers[cat.owner_key]
    
    const catInsertData = { ...cat }
    delete catInsertData.owner_key
    delete catInsertData.video_url
    catInsertData.owner_id = ownerId
    
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
    
    const pexelsUrl = pexelsImageUrls[i]
    try {
      const { pathCard, pathFull } = await downloadAndProcessImage(supabaseAdmin, pexelsUrl, insertedCat.id)
      await supabaseAdmin.from('cat_photos').insert({
        cat_id: insertedCat.id,
        path_card: pathCard,
        path_full: pathFull,
        sort_order: 0
      })
      console.log(`Uploaded and registered photo for ${cat.name}`)
    } catch (photoUploadErr) {
      console.error(`Error processing photo for ${cat.name}:`, photoUploadErr.message)
    }

    if (cat.video_url) {
      try {
        const videoPath = await downloadAndProcessVideo(supabaseAdmin, cat.video_url, insertedCat.id)
        const { error: updateErr } = await supabaseAdmin
          .from('cats')
          .update({ video_path: videoPath })
          .eq('id', insertedCat.id)
        if (updateErr) throw updateErr
        console.log(`Uploaded and registered video clip for ${cat.name}`)
      } catch (videoErr) {
        console.error(`Error processing video for ${cat.name}:`, videoErr.message)
      }
    }
  }
  
  console.log('--- DYNAMIC DATA SEED COMPLETED ---')
}

run().catch(err => {
  console.error('SEED SCRIPT FAILED:', err.message)
  process.exit(1)
})
