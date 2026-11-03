export const REAR_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: "environment",
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};
