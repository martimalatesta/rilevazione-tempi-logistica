import { HashRouter, Routes, Route } from 'react-router-dom'
import Landing from './Landing.jsx'
import TimerFlow from './TimerFlow.jsx'
import { IN_ACTIVITIES, IN_ACTIVITY_FIELDS, IN_PHOTO_ACTIVITY, IN_PHOTO_HINT } from './inConfig.js'
import { OUT_ACTIVITIES, OUT_ACTIVITY_FIELDS } from './outConfig.js'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/in"
          element={
            <TimerFlow
              sezione="IN"
              sectionLabel="IN"
              activities={IN_ACTIVITIES}
              activityFieldsMap={IN_ACTIVITY_FIELDS}
              photoActivityName={IN_PHOTO_ACTIVITY}
              photoHint={IN_PHOTO_HINT}
            />
          }
        />
        <Route
          path="/out"
          element={
            <TimerFlow sezione="OUT" sectionLabel="OUT" activities={OUT_ACTIVITIES} activityFieldsMap={OUT_ACTIVITY_FIELDS} />
          }
        />
      </Routes>
    </HashRouter>
  )
}
