import Knex from 'knex'
import { ItemStatus } from '@/service/models/Item'

export const up = async (knex: Knex) => {
  await knex.schema.createTable('items', (table) => {
    table.string('id').primary()
    table.string('path', 2048).notNullable()
    table.string('filename', 2048).notNullable()
    table.string('extension', 2048).notNullable()
    table.integer('size').notNullable()
    table.enum('status', Object.values(ItemStatus)).notNullable().defaultTo(ItemStatus.Idle)
    table.string('error').nullable().defaultTo(null)
    table.string('external_table').nullable().defaultTo(null)
  })

  await knex.schema.createTable('video_items', (table) => {
    table.string('item_id').primary().references('id').inTable('items')
    table.float('duration').notNullable()
    table.text('thumbnail_timestamps').notNullable()
  })
}

export const down = async (knex: Knex) => {
  await knex.schema.dropTable('items')
  await knex.schema.dropTable('video_items')
}
