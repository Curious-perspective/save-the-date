import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import StoryV2 from './StoryV2'

// (the couple, 17 Nov night: no floating RSVP button; the story ends on the RSVP board)
const App = () => <main><StoryV2 /></main>

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
