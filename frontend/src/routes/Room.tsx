import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'

interface Leader {
  display_name: string
  score: number
  avatar_url?: string
}

const API_URL = '' 

export default function Room() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState<Leader[]>([])
  const [uploadId, setUploadId] = useState<string>('')
  const [socket, setSocket] = useState<Socket | null>(null)

  // Initialize Socket
  useEffect(() => {
    const s = io(API_URL)
    s.emit('room:join', { code })
    s.on('leaderboard:update', (payload: { leaderboard: Leader[] }) => {
      setLeaderboard(payload.leaderboard)
    })
    setSocket(s)
    return () => {
      s.disconnect()
    }
  }, [code])

  // Create Or Redirect To New Room
  useEffect(() => {
    async function ensureRoom() {
      if (code === 'NEW') {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        })
        const j = await res.json()
        if (j.code) navigate(`/Buzzed/${j.code}`, { replace: true })
      }
    }
    ensureRoom()
  }, [code, navigate])

  // Join Room
  useEffect(() => {
    async function join() {
      const token = localStorage.getItem('token')
      await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName: 'Player' })
      })
    }
    if (code && code !== 'NEW') join()
  }, [code])

  // Uplaod Picture
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !code) return
    const token = localStorage.getItem('token')
    const form = new FormData()
    form.append('image', file)
    const res = await fetch(`/api/rooms/${code}/upload-drink`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    })
    const j = await res.json()
    if (j.uploadId) setUploadId(j.uploadId)
  }

  // Add Points
  async function score(type: 'DRINK' | 'SHOT') {
    if (!uploadId || !code) return alert('Upload a picture first!')
    const token = localStorage.getItem('token')
    await fetch(`/api/rooms/${code}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ type, uploadId })
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="px-4 py-2 rounded bg-white/10 border border-white/10 cursor-pointer">
          Upload Picture
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
          />
        </label>
        <button
          onClick={() => score('DRINK')}
          className="px-4 py-2 rounded bg-emerald-500"
        >
          Drink +10
        </button>
        <button
          onClick={() => score('SHOT')}
          className="px-4 py-2 rounded bg-fuchsia-500"
        >
          Shot +15
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-3">Leaderboard</h2>
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="p-3">Player</th>
                <th className="p-3">Score</th>
              </tr>
            </thead>
                <tbody>
                {leaderboard.map((r, i) => (
                    <tr
                    key={i}
                    className="odd:bg-white/0 even:bg-white/5 transition-colors"
                    >
                    <td className="p-3 flex items-center gap-2">
                        <img
                        src={r.avatar_url || '/default-avatar.png'}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                        />
                        {r.display_name}
                    </td>
                    <td className="p-3">{r.score}</td>
                    </tr>
                ))}
                </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
