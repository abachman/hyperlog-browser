import React, { useLayoutEffect, useRef } from "react";
import { useSelector } from "react-redux";

const Message = React.memo(({ message }) => {
  return (
    <div className="flex items-start mb-4 text-sm">
      <div className="w-10 h-10 text-blue-400 rounded mr-3">[ P ]</div>
      <div className="flex-1 overflow-hidden">
        <div>
          <span className="font-bold" title={message.uid}>
            {message.username}
          </span>
          <span className="text-gray-600 text-xs ml-2">
            {new Date(message.timestamp).toLocaleString()}
          </span>
        </div>
        <p className="text-black leading-normal">{message.text}</p>
      </div>
    </div>
  );
});

export const Messages = () => {
  const messages = useSelector((state) => state.messages.messages);
  const lastlen = useRef(messages.length);
  const container = useRef();

  useLayoutEffect(() => {
    if (container.current && messages.length > lastlen.current) {
      container.current.scrollTo(0, container.current.scrollHeight);
      lastlen.current = messages.length;
    }
  }, [messages, container]);

  return (
    <div ref={container} className="px-6 py-4 flex-1 overflow-y-scroll">
      {/* <!-- A message --> */}
      {messages.map((msg, idx) => (
        <Message message={msg} key={idx} />
      ))}
    </div>
  );
};
