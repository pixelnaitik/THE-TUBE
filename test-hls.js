const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const videoId = 'cmmjexgdr0002zpojjvz2l2e2';
const rawFilePath = path.join('public', 'videos', videoId, 'video.mp4');
const outputDir = path.join('public', 'videos', videoId, '1080p');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Starting ffmpeg...');

const cmd = ffmpeg(rawFilePath)
  .outputOptions([
    '-vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
    '-b:v 5000k',
    '-maxrate 5000k',
    '-bufsize 10000k',
    '-b:a 192k',
    '-profile:v main',
    '-level 4.0',
    '-start_number 0',
    '-hls_time 6',
    '-hls_list_size 0',
    '-hls_segment_filename',
    path.join(outputDir, 'segment_%03d.ts').replace(/\\/g, '/'),
    '-f hls'
  ])
  .output(path.join(outputDir, '1080p.m3u8').replace(/\\/g, '/'))
  .on('start', (commandLine) => {
    console.log('Spawned Ffmpeg with command: ' + commandLine);
  })
  .on('stderr', function(stderrLine) {
    console.log('Stderr output: ' + stderrLine);
  })
  .on('end', () => console.log('Finished correctly'))
  .on('error', (err) => console.log('Error occurred:', err.message));

cmd.run();
