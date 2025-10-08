export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: any
): Promise<File> {
  const image = new Image()
  image.src = imageSrc
  await new Promise(resolve => (image.onload = resolve))
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )
  const blob: Blob = await new Promise(res =>
    canvas.toBlob(b => res(b!), 'image/jpeg', 0.9)
  )
  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
}
