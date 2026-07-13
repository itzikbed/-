import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import crypto from 'crypto'
import { execFile } from 'child_process'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ffmpegPath = ffmpegInstaller.path

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log(`Running FFmpeg: ${ffmpegPath} ${args.join(' ')}`)
    execFile(ffmpegPath, args, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr)
        return reject(err)
      }
      resolve()
    })
  })
}

export async function downloadAndProcessImage(supabaseAdmin, url, catId) {
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
  const cardBuffer = await sharp(buffer)
    .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer()
    
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

export async function downloadAndProcessVideo(supabaseAdmin, url, catId) {
  const photoUuid = crypto.randomUUID()
  const tempInput = path.join(__dirname, `../public/hero/temp_cat_video_${photoUuid}.mp4`)
  const localWebm = path.join(__dirname, `../public/hero/temp_cat_video_${photoUuid}.webm`)
  const localMp4 = path.join(__dirname, `../public/hero/temp_cat_video_${photoUuid}_out.mp4`)
  
  console.log(`Downloading video: ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download video ${url}: ${res.statusText}`)
  const arrayBuffer = await res.arrayBuffer()
  fs.writeFileSync(tempInput, Buffer.from(arrayBuffer))
  
  try {
    console.log(`Transcoding video for cat ${catId} (480px, 3s, no audio)...`)
    
    // WebM: 480px, 3s, no audio
    await runFFmpeg([
      '-y',
      '-i', tempInput,
      '-t', '3',
      '-vf', 'scale=480:-2',
      '-an',
      '-c:v', 'libvpx-vp9',
      '-crf', '32',
      '-b:v', '250k',
      '-pix_fmt', 'yuv420p',
      localWebm
    ])
    
    // MP4: 480px, 3s, no audio
    await runFFmpeg([
      '-y',
      '-i', tempInput,
      '-t', '3',
      '-vf', 'scale=480:-2',
      '-an',
      '-c:v', 'libx264',
      '-crf', '28',
      '-pix_fmt', 'yuv420p',
      localMp4
    ])
    
    const pathBase = `${catId}/${photoUuid}-clip`
    const pathWebm = `${pathBase}.webm`
    const pathMp4 = `${pathBase}.mp4`
    
    console.log(`Uploading WebM clip to storage: ${pathWebm}`)
    const webmBuffer = fs.readFileSync(localWebm)
    const { error: webmUploadError } = await supabaseAdmin.storage
      .from('cat-photos')
      .upload(pathWebm, webmBuffer, {
        contentType: 'video/webm',
        upsert: false
      })
    if (webmUploadError) throw webmUploadError
    
    console.log(`Uploading MP4 clip to storage: ${pathMp4}`)
    const mp4Buffer = fs.readFileSync(localMp4)
    const { error: mp4UploadError } = await supabaseAdmin.storage
      .from('cat-photos')
      .upload(pathMp4, mp4Buffer, {
        contentType: 'video/mp4',
        upsert: false
      })
    if (mp4UploadError) throw mp4UploadError
    
    return pathBase
  } finally {
    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput)
    if (fs.existsSync(localWebm)) fs.unlinkSync(localWebm)
    if (fs.existsSync(localMp4)) fs.unlinkSync(localMp4)
  }
}
