import Knex from 'knex'

export const up = async (knex: Knex) => {
  await knex.raw('PRAGMA foreign_keys = ON')

  await knex.schema.createTable('watch_directories', (table) => {
    table.increments('id').primary()
    table.string('path', 2048).unique().notNullable()
    table.boolean('recursive').notNullable()
  })
}

export const down = async (knex: Knex) => {
  await knex.schema.dropTable('watch_directories')
}
