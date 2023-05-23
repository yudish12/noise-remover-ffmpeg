import express from "express";
import path from "path";
import multer from "multer";
import Queue from "bull";

import { removeNoiseFromVideo } from "./utils/removeNoise.js";

const app = express();

//seeting template engine pug
app.set("view engine", "pug");
const __dirname = path.resolve();
app.set("views", path.join(__dirname, "views"));

//setting up public folder
app.use(express.static(path.join(__dirname, "public")));

//parsing json and form data
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

//csp
// app.use((req, res, next) => {
//   res.setHeader(
//     "Content-Security-Policy",
//     "default-src 'self' https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com"
//   );
//   next();
// });

//multer to upload files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/videos");
  },
  filename: function (req, file, cb) {
    const date = Date.now();
    req.file = `${date + path.extname(file.originalname)}`;
    cb(null, date + path.extname(file.originalname)); //Appending extension
  },
});

const upload = multer({ storage: storage });

// Set up Redis connection
const videoQueue = new Queue("videoQueue", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});

videoQueue.process(async (job, done) => {
  const { videoPath } = job.data;
  console.log("asd");
  try {
    const newVideoPath = await removeNoiseFromVideo(videoPath);
    videoQueue.getJobCounts().then((res) => console.log("Job Count:\n", res));
    console.log("asdasd");
    done(null, newVideoPath);
  } catch (error) {
    done(error);
  }
});

videoQueue.on("completed", (job, result) => {
  console.log(`Job completed with result ${result}`);
});

//view routes
app.get("/", (req, res) => {
  res.render("upload");
});

//add in queue
app.post("/process-video", upload.any(), async (req, res) => {
  const videoFilePath = `public/videos/${req.file}`;
  try {
    // Enqueue the video processing task
    const job = await videoQueue.add({ videoPath: videoFilePath });
    console.log("213");
    res.json({ jobId: job.id, fileName: videoFilePath.split("/")[2] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during processing." });
  }
});

app.get("/status", (req, res) => {
  console.log("asdafwe");
  res.render("status");
});

app.get("/download", (req, res) => {
  res.render("download");
});

app.get("/job/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await videoQueue.getJob(jobId);
    const isJobActive = await job.isActive();
    const isJobCompleted = await job.isCompleted();
    if ({ completed: isJobCompleted, active: isJobActive }) {
    }
    res.json({ isJobCompleted, isJobActive });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during processing." });
  }
});

app.get("/Download/video/:filename", (req, res) => {
  const { filename } = req.params;
  console.log(filename);
  const __dirname = path.resolve();
  res.download(`./public/output/${filename}`);
});

// app.all("*", (req, res) => {
//   console.log("wrong route");
// });

app.listen(5000, () => {
  console.log("server started");
});
