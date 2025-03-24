const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');

const storage = new Storage();
let isColdStart = true; // Flag to check if this is the first run

// HTTP-triggered function for image uploads.
exports.uploadImage = async (req, res) => {
  const startTime = Date.now();
  const coldStart = isColdStart;
  isColdStart = false; // No longer a cold start after the first call

  try {
    // Expecting an object with 'image' (base64) and 'fileName'.
    const { image, fileName } = req.body;
    if (!image || !fileName) {
      throw new Error("Missing 'image' or 'fileName'");
    }

    // Convert the base64 string to a buffer.
    const buffer = Buffer.from(image, "base64");

    // Get the bucket name from the environment or use default.
    const bucketName = process.env.UPLOAD_BUCKET || "upload-bucket-experiment";
    const file = storage.bucket(bucketName).file(fileName);

    // Save the image file to our bucket.
    await file.save(buffer, { contentType: "image/jpeg" });

    const executionTime = Date.now() - startTime;
    console.log(`Upload time: ${executionTime}ms, Cold start: ${coldStart}`);

    // Log current memory usage.
    const memoryUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    console.log(`Upload Memory usage: ${memoryUsedMB} MB`);

    res.status(200).json({
      message: "Image uploaded successfully!",
      coldStart,
      executionTime,
    });
  } catch (error) {
    console.error("Upload Error:", error.message);
    const memoryUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    console.error(`Upload Memory usage: ${memoryUsedMB} MB`);
    res.status(500).json({
      message: "Failed to upload image",
      error: error.message,
      coldStart,
    });
  }
};

// HTTP-triggered function for processing images.
exports.processImage = async (req, res) => {
  const startTime = Date.now();
  const coldStart = isColdStart;
  isColdStart = false;

  try {
    // Expecting 'bucketName' and 'fileName' in the request.
    const { bucketName, fileName } = req.body;
    if (!bucketName || !fileName) {
      throw new Error("Missing 'bucketName' or 'fileName'");
    }

    // Download the image from the given bucket.
    const file = storage.bucket(bucketName).file(fileName);
    const [imageBuffer] = await file.download();

    // Resize the image and convert it to JPEG.
    const processedBuffer = await sharp(imageBuffer)
      .resize(300, 300, { fit: "cover", position: "center" })
      .toFormat("jpeg")
      .toBuffer();

    // Determine which bucket to use for the processed image.
    const processedBucketName = process.env.PROCESSED_BUCKET || "processed-bucket-experiment";
    const processedKey = `processed-${fileName}`;

    // Save the processed image.
    await storage.bucket(processedBucketName).file(processedKey).save(processedBuffer, { contentType: "image/jpeg" });

    const executionTime = Date.now() - startTime;
    console.log(`Processing time: ${executionTime}ms, Cold start: ${coldStart}`);

    // Log current memory usage.
    const memoryUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    console.log(`ProcessImage Memory usage: ${memoryUsedMB} MB`);

    res.status(200).json({
      message: "Image processed successfully!",
      processedKey,
      coldStart,
      executionTime,
    });
  } catch (error) {
    console.error("Process Error:", error.message);
    const memoryUsedMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    console.error(`ProcessImage Memory usage: ${memoryUsedMB} MB`);
    res.status(500).json({
      message: "Failed to process image",
      error: error.message,
      coldStart,
    });
  }
};

