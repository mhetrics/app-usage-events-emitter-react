import { DomainEvent } from 'domain-objects';

/**
 * an object that can be serialized with JSON
 */
type SerializableObject =
  | string
  | number
  | boolean
  | null
  | undefined
  | { [property: string]: SerializableObject }
  | SerializableObject[];

/**
 * a source from which app usage events may be reported
 */
export enum AppUsageEventSource {
  /**
   * events from the network the app is using
   *
   * for example
   * - loss of internet
   * - recovery of internet
   * - loading of data
   * - sending of a request
   */
  NETWORK = 'NETWORK',

  /**
   * events from the device the app is running on
   *
   * for example
   * - device movement
   * - device orientation change
   */
  DEVICE = 'DEVICE',

  /**
   * events from the software runtime the app is running in
   *
   * for example
   * - logs
   * - errors
   */
  RUNTIME = 'RUNTIME',

  /**
   * events from the app screen
   *
   * for example
   * - loading
   * - visibility changes (focus, blur)
   * - resizing
   * - route changes
   */
  SCREEN = 'SCREEN',

  /**
   * events from user activity in the app
   *
   * for example
   * - scrolling
   * - clicking
   * - typing
   */
  ACTIVITY = 'ACTIVITY',

  /**
   * events from observations made during the app
   *
   * for example
   * - thirdparty analytics annotations (session recording urls, tracking ids, etc)
   * - components became visible
   */
  OBSERVATION = 'OBSERVATION',

  /**
   * events from the domain logic of the app
   *
   * for example
   * - a conversion was recorded
   * - a learn-more button was pressed
   */
  DOMAIN = 'DOMAIN',
}

/**
 * an app usage event reports things that occurred in an app during usage
 */
export interface AppUsageEvent {
  /**
   * a unique identifier assigned to the event
   *
   * note
   * - this is the primary key of the event, as "duplicate" events may be valid (e.g., two requests to the same endpoint at the same time)
   */
  uuid: string;

  /**
   * the time at which this event occurred, in milliseconds-since-epoch
   */
  occurredAtMse: number;

  /**
   * a reference to the session in which this event occurred
   */
  sessionUuid: string;

  /**
   * the app route from which this event was emitted
   *
   * note
   * - for web, this is the url
   * - for expo, this may also be a url: https://docs.expo.dev/routing/create-pages/
   */
  route: string;

  /**
   * the source of the app usage event
   */
  source: AppUsageEventSource;

  /**
   * the type of event which occurred
   */
  type: string;

  /**
   * details about this event, specific to the type of event it is
   */
  details: SerializableObject | null;
}
export class AppUsageEvent
  extends DomainEvent<AppUsageEvent>
  implements AppUsageEvent {}
