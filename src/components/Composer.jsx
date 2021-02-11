import { useLayoutEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { sendMessage } from '../system/store'

const BigPlus = () => {
  return (
    <svg
      className="fill-current h-6 w-6 block"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
    >
      <path d="M16 10c0 .553-.048 1-.601 1H11v4.399c0 .552-.447.601-1 .601-.553 0-1-.049-1-.601V11H4.601C4.049 11 4 10.553 4 10c0-.553.049-1 .601-1H9V4.601C9 4.048 9.447 4 10 4c.553 0 1 .048 1 .601V9h4.399c.553 0 .601.447.601 1z" />
    </svg>
  )
}

export const Composer = () => {
  const dispatch = useDispatch()
  const [inputText, setInputText] = useState('')
  const input = useRef()

  useLayoutEffect(() => {
    input.current.focus()
  }, [])

  const send = (text) => {
    dispatch(sendMessage(text))
    setInputText('')
  }

  const onKeyPress = (evt) => {
    if (evt.key === 'Enter') {
      send(inputText)
    }
  }

  return (
    <div className="pb-6 px-4 flex-none">
      <div className="flex rounded-lg border-2 border-gray-400 overflow-hidden">
        <button
          onClick={() => {
            send(inputText)
          }}
          className="text-3xl text-grey border-r-2 border-gray-400 p-2"
        >
          <BigPlus />
        </button>
        <input
          ref={input}
          type="text"
          className="w-full px-4"
          placeholder="Message #general"
          value={inputText}
          onKeyPress={onKeyPress}
          onInput={(evt) => {
            setInputText(evt.currentTarget.value)
          }}
        />
      </div>
    </div>
  )
}
