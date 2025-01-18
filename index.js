const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const storage = new Storage();

// Initialize cold start tracker
let isColdStart = true;

exports.imageResizer = async (event) => {
  const startTime = Date.now(); // Start timing execution

  try {
    // Detect and log cold start
    const coldStartStatus = isColdStart;
    console.log(`Cold start: ${coldStartStatus}`);
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
    const resizedBuffer = await sharp(tempFilePath).resize(300, 300).toBuffer();

    // Upload resized image
    const processedBucketName = process.env.PROCESSED_BUCKET;
    await storage.bucket(processedBucketName).file(processedFileName).save(resizedBuffer);
    console.log(`Processing successful: Processed image saved as ${processedFileName} in gs://${processedBucketName}/`);

    // Calculate and log execution time
    const executionTime = (Date.now() - startTime) / 1000;
    console.log(`Execution time: ${executionTime.toFixed(3)}s`);
  } catch (err) {
    console.error("Error processing image:", err);
  }
};

// Triggering GitHub Actions workflow
