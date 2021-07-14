import { resolve } from 'path'
import Knex, { Sqlite3ConnectionConfig } from 'knex'
import { Model } from 'objection'
import { PATH_SQLITE } from '@/paths'

const sqliteConfig: Sqlite3ConnectionConfig = {
  filename: PATH_SQLITE
}

export async function initializeDatabase() {
  const knex = Knex({
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: sqliteConfig
  })

  await knex.migrate.latest({
    directory: resolve(__dirname, './migrations')
  })

  await knex.raw('PRAGMA foreign_keys = ON')

  Model.knex(knex)
}
