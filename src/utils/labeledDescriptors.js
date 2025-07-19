import * as faceapi from "face-api.js";

export const loadLabeledDescriptorForUser = async (userName) => {
  const cleanedName = userName.trim().toLowerCase().replace(/\s+/g, "_");
  const imageUrl = `https://res.cloudinary.com/dcr8k5amk/image/upload/faces/${cleanedName}.jpg`;

  try {
    const img = await faceapi.fetchImage(imageUrl);
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 128 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error(`No face detected in image for ${userName}`);
    }

    return new faceapi.LabeledFaceDescriptors(userName, [detection.descriptor]);
  } catch (err) {
    console.error("❌ Face loading error:", err.message);
    throw err;
  }
};
