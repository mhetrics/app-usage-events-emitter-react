# app-usage-events-emitter-react

utility to easily emit app-usage-events from your app to the mhetrics platform

# install

```ts
npm install @mhetrics/app-usage-events-emitter-react
```

# use

### autocaptured events

Add the provider to your react app. This provider is responsible for
- instantiating the autocapture listeners
- emitting the app-usage-events
- configuring the capture-server authorization

```tsx
import { AppUsageEventsEmitter } from '@mhetrics/app-usage-events-emitter-react';

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


### domain events

Your app is now also configured to emit domain events. Domain events are custom events produced by your application's domain logic (a.k.a. business logic). Here is an example of how to emit domain events

```ts
import { emitDomainEvent } from '@mhetrics/app-usage-events-emitter-react';

await emitDomainEvent({
  /**
   * the name of this event
   */
  name: 'conversion', // a conversion occurred

  /**
   * the scope of the domain that this event applies to
   */
  scope: 'storefront', // a conversion from the storefront product

  /**
   * any adhoc details we want to associate with this event
   */
  details: {
    promocode: 'WINT23',
  }
})
```
