# app-usage-events-react

utility to easily emit app-usage-events from your app to the mhetrics platform

# install

```ts
npm install @mhetrics/app-usage-events-react
```

# use

### autocaptured events

Add the provider to your react app. This provider is responsible for
- instantiating the autocapture listeners
- emitting the app-usage-events
- configuring the capture-server authorization

```tsx
import { AppUsageEventsEmitter } from '@mhetrics/app-usage-events-react';

<AppUsageEventsEmitter
  clientKey={config.mhetrics.clientKey}
  captureHost={config.mhetrics.captureHost}
/>
```

With that, your app will automatically be emitting
- network events (e.g., rest requests)
- browser events (e.g., load, unload, focus, blur, navigation)
- runtime events (e.g., console.log, console.warn, console.error)
- activity events (e.g., mouse, touch, scroll, keyboard)


### observation events

Your app is now also configured to emit observation events. Observation events are produced by your application to track observations useful for analytics. Here is an example of how to emit observation events

```ts
import { captureObservationEvent } from '@mhetrics/app-usage-events-react';

await captureObservationEvent({
  /**
   * the type of the observation you are reporting
   */
  type: 'experiment.exposure', // for example, tracking that a user was exposed to an experiment

  /**
   * details about the observation
   */
  details: {
    experiment: 'show-reviews?', // for example, an experiment about whether or not reviews should be shown
    treatment: 'CONTROL', // for example, tracking that they were exposed to the CONTROL treatment of the experiment
  }
})
```
