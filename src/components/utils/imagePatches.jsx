/**
 * Generate deterministic image patches for multi-region analysis
 */

export async function generatePatchesFromFile(file, count = 8) {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const patchSize = 512;
  canvas.width = patchSize;
  canvas.height = patchSize;
  
  const patches = [];
  const regions = [
    { id: 'center', x: 0.5, y: 0.5 },
    { id: 'top_left', x: 0.25, y: 0.25 },
    { id: 'top_right', x: 0.75, y: 0.25 },
    { id: 'bottom_left', x: 0.25, y: 0.75 },
    { id: 'bottom_right', x: 0.75, y: 0.75 },
    { id: 'top_third', x: 0.5, y: 0.167 },
    { id: 'mid', x: 0.5, y: 0.5 },
    { id: 'bottom_third', x: 0.5, y: 0.833 }
  ];

  for (let i = 0; i < count && i < regions.length; i++) {
    const region = regions[i];
    const sx = Math.max(0, Math.min(img.width - patchSize, (region.x * img.width) - patchSize / 2));
    const sy = Math.max(0, Math.min(img.height - patchSize, (region.y * img.height) - patchSize / 2));
    
    ctx.clearRect(0, 0, patchSize, patchSize);
    ctx.drawImage(img, sx, sy, patchSize, patchSize, 0, 0, patchSize, patchSize);
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    patches.push({
      id: region.id,
      blob,
      file: new File([blob], `patch_${region.id}.jpg`, { type: 'image/jpeg' })
    });
  }
  
  return patches;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}