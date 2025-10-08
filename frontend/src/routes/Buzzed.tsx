import { useState } from 'react'
import { useNavigate } from 'react-router-dom'


export default function Buzzed(){
const [code, setCode] = useState('')
const navigate = useNavigate()
return (
<div className="grid gap-6 md:grid-cols-2">
<div className="p-6 rounded-2xl bg-white/5">
<h2 className="text-2xl font-bold mb-3">Join a Room</h2>
<div className="flex gap-2">
<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ROOMCODE" className="flex-1 px-3 py-2 rounded bg-black/40 border border-white/10"/>
<button onClick={()=>navigate(`/Buzzed/${code}`)} className="px-4 py-2 rounded bg-blue-500">Join</button>
</div>
</div>
<div className="p-6 rounded-2xl bg-white/5">
<h2 className="text-2xl font-bold mb-3">Create a Room</h2>
<button onClick={()=>navigate(`/Buzzed/NEW`)} className="px-4 py-2 rounded bg-emerald-500">Create</button>
</div>
</div>
)
}