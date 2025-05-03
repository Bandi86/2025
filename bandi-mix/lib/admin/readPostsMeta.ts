import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { db } from '@/lib/db'
import type { PostMeta } from '../../types/t'
import { randomUUID } from 'crypto'

const POSTS_DIR = path.join(process.cwd(), 'content/admin-posts')

export function getAllAdminPostsMeta(): PostMeta[] {
  try {
    // Minden típushoz külön mappa
    const rootFiles = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'))
    const freeTippsDir = path.join(POSTS_DIR, 'freetipps')
    const premiumTippsDir = path.join(POSTS_DIR, 'premiumtipps')
    const freeTippsFiles = fs.existsSync(freeTippsDir)
      ? fs
          .readdirSync(freeTippsDir)
          .filter((f) => f.endsWith('.mdx'))
          .map((f) => path.join('freetipps', f))
      : []
    const premiumTippsFiles = fs.existsSync(premiumTippsDir)
      ? fs
          .readdirSync(premiumTippsDir)
          .filter((f) => f.endsWith('.mdx'))
          .map((f) => path.join('premiumtipps', f))
      : []
    const allFiles = [
      ...rootFiles.map((f) => ({ rel: f, type: 'post' as const })),
      ...freeTippsFiles.map((f) => ({ rel: f, type: 'freetipp' as const })),
      ...premiumTippsFiles.map((f) => ({ rel: f, type: 'premiumtipp' as const }))
    ]
    return allFiles.map(({ rel, type }) => {
      const filePath = path.join(POSTS_DIR, rel)
      const raw = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(raw)
      const stat = fs.statSync(filePath)
      const slug = data.slug || rel.replace(/\.mdx$/, '').replace(/\//g, '-')
      const id = slug
      // Szinkronizáció a típus alapján
      if (type === 'freetipp') {
        db.freeTipps
          .upsert({
            where: { slug: String(slug) },
            update: {
              title: data.title || '',
              deadline: data.deadline || '',
              imageurl: data.imageurl || '',
              content
            },
            create: {
              id: String(id),
              slug: String(slug),
              title: data.title || '',
              deadline: data.deadline || '',
              imageurl: data.imageurl || '',
              content,
              price: data.price || 0,
              prize: data.prize || 0,
              odds: data.odds || 0,
              createdAt: stat.birthtime.toISOString(),
              updatedAt: stat.mtime.toISOString()
            }
          })
          .catch(() => {})
      } else if (type === 'premiumtipp') {
        db.premiumTipps
          .upsert({
            where: { slug: String(slug) },
            update: {
              title: data.title || '',
              deadline: data.deadline || '',
              imageurl: data.imageurl || '',
              content
            },
            create: {
              id: String(id),
              slug: String(slug),
              title: data.title || '',
              deadline: data.deadline || '',
              imageurl: data.imageurl || '',
              content,
              price: data.price || 0,
              prize: data.prize || 0,
              odds: data.odds || 0,
              createdAt: stat.birthtime.toISOString(),
              updatedAt: stat.mtime.toISOString()
            }
          })
          .catch(() => {})
      } else {
        db.adminPosts
          .upsert({
            where: { slug: String(slug) },
            update: {
              title: data.title || '',
              imageurl: data.imageurl || '',
              content
            },
            create: {
              id: String(randomUUID),
              slug: String(slug),
              title: data.title || '',
              imageurl: data.imageurl || '',
              content,
              createdAt: stat.birthtime.toISOString(),
              updatedAt: stat.mtime.toISOString()
            }
          })
          .catch(() => {})
      }
      return {
        id: String(id),
        slug,
        title: data.title || '',
        isPremium: !!data.isPremium,
        deadline: data.deadline || '',
        imageurl: data.imageurl,
        content,
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
        type
      }
    })
  } catch (err) {
    console.error('Admin post meta read error:', err)
    return []
  }
}
