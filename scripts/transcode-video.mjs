import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ffmpegPath = ffmpegInstaller.path
console.log('FFmpeg binary found at:', ffmpegPath)

// ensure dir exists
const heroDir = path.join(__dirname, '../public/hero')
fs.mkdirSync(heroDir, { recursive: true })

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

async function transcodeClip(index, url) {
  const tempInput = path.join(heroDir, `temp_input_${index}.mp4`)
  const outputMp4 = path.join(heroDir, `hero_${index}.mp4`)
  const outputWebm = path.join(heroDir, `hero_${index}.webm`)
  const outputPoster = path.join(heroDir, `hero_${index}_poster.jpg`)

  await download(url, tempInput)

  console.log(`[Clip ${index}] Transcoding to MP4 (960px, 8s, no audio)...`)
  await runFFmpeg([
    '-y',
    '-i', tempInput,
    '-t', '8',
    '-vf', 'scale=960:-2',
    '-an',
    '-c:v', 'libx264',
    '-crf', '26',
    '-pix_fmt', 'yuv420p',
    outputMp4
  ])

  console.log(`[Clip ${index}] Transcoding to WebM (960px, 8s, no audio)...`)
  await runFFmpeg([
    '-y',
    '-i', tempInput,
    '-t', '8',
    '-vf', 'scale=960:-2',
    '-an',
    '-c:v', 'libvpx-vp9',
    '-crf', '34',
    '-b:v', '400k',
    '-pix_fmt', 'yuv420p',
    outputWebm
  ])

  console.log(`[Clip ${index}] Extracting poster frame...`)
  await runFFmpeg([
    '-y',
    '-i', tempInput,
    '-ss', '2',
    '-vframes', '1',
    '-vf', 'scale=960:-2',
    outputPoster
  ])

  if (fs.existsSync(tempInput)) {
    fs.unlinkSync(tempInput)
  }

  const sizeMp4 = (fs.statSync(outputMp4).size / (1024 * 1024)).toFixed(2)
  const sizeWebm = (fs.statSync(outputWebm).size / (1024 * 1024)).toFixed(2)
  const sizePoster = (fs.statSync(outputPoster).size / 1024).toFixed(2)
  console.log(`Clip ${index} results: MP4=${sizeMp4}MB, WebM=${sizeWebm}MB, Poster=${sizePoster}KB`)
}

async function main() {
  const sources = [
    'https://assets.mixkit.co/videos/1538/1538-720.mp4', // slow motion blinking cat
    'https://assets.mixkit.co/videos/1537/1537-720.mp4', // slow motion playing cat
    'https://assets.mixkit.co/videos/1540/1540-720.mp4'  // cute ginger cat stretching
  ]

  for (let i = 0; i < sources.length; i++) {
    await transcodeClip(i + 1, sources[i])
  }
  console.log('All hero clips transcoded successfully!')
}

main().catch(console.error)
