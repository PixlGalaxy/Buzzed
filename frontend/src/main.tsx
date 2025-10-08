import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Home from './routes/Home'
import Buzzed from './routes/Buzzed'
import Room from './routes/Room'
import Leaderboard from './routes/Leaderboard'
import Login from './routes/Login'
import Register from './routes/Register'


const router = createBrowserRouter([
{
path: '/',
element: <App />,
children: [
{ path: '/', element: <Home /> },
{ path: '/Home', element: <Home /> },
{ path: '/Buzzed', element: <Buzzed /> },
{ path: '/Buzzed/:code', element: <Room /> },
{ path: '/Buzzed/:code/Leaderboard', element: <Leaderboard /> },
{ path: '/Login', element: <Login /> },
{ path: '/Register', element: <Register /> }
]
}
])


createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<RouterProvider router={router} />
</React.StrictMode>
)