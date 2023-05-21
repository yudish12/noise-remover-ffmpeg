import fs from "fs";
import axios from "axios";

export const downloadVideo = async (url, filePath) => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");
    fs.writeFileSync(filePath, buffer);
    console.log("Video downloaded successfully!");
  } catch (error) {
    console.error("Error downloading video:", error);
  }
};
