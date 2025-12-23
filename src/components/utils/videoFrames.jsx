/**
 * Extract frames from a video file for analysis
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
            duration,
            width: video.videoWidth,
            height: video.videoHeight
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