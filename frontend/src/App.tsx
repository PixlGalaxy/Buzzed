import { Outlet, Link } from 'react-router-dom'
export default function App() {
return (
<div className="min-h-screen bg-gray-950 text-white">
<nav className="sticky top-0 bg-gray-900 border-b border-white/10">
<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
<Link to="/" className="font-bold text-xl">Buzzed</Link>
<div className="space-x-4 text-sm">
<Link to="/Buzzed" className="underline">Play</Link>
<Link to="/Login" className="underline">Login</Link>
<Link to="/Register" className="underline">Register</Link>
</div>
</div>
</nav>
<main className="max-w-6xl mx-auto px-4 py-8">
<Outlet />
</main>
</div>
)
}