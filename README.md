# My Foldkit App

A statically generated Foldkit application built with Effect.

## Getting Started

```bash
bun install
bun dev
```

## Building and previewing

```bash
bun run build
bun run preview
```

The build is one `vite build`. `@foldkit/vite-plugin` builds the client bundle,
builds the server bundle, and generates a page for every path
`src/entry.server.ts` lists, all from that one command.

## How Foldkit Works

Foldkit reactivity works by declaring a model, the messages,
an update function, and a view function.

The _model_ is state, the _messages_ are the events that can happen,
the _update_ function is how the model changes in response to messages,
and the _view_ function is how the model is rendered to the user. This is
the architecture of Foldkit, and it is similar to the Elm architecture.

It might also be useful to define a _command_, which is a message that
is sent to the outside world (e.g. to fetch data from an API) and
then returns a message back to the update function when it is done.

Finally, a _subscription_ can be used to listen to external events (e.g.
WebSocket messages) and send messages to the update function when they
happen.

## Learn More

- [Foldkit Documentation](https://foldkit.dev)
- [Effect Documentation](https://effect.website)
