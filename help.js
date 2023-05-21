const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const { google } = require("googleapis");
const Queue = require("bull");
const ffmpegPath = require("ffmpeg-static").path;
const { spawn } = require("child_process");

const app = express();
const upload = multer({ dest: "uploads/" });
const port = 3000; // Choose an appropriate port

// Set up Redis connection
const videoQueue = new Queue("videoQueue", {
  redis: {
    host: "localhost", // Replace with your Redis host
    port: 6379, // Replace with your Redis port
  },
});

// Process the video queue
videoQueue.process(async (job, done) => {
  console.log(job);
  const { videoPath } = job.data;

  try {
    const newVideoPath = await removeNoiseFromVideo(videoPath);
    done(null, newVideoPath);
  } catch (error) {
    done(error);
  }
});

app.use(express.static("public"));

app.post("/process-video", upload.single("video"), async (req, res) => {
  const { videoUrl } = req.body;

  try {
    // Download the file from the Google Drive link
    const fileData = await downloadFileFromDrive(videoUrl);
    console.log(fileData);
    // Save the file to the server
    const videoFilePath = `public/videos/${Date.now()}.mp4`;
    fs.writeFileSync(videoFilePath, fileData);

    // Enqueue the video processing task
    const job = await videoQueue.add({ videoPath: videoFilePath });

    res.json({ jobId: job.id });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during processing." });
  }
});

app.get("/download/:filename", (req, res) => {
  const { filename } = req.params;

  res.setHeader("Content-disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-type", "video/mp4");

  const fileStream = fs.createReadStream(`output/${filename}`);
  fileStream.pipe(res);
});

app.get("/job/:jobId", async (req, res) => {
  const { jobId } = req.params;

  const job = await videoQueue.getJob(jobId);
  if (!job) {
    res.json({ status: "Job not found" });
    return;
  }
  console.log(job.status);
  res.json({ status: job.status });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
