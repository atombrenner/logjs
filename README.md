# @atombrenner/logjs

Pragmatic JSON logging for humans and Elasticsearch.

## Motivation

Why not use an existing logger like [pino](https://github.com/pinojs/pino),
[winston](https://github.com/winstonjs/winston)
or [log4js](https://github.com/log4js-node/log4js-node)?
Because mature logging frameworks tend to suffer from feature overload.
Many of them are designed for a world, where monolithic applications run
a long time on the same servers. They need to take care of writing to files,
cleaning up old files, aggregating logs. In a serverless world most of those
requirements are now [YAGNIs](https://martinfowler.com/bliki/Yagni.html).

My goal was to have something really simple, with the focus on

1. Usability: every junior javascript developer should be able to use it.
2. Progressivly enhance to structured JSON: make it easy to add structured information
   that can be ingested by Elasticsearch and json log awared services.
3. Should work out of the box in serverless environments

When working with Node or the Browser, you already have a logging framework built in.
It's the console module. You don't need to include it, it exists in the browser
and in nodejs. The API is known and used by every Javacscript developer.
In AWS Lambda, the console module is enhanced by AWS to log some interesting
data, e.g. the requestId and memory usage. So why not benefit from this?
The console module just works in the browser and in nodejs, even if writting
to process.stdout could save some nanoseconds on node.
So the basic idea was to stick with the console.log pattern as long as possible
and add error and json formatting.

This package does not optimize for:

- for the last bit of speed
- for preventing users from making rare mistakes, e.g.
  - log non serializable objects like cyclic graphs or functions
  - do inefficient log message formatting
- suppress logs below a certain level (should be done in the viewer or at ingestion time)
- super fine granular log levels. All you need is debug, info, warn, and error.
- message formatting. Use javascript string templates if you need this.

## Runtime diagram

## Installation

`npm i @atombrenner/log`

## Usage

```ts
import { log } from '@atombrenner/log'

log.info('message')
log.info('message')
log.info('message with structured data', { id: 4711, foo: 'bar' })
log.info('message with error', error)
log.info('message with data and error object', { id: 4711 }, error)
log.info(error) // error only

// the usual console levels are available
log.debug('')
log.info('')
log.warn('')
log.error('')

// use string templates for message formatting
log.info(`${method} ${path}`, { method, path })
// -> {"msg":"GET /index.html","method":"GET","path":"/index.html"}
```

## API

The signature for all logging functions is identical to `console.log`

```ts
type LogFunction = (message: unknown, ...optional: unknown[])
```

Arguments are processed from left to right. Every argument that does not looke like
an `{}` object or `Error` gets converted to an object with a `msg` property.
Errors are converted to objects with an `msg` and `stack` property.
Then all objects are merged. Duplicate properties are overwritten by the right
most one with the exception of `msg`, where all values are concatenated.

### Examples

```ts
log.info('Count', 42, 'Temperature') // -> {"msg":"Count 42 Temperature"}
log.info(true, { hasData: false }) // -> {"msg":"true","hasData":"false"}
log.info('Failure:', new Error('reason')) // -> {"msg":"Failure: reason","stack":"..."}
log.info({msg: 'a', data: 1}, {msg: 'b', data: 2}) -> // {"msg":"a - b","data":2}
```

## How to publish a new version

1. `npm version <major|minor|version>` (creates a git commit and tag)
2. `npm publish` (implicitly calls `npm run prepare`)