import { VideoTexture, SRGBColorSpace } from 'three';
import { onDestroy } from 'svelte';

/**
 * Creates a video element and a corresponding Three.js texture.
 * @param {string} url - Path to your video file
 */
export function create_video_texture(url) {
  const video = document.createElement('video');
  video.src = url;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.crossOrigin = 'anonymous';
  video.play().catch(err => console.warn("Video autoplay blocked:", err));

  const texture = new VideoTexture(video);
  
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
 
  // Cleanup to prevent memory leaks
  onDestroy(() => {
    video.pause();
    video.src = "";
    video.load();
    texture.dispose();
  });

  return texture;
}
