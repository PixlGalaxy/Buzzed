import { useState } from 'react'
import ImageCropper from '../components/ImageCropper'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [croppedFile, setCroppedFile] = useState<File | null>(null)

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleRegister() {
    if (!name || !email || !password) return alert('Please fill all fields')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    const j = await res.json()
    if (j.token) {
      localStorage.setItem('token', j.token)
      if (croppedFile) {
        const fd = new FormData()
        fd.append('avatar', croppedFile)
        await fetch('/api/user/avatar', {
          method: 'POST',
          headers: { Authorization: `Bearer ${j.token}` },
          body: fd
        })
      }
      window.location.href = '/Buzzed'
    } else {
      alert(j.error || 'Error creating account')
    }
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h1 className="text-3xl font-bold">Register</h1>

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full px-3 py-2 rounded bg-black/30 border border-white/10"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full px-3 py-2 rounded bg-black/30 border border-white/10"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full px-3 py-2 rounded bg-black/30 border border-white/10"
      />

      {!avatarSrc && (
        <label className="block cursor-pointer bg-white/10 rounded-lg p-4 text-center border border-white/10">
          Select or Take Photo
          <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
        </label>
      )}

      {avatarSrc && (
        <ImageCropper
          imageSrc={avatarSrc}
          onCropped={file => setCroppedFile(file)}
        />
      )}

      <button
        onClick={handleRegister}
        className="bg-emerald-500 px-6 py-3 rounded-xl w-full font-semibold"
      >
        Register
      </button>
    </div>
  )
}
