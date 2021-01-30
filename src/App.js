import "./App.css";

import { ServerSelector } from "./components/ServerSelector";
import { ChannelSelector } from "./components/ChannelSelector";
import { MessageContainer } from "./components/MessageContainer";

// style from https://codepen.io/adamwathan/pen/JOQWVa

function App() {
  return (
    <div className="font-sans antialiased h-screen flex">
      <ServerSelector />
      <ChannelSelector />
      <MessageContainer />
    </div>
  );
}

export default App;
