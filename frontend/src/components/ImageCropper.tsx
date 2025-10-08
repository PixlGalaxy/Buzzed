import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../lib/cropUtils'

interface Props {
  imageSrc: string
  onCropped: (file: File) => void
}

export default function ImageCropper({ imageSrc, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropComplete = useCallback((_area: any, areaPixels: any) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  async function handleDone() {
    const file = await getCroppedImg(imageSrc, croppedAreaPixels)
    onCropped(file)
  }

  return (
    <div className="relative w-full h-[300px] bg-black rounded-xl overflow-hidden">
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
        />
        <button onClick={handleDone} className="bg-emerald-500 px-4 py-2 rounded-lg text-sm">
          Done
        </button>
      </div>
    </div>
  )
}
