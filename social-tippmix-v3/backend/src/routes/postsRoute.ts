import express from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import createPost from '../controllers/posts/createPost'
import getPostById from '../controllers/posts/getPostById'
import editPost from '../controllers/posts/editPost'
import deletePost from '../controllers/posts/deletePost'
import getPosts from '../controllers/posts/getPosts'

const router = express.Router()

// Útvonal loggolása DEBUG módban
router.use((req, res, next) => {
  console.log(
    `[userRoutes.ts] Kérés érkezett a következő útvonalra: ${req.method} ${req.originalUrl} (routeren belüli útvonal: ${req.url})`
  )
  next()
})

// Új poszt létrehozása (autentikációval védve)
router.post('/posts', authenticate, createPost)

// Poszt lekérdezése ID alapján (autentikációval védve)
router.get('/posts/:id', authenticate, getPostById)

// Poszt szerkesztése (autentikációval védve)
router.put('/posts/:id', authenticate, editPost)

// Poszt törlése (autentikációval védve)
router.delete('/posts/:id', authenticate, deletePost)

// Posztok listázása (autentikációval védve)
router.get('/posts', authenticate, getPosts)

export default router
