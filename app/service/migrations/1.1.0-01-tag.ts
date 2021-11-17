import Knex from 'knex'
import { ItemStatus } from '@/service/models/Item'

export const up = async (knex: Knex) => {
  await knex.raw('PRAGMA foreign_keys = ON')

  await upModifyOldTables(knex)

  await knex.schema.createTable('tags', (table) => {
    table.increments('id').primary()
    table.string('name', 256).unique().notNullable()
  })

  await knex.schema.createTable('item_tags', (table) => {
    table.increments('id').primary()
    table.integer('item_id').references('items.id').onDelete('cascade').notNullable()
    table.integer('tag_id').references('tags.id').onDelete('restrict').notNullable()
    table.unique(['item_id', 'tag_id'])
  })
}

export const down = () => {
  // We don't have backward compatibility :/
  throw new Error("We don't have backward compatibility")
}

async function upModifyOldTables(knex: Knex) {
  await knex.raw('PRAGMA foreign_keys = OFF')

  // Change primary key to auto increment from varchar.
  // We need to use raw sql because sqlite doesn't provide alter column.
  // We also need to change foreign key from video_items since referenced column is changed.
  await knex.schema.renameTable('items', 'temp_items')
  await knex.schema.renameTable('video_items', 'temp_video_items')

  await knex.schema.createTable('items', (table) => {
    table.increments('id').primary()
    table.string('path', 2048).notNullable()
    table.string('filename', 2048).notNullable()
    table.string('extension', 2048).notNullable()
    table.integer('size').unsigned().notNullable()
    table.enum('status', Object.values(ItemStatus)).notNullable().defaultTo(ItemStatus.Idle)
    table.string('error', 2048).nullable().defaultTo(null)
    table.string('external_table', 64).nullable().defaultTo(null)
    table.unique(['filename', 'size'])
  })
  await knex.schema.createTable('video_items', (table) => {
    table.integer('item_id').primary().references('items.id').onDelete('cascade').notNullable()
    table.float('duration').notNullable()
    table.text('thumbnail_timestamps').notNullable()
  })
  await knex.raw(`
    insert into items (path, filename, extension, size, status, error, external_table)
    select path, filename, extension, size, status, error, external_table from temp_items
  `)
  await knex.raw(`
    insert into video_items (item_id, duration, thumbnail_timestamps)
    select (
      select id from items new_items where new_items.path = (
        select path from temp_items old_items where old_items.id = old_video_items.item_id
      )
    ), duration, thumbnail_timestamps from temp_video_items old_video_items
  `)

  await knex.raw('PRAGMA foreign_keys = ON')
}
