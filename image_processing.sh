#!/bin/bash
# A simple script to test our image upload and processing functions.
# Usage: ./image_processing.sh <path_to_image>

if [ -z "$1" ]; then
  echo "Usage: ./image_processing.sh <path_to_image>"
  exit 1
fi

# Record the start time of the workflow.
workflowStart=$(date +%s%3N)

IMAGE_PATH="$1"
FILE_NAME=$(basename "$IMAGE_PATH")

# Endpoints for our deployed Cloud Functions.
UPLOAD_ENDPOINT="https://us-central1-bamboo-medium-448219-i3.cloudfunctions.net/uploadImage"
PROCESS_ENDPOINT="https://us-central1-bamboo-medium-448219-i3.cloudfunctions.net/processImage"

# Step 1: Upload the image.
echo "Uploading $FILE_NAME to $UPLOAD_ENDPOINT..."
TMP_PAYLOAD=$(mktemp)
BASE64_IMAGE=$(base64 -w 0 "$IMAGE_PATH")
cat > "$TMP_PAYLOAD" <<EOF
{"image": "$BASE64_IMAGE", "fileName": "$FILE_NAME"}
EOF

UPLOAD_RESPONSE=$(curl -s -X POST "$UPLOAD_ENDPOINT" \
  -H "Content-Type: application/json" \
  --data-binary @"$TMP_PAYLOAD")

rm "$TMP_PAYLOAD"
UPLOAD_MESSAGE=$(echo "$UPLOAD_RESPONSE" | jq -r '.message')
echo "Upload Response: $UPLOAD_MESSAGE"

if [ "$UPLOAD_MESSAGE" != "Image uploaded successfully!" ]; then
  echo "Upload failed. Response: $UPLOAD_RESPONSE"
  exit 1
fi

# Capture upload metrics.
UPLOAD_EXEC_TIME=$(echo "$UPLOAD_RESPONSE" | jq -r '.executionTime')
UPLOAD_COLD_START=$(echo "$UPLOAD_RESPONSE" | jq -r '.coldStart')

# Step 2: Process the uploaded image.
echo "Processing $FILE_NAME..."
PROCESS_RESPONSE=$(curl -s -X POST "$PROCESS_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"bucketName\": \"upload-bucket-experiment\", \"fileName\": \"$FILE_NAME\"}")

PROCESS_MESSAGE=$(echo "$PROCESS_RESPONSE" | jq -r '.message')
PROCESSED_KEY=$(echo "$PROCESS_RESPONSE" | jq -r '.processedKey')
PROCESS_COLD_START=$(echo "$PROCESS_RESPONSE" | jq -r '.coldStart')
PROCESS_EXEC_TIME=$(echo "$PROCESS_RESPONSE" | jq -r '.executionTime')

if [ "$PROCESS_MESSAGE" == "Image processed successfully!" ]; then
  echo "Processing successful: Processed image is saved as $PROCESSED_KEY."
  echo "Cold start: $PROCESS_COLD_START, Execution time: ${PROCESS_EXEC_TIME}ms"
else
  echo "Processing failed. Response: $PROCESS_RESPONSE"
  exit 1
fi

# Record the end time and compute the total workflow time.
workflowEnd=$(date +%s%3N)
totalWorkflowTime=$(( workflowEnd - workflowStart ))
echo "Total workflow time: ${totalWorkflowTime}ms"

# Determine if either function had a cold start.
if [ "$UPLOAD_COLD_START" == "true" ] || [ "$PROCESS_COLD_START" == "true" ]; then
  combinedColdstart=true
else
  combinedColdstart=false
fi

# Log the workflow metrics to Cloud Logging.
gcloud logging write workflow_exec_times "Workflow Metrics: uploadExec=${UPLOAD_EXEC_TIME}ms, processExec=${PROCESS_EXEC_TIME}ms, coldstart=${combinedColdstart}, totalWorkflowTime=${totalWorkflowTime}ms" --payload-type=text > /dev/null 2>&1

