export type TorchCapabilities = {
  torch?: boolean | readonly boolean[];
};

export function trackSupportsTorch(capabilities: TorchCapabilities | null | undefined): boolean {
  const torch = capabilities?.torch;
  if (typeof torch === "boolean") {
    return torch;
  }
  if (!Array.isArray(torch)) {
    return false;
  }
  return torch.some((value) => value === true);
}

export async function applyTorch(track: MediaStreamTrack, on: boolean): Promise<void> {
  await track.applyConstraints({
    advanced: [{ torch: on } as MediaTrackConstraintSet],
  });
}
