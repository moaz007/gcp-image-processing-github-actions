#!/bin/bash

# Check if an image file is provided
if [ -z "$1" ]; then
  echo "Usage: ./image_processing_gcp.sh <path_to_image>"
  exit 1
fi

# Variables
IMAGE_PATH="$1"
FILE_NAME=$(basename "$IMAGE_PATH")
UPLOAD_BUCKET="upload-bucket-experiment"
PROCESSED_BUCKET="processed-bucket-experiment"

# Step 1: Upload the image to the GCP bucket
echo "Uploading $FILE_NAME to GCP bucket $UPLOAD_BUCKET..."
gsutil cp "$IMAGE_PATH" "gs://$UPLOAD_BUCKET/$FILE_NAME" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Upload successful: $FILE_NAME uploaded to $UPLOAD_BUCKET."
else
  echo "Upload failed."
  exit 1
fi

# Step 2: Wait for the function to process the image
PROCESSED_FILE_NAME="processed-$FILE_NAME"
MAX_RETRIES=10
RETRY_DELAY=2
RETRY_COUNT=0

echo "Triggering image processing for $FILE_NAME..."
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  gsutil ls "gs://$PROCESSED_BUCKET/$PROCESSED_FILE_NAME" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "Processing successful: Processed image saved as $PROCESSED_FILE_NAME in $PROCESSED_BUCKET."
    break
  fi
  sleep $RETRY_DELAY
  ((RETRY_COUNT++))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Processing failed: Processed image not found for $FILE_NAME after $((MAX_RETRIES * RETRY_DELAY)) seconds."
  exit 1
fi

# Step 3: Fetch logs for the execution
LOGS=$(gcloud functions logs read imageResizer --region=us-central1 --limit=10)

# Extract cold start status and execution time
COLD_START=$(echo "$LOGS" | grep -m 1 "Cold start:" | awk -F': ' '{print $2}')
EXECUTION_TIME=$(echo "$LOGS" | grep -m 1 "Execution time:" | awk -F': ' '{print $2}' | tr -d 's')

# Display results
echo "Cold start: ${COLD_START:-false}"
echo "Execution time: ${EXECUTION_TIME:-N/A}s"

echo "Workflow completed successfully."

