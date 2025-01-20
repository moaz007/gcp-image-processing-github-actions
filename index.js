const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const express = require('express');

const storage = new Storage();
const app = express();

// Health check endpoint for Cloud Run
app.get('/', (req, res) => {
  res.send('Service is running');
});

// Start Express server to handle Cloud Run health check
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Main function to process images
exports['image-resizer'] = async (event) => {
  try {
    console.log("Event received:", JSON.stringify(event));

    const bucketName = event.bucket;
    const fileName = event.name;

    if (!bucketName || !fileName) {
      throw new Error("Bucket or file name is missing.");
    }

    const tempFilePath = `/tmp/${fileName}`;
    const processedFileName = `processed-${fileName}`;

    // Download, resize, and upload the image
    await storage.bucket(bucketName).file(fileName).download({ destination: tempFilePath });
    const resizedBuffer = await sharp(tempFilePath).resize(300, 300).toBuffer();
    const processedBucketName = process.env.PROCESSED_BUCKET;

    await storage.bucket(processedBucketName).file(processedFileName).save(resizedBuffer);

    console.log(`Processed image saved as ${processedFileName} in bucket ${processedBucketName}`);
  } catch (err) {
    console.error("Error processing image:", err);
  }
};

