export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return /\.(webm|mp4|ogg|mov)$/.test(clean);
}

export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("Empty media URL"));
      return;
    }
    if (isVideoUrl(url)) {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      const done = () => resolve();
      video.onloadeddata = done;
      video.oncanplay = done;
      video.onerror = () => reject(new Error(`Failed to load video: ${url}`));
      video.src = url;
      // Some browsers won't fire load events until we trigger
      try {
        video.load();
      } catch {
        /* noop */
      }
      return;
    }
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}
