import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ffmpegPath = ffmpegInstaller.path
console.log('FFmpeg binary found at:', ffmpegPath)

const tempInput = path.join(__dirname, '../public/hero/temp_input.mp4')
const outputMp4 = path.join(__dirname, '../public/hero/hero_cat.mp4')
const outputWebm = path.join(__dirname, '../public/hero/hero_cat.webm')
const outputPoster = path.join(__dirname, '../public/hero/hero_poster.jpg')

// ensure dir exists
fs.mkdirSync(path.dirname(tempInput), { recursive: true })

async function download(url, dest) {
  console.log(`Downloading ${url}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`)
  const buffer = await res.arrayBuffer()
  fs.writeFileSync(dest, Buffer.from(buffer))
  console.log(`Downloaded to ${dest}`)
}

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

async function main() {
  const url = 'https://assets.mixkit.co/videos/1538/1538-720.mp4'
  await download(url, tempInput)

  console.log('Transcoding to MP4 (1280px, 8s, no audio)...')
  // -t 8: limit duration to 8s
  // -vf "scale=1280:-2": scale width to 1280, keep aspect ratio (height even number)
  // -an: remove audio
  // -c:v libx264: H.264 video codec
  // -crf 23: standard quality
  await runFFmpeg([
    '-y',
    '-i', tempInput,
    '-t', '8',
    '-vf', 'scale=1280:-2',
    '-an',
    '-c:v', 'libx264',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    outputMp4
  ])

  console.log('Transcoding to WebM (1280px, 8s, no audio)...')
  await runFFmpeg([
    '-y',
    '-i', tempInput,
    '-t', '8',
    '-vf', 'scale=1280:-2',
    '-an',
    '-c:v', 'libvpx-vp9',
    '-b:v', '800k',
    '-pix_fmt', 'yuv420p',
    outputWebm
  ])

  console.log('Extracting poster frame (from 2s mark)...')
  await runFFmpeg([
    '-y',
    '-i', tempInput,
    '-ss', '2',
    '-vframes', '1',
    '-vf', 'scale=1280:-2',
    outputPoster
  ])

  // Clean up temp file
  if (fs.existsSync(tempInput)) {
    fs.unlinkSync(tempInput)
  }

  console.log('Transcoding completed successfully!')
  const sizeMp4 = (fs.statSync(outputMp4).size / (1024 * 1024)).toFixed(2)
  const sizeWebm = (fs.statSync(outputWebm).size / (1024 * 1024)).toFixed(2)
  const sizePoster = (fs.statSync(outputPoster).size / 1024).toFixed(2)
  console.log(`MP4 size: ${sizeMp4} MB`)
  console.log(`WebM size: ${sizeWebm} MB`)
  console.log(`Poster size: ${sizePoster} KB`)
}

main().catch(console.error)
