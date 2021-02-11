import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

const Message = React.memo(({ mid }) => {
  const message = useSelector((state) => state.messages.messages[mid])
  const lines = message.text.split('\n')
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
        {lines.length === 1 ? (
          <p className="text-black leading-normal">{message.text}</p>
        ) : (
          <>
            {lines.map((line, idx) => (
              <p key={idx} className="text-black leading-normal">
                {line}
              </p>
            ))}
          </>
        )}
      </div>
    </div>
  )
})

export const Messages = () => {
  const messageIds = useSelector((state) =>
    Object.keys(state.messages.messages).sort()
  )
  const lastlen = useRef(messageIds.length)
  const container = useRef()

  useEffect(() => {
    if (container.current) {
      container.current.scrollTo(0, container.current.scrollHeight)
      lastlen.current = messageIds.length
    }
  }, [messageIds, container])

  return (
    <div ref={container} className="px-6 py-4 flex-1 overflow-y-scroll">
      {messageIds.map((mid) => (
        <Message mid={mid} key={mid} />
      ))}
    </div>
  )
}
