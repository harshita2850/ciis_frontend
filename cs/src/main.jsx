import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Navbar from './components/Navbar.jsx'
import { BrowserRouter, createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout.jsx'
// import Landing from './components/Landing.jsx'
import SearchPage from './components/SearchPage.jsx'
import ErrorPage from './components/ErrorPage.jsx'
import Homepage from './components/Homepage.jsx'

const router=createBrowserRouter([
  {
    path:"/",
    element:<Layout/>,
    children:[
      {
        path:"/",
        element:<Homepage/>,
        errorElement:<ErrorPage/>
      },
      {
        path:"/search",
        element:<SearchPage/>,
        errorElement:<ErrorPage/>
      }
    ]
  }
])


createRoot(document.getElementById('root')).render(
  <StrictMode>
     <RouterProvider router={router}/>
  </StrictMode>,
)
