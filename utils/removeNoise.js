import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegStatic);

import { promisify } from "util";
import { unlink } from "fs";
const unlinkAsync = promisify(unlink);

export const removeNoiseFromVideo = (videoPath) => {
  const outputPath = videoPath.split("/")[2];
  return new Promise((resolve, reject) => {
    // Run FFmpeg
    ffmpeg()
      // Input file
      .input(videoPath)
      .audioCodec("libmp3lame")

      // Audio bit rate
      .audioQuality(0)
      .saveToFile(`public/output/${outputPath}`)

      // Log the percentage of work completed
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${Math.floor(progress.percent)}% done`);
        }
      })

      // The callback that is run when FFmpeg is finished
      .on("end", async () => {
        console.log("FFmpeg has finished.");
        try {
          // Clean up the original video file
          await unlinkAsync(videoPath);
          resolve();
        } catch (error) {
          reject(error);
        }
      })

      // The callback that is run when FFmpeg encounters an error
      .on("error", (error) => {
        console.error(error);
        reject(error);
      });
  });
};
