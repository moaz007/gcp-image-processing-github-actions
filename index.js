const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const express = require('express'); // For health check listener

const storage = new Storage();

// Initialize cold start tracker
let isColdStart = true; // Declare globally

// Main function to process images
exports["image-resizer"] = async (event) => {
  const startTime = Date.now(); // Start timing execution

  try {
    // Detect and log cold start
    console.log(`Cold start: ${isColdStart}`);
    isColdStart = false;

    // Log event details for debugging
    console.log("Event received:", JSON.stringify(event, null, 2));

    // Extract bucket name and file name
    const bucketName = event.bucket;
    const fileName = event.name;

    if (!bucketName || !fileName) {
      throw new Error("Bucket or file name is missing from the event.");
    }

    console.log(`New file detected: gs://${bucketName}/${fileName}`);

    // Define paths and names
    const tempFilePath = `/tmp/${fileName}`;
    const processedFileName = `processed-${fileName}`;

    // Download the file
    await storage.bucket(bucketName).file(fileName).download({ destination: tempFilePath });
    console.log(`File downloaded to ${tempFilePath}`);

    // Resize the image
    const resizedBuffer = await sharp(tempFilePath)
      .resize(300, 300, { fit: 'cover', position: 'center' }) // Ensure consistent resizing
      .toBuffer();

    // Upload resized image
    const processedBucketName = process.env.PROCESSED_BUCKET;
    if (!processedBucketName) {
      throw new Error("Processed bucket name is not defined in the environment variables.");
    }
    await storage.bucket(processedBucketName).file(processedFileName).save(resizedBuffer);
    console.log(`Processing successful: Processed image saved as ${processedFileName} in gs://${processedBucketName}/`);

    // Calculate and log execution time
    const executionTime = (Date.now() - startTime) / 1000;
    console.log(`Execution time: ${executionTime.toFixed(3)}s`);
  } catch (err) {
    console.error("Error processing image:", err);
  }
};

// Listener for Cloud Run health checks (optional, for troubleshooting deployment issues)
if (require.main === module) {
  const app = express();

  app.get('/health', (req, res) => res.status(200).send('Healthy'));
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Trigger CI/CD
//hello world
