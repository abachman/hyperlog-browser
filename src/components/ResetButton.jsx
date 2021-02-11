import { useDispatch } from 'react-redux'
import { dataActions } from '../system/slices'

export const ResetButton = () => {
  const dispatch = useDispatch()

  return (
    <div className="absolute bottom-0 left-0 p-4">
      <button type="button" onClick={() => dispatch(dataActions.reset())}>
        reset
      </button>
    </div>
  )
}
