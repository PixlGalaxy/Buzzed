import { Link } from 'react-router-dom'
export default function Home(){
return (
<section className="text-center space-y-6">
<h1 className="text-4xl font-bold">Buzzed</h1>
<p className="text-white/70 max-w-2xl mx-auto">Track drinks with friends in real-time. Join by code, upload proof, and climb the leaderboard. Photos auto-delete after 48 hours.</p>
<Link to="/Buzzed" className="px-6 py-3 bg-emerald-500 rounded-xl font-semibold">Start Playing</Link>
</section>
)
}