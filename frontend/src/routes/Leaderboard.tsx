import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'

interface Leader {
  display_name: string
  score: number
  avatar_url?: string
}

export default function Leaderboard() {
  const { code } = useParams<{ code: string }>()
  const [leaderboard, setLeaderboard] = useState<Leader[]>([])

  useEffect(() => {
    const socket: Socket = io()
    socket.emit('room:join', { code })

    socket.on('leaderboard:update', (payload: { leaderboard: Leader[] }) => {
      setLeaderboard(payload.leaderboard)
    })

    // ✅ devolver una función de limpieza que desconecte el socket correctamente
    return () => {
      socket.disconnect()
    }
  }, [code])

  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-6 items-start">
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
                <tr key={i} className="odd:bg-white/0 even:bg-white/5">
                  <td className="p-3 flex items-center gap-2">
                    <img
                      src={r.avatar_url || '/default-avatar.png'}
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
      <aside className="text-sm text-white/70">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="font-semibold">Buzzed Leaderboard</div>
          <div>Code: {code}</div>
          <div>{typeof window !== 'undefined' ? window.location.origin : ''}</div>
        </div>
      </aside>
    </div>
  )
}
