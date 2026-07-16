import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local')
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found at', envPath)
  process.exit(1)
}

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
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

// Localhost guard for safety
if (new URL(supabaseUrl).hostname !== '127.0.0.1' && new URL(supabaseUrl).hostname !== 'localhost') {
  console.warn('WARNING: Running maintenance scripts against a non-local database is blocked by default.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function runCleanup() {
  console.log('--- STARTING STORAGE ORPHAN CLEANUP ---')

  // 1. Fetch all active photo paths
  const { data: photos, error: photosErr } = await supabase
    .from('cat_photos')
    .select('path_card, path_full')
  if (photosErr) {
    console.error('Failed to fetch active photo paths:', photosErr.message)
    process.exit(1)
  }

  // 2. Fetch all active video paths
  const { data: cats, error: catsErr } = await supabase
    .from('cats')
    .select('id, video_path')
  if (catsErr) {
    console.error('Failed to fetch active cat/video paths:', catsErr.message)
    process.exit(1)
  }

  // 3. Build sets of active database references
  const activePaths = new Set()
  const activeCatIds = new Set()

  cats.forEach(c => activeCatIds.add(c.id))
  
  photos.forEach(p => {
    if (p.path_card) activePaths.add(p.path_card)
    if (p.path_full) activePaths.add(p.path_full)
  })

  cats.forEach(c => {
    if (c.video_path) activePaths.add(c.video_path)
  })

  console.log(`Found ${activeCatIds.size} active cats in DB.`)
  console.log(`Found ${activePaths.size} active media references in DB.`)

  // 4. List all root folders in cat-photos storage bucket
  const { data: folders, error: foldersErr } = await supabase.storage
    .from('cat-photos')
    .list()

  if (foldersErr) {
    console.error('Failed to list storage bucket root folders:', foldersErr.message)
    process.exit(1)
  }

  let deletedFilesCount = 0
  let orphanedFoldersCount = 0

  for (const folder of folders) {
    // folders returned by list() usually have metadata null or represents directories
    const folderName = folder.name
    
    // Skip system placeholder files or files at root level if any
    if (folderName === '.placeholder' || !folderName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      continue
    }

    const catId = folderName
    const { data: files, error: filesErr } = await supabase.storage
      .from('cat-photos')
      .list(catId, { limit: 100 })

    if (filesErr) {
      console.error(`Failed to list files in folder ${catId}:`, filesErr.message)
      continue
    }

    if (!files || files.length === 0) {
      continue
    }

    // Check if the cat exists in database
    const isCatActive = activeCatIds.has(catId)

    if (!isCatActive) {
      // Entire folder is orphaned!
      console.log(`Orphaned cat folder detected: ${catId}. Deleting ${files.length} files...`)
      const filePaths = files.map(f => `${catId}/${f.name}`)
      const { error: deleteErr } = await supabase.storage
        .from('cat-photos')
        .remove(filePaths)
      
      if (deleteErr) {
        console.error(`Failed to delete orphaned folder files:`, deleteErr.message)
      } else {
        deletedFilesCount += filePaths.length
        orphanedFoldersCount++
      }
    } else {
      // Cat is active, check file-level orphans inside this folder
      const filesToDelete = []
      for (const file of files) {
        const filePath = `${catId}/${file.name}`
        if (!activePaths.has(filePath)) {
          console.log(`Orphaned media file detected: ${filePath}`)
          filesToDelete.push(filePath)
        }
      }

      if (filesToDelete.length > 0) {
        console.log(`Deleting ${filesToDelete.length} orphaned files inside active cat folder ${catId}...`)
        const { error: deleteErr } = await supabase.storage
          .from('cat-photos')
          .remove(filesToDelete)
        
        if (deleteErr) {
          console.error(`Failed to delete orphaned files:`, deleteErr.message)
        } else {
          deletedFilesCount += filesToDelete.length
        }
      }
    }
  }

  console.log('--- STORAGE ORPHAN CLEANUP COMPLETED ---')
  console.log(`Deleted ${deletedFilesCount} orphaned files across ${orphanedFoldersCount} orphaned folders.`);
}

runCleanup()
