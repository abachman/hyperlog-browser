import './App.css'

import { ChannelSelector } from './components/ChannelSelector'
import { MessageContainer } from './components/MessageContainer'

// style from https://codepen.io/adamwathan/pen/JOQWVa

function App() {
  return (
    <div className="font-sans antialiased h-screen flex">
      <ChannelSelector />
      <MessageContainer />
    </div>
  )
}

export default App
