import { useLayoutEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { userActions } from '../system/slices'
import { Friends } from './Friends'
import { ResetButton } from './ResetButton'

const Bell = () => {
  return (
    <svg
      className="h-6 w-6 fill-current text-white opacity-25"
      viewBox="0 0 20 20"
    >
      <path
        d="M14 8a4 4 0 1 0-8 0v7h8V8zM8.027 2.332A6.003 6.003 0 0 0 4 8v6l-3 2v1h18v-1l-3-2V8a6.003 6.003 0 0 0-4.027-5.668 2 2 0 1 0-3.945 0zM12 18a2 2 0 1 1-4 0h4z"
        fillRule="evenodd"
      />
    </svg>
  )
}

const Plus = () => {
  return (
    <svg
      className="fill-current h-4 w-4 opacity-50"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
    >
      <path d="M11 9h4v2h-4v4H9v-4H5V9h4V5h2v4zm-1 11a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
    </svg>
  )
}

const Username = () => {
  const user = useSelector((state) => state.user)
  const dispatch = useDispatch()

  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(user.username)
  const input = useRef()

  useLayoutEffect(() => {
    if (editing) {
      input.current.focus()
      input.current.select()
    }
  }, [editing])

  if (editing) {
    return (
      <input
        className="text-black text-base"
        value={nameValue}
        ref={input}
        onBlur={() => setEditing(false)}
        onInput={(evt) => setNameValue(evt.currentTarget.value)}
        onKeyPress={(evt) => {
          if (evt.key === 'Enter') {
            dispatch(userActions.set({ username: nameValue, id: user.id }))
            setEditing(false)
          } else if (evt.key === 'Esc') {
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <div className="text-base">
      You are{' '}
      <span
        role="button"
        tabIndex={0}
        onClick={() => setEditing(true)}
        onKeyDown={() => setEditing(true)}
        className="text-yellow-300"
      >
        {user.username || '!!!'}
      </span>
    </div>
  )
}

export const ChannelSelector = () => {
  return (
    <div className="bg-indigo-700 text-purple-300 flex-none w-64 pb-6 hidden md:block">
      <div className="text-white mb-2 mt-3 px-4 flex justify-between">
        <div className="flex-auto">
          <h1 className="font-semibold text-xl leading-tight mb-1 truncate">
            house.chat
          </h1>
          <div className="flex items-center mb-6">
            <Username />
          </div>
        </div>
        <div className="hidden">
          <Bell />
        </div>
      </div>

      <div className="mb-8">
        <div className="px-4 mb-2 text-white flex justify-between items-center">
          <div className="opacity-75">Channels</div>
          <div className="hidden">
            <Plus />
          </div>
        </div>
        <div className="bg-teal-600 py-1 px-4 text-white"># general</div>
      </div>

      <Friends />

      <ResetButton />
    </div>
  )
}
