import { isEqual } from 'lodash'
import { useSelector } from 'react-redux'

const Peers = ({ peers }) => {
  return peers.map((peer) => (
    <div key={peer.id} className="flex items-center mb-3 px-4">
      <svg
        className="h-2 w-2 fill-current text-green-600 mr-2"
        viewBox="0 0 20 20"
      >
        <circle cx="10" cy="10" r="10" />
      </svg>
      <div className="text-white opacity-75">
        {peer.username}
        <span className="hidden">{peer.id}</span>
      </div>
    </div>
  ))
}

export const Friends = () => {
  const peers = useSelector(
    (state) => Object.values(state.peers.peers),
    isEqual
  )
  const user = useSelector((state) => state.user || {}, isEqual)

  return (
    <div className="mb-8">
      <div className="px-4 mb-2 text-white flex justify-between items-center">
        <div className="opacity-75">Peers</div>
      </div>
      <div className="flex items-center mb-3 px-4">
        <svg
          className="h-2 w-2 fill-current text-green-600 mr-2"
          viewBox="0 0 20 20"
        >
          <circle cx="10" cy="10" r="10" />
        </svg>
        <div className="text-white opacity-75">
          {user.username} <span className="text-grey text-sm">(you)</span>
          <span className="hidden">{user.id}</span>
        </div>
      </div>
      <Peers peers={peers} />
    </div>
  )
}
