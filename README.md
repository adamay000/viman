# viman

Video Manager application.

# Getting Started

```sh
$ yarn

# Launch next dev server
$ yarn dev

# Open another terminal and launch electron
$ yarn dev:electron
```

# Build

```sh
$ yarn build
```

# Debug

## Database

```sh
$ yarn debug:database

sqlite> select * from items;
```

# Trouble Shootings

## node-gyp problem about sqlite3

Try `yarn rebuild`.

## pre-commit doesn't work

Try `npx simple-git-hooks`.
