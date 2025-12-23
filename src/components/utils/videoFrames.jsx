/**
 * Extract frames and metadata from a video file for analysis
 */

export async function extractFramesFromVideo(videoFile, numFrames = 5) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    video.preload = 'metadata';
    video.muted = true;
    
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    
    const frames = [];
    let currentFrame = 0;
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const interval = duration / (numFrames + 1);
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Extract detailed video metadata
      const metadata = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: duration,
        aspectRatio: (video.videoWidth / video.videoHeight).toFixed(2),
        fileSize: videoFile.size,
        fileSizeMB: (videoFile.size / (1024 * 1024)).toFixed(2),
        mimeType: videoFile.type,
        fileName: videoFile.name,
        // Estimate bitrate
        estimatedBitrate: Math.round((videoFile.size * 8) / duration / 1000), // kbps
        // Check for audio tracks
        hasAudio: video.mozHasAudio !== false || Boolean(video.webkitAudioDecodedByteCount) || Boolean(video.audioTracks?.length)
      };
      
      const captureFrame = (time) => {
        video.currentTime = time;
      };
      
      video.onseeked = async () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9));
        const timestamp = video.currentTime;
        
        frames.push({
          blob,
          timestamp,
          file: new File([blob], `frame-${currentFrame}.jpg`, { type: 'image/jpeg' })
        });
        
        currentFrame++;
        
        if (currentFrame < numFrames) {
          captureFrame(interval * (currentFrame + 1));
        } else {
          URL.revokeObjectURL(videoUrl);
          resolve({
            frames,
            metadata
          });
        }
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error('Failed to load video'));
      };
      
      captureFrame(interval);
    };
    
    video.load();
  });
}