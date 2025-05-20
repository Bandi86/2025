'use server'

import axiosServer  from '../axios/axios-config-server'
import { revalidatePath } from 'next/cache'

export interface UpdateUserData {
  username?: string
  email?: string
  role?: string
  status?: string
}

/**
 * Update a user's details
 */
export async function updateUser(userId: string, data: UpdateUserData) {
  try {
    const response = await axiosServer.put(`/user/${userId}`, data)
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/admin/users')
    return { success: true, data: response.data }
  } catch (error) {
    console.error('Error updating user:', error)
    throw new Error('Failed to update user')
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  try {
    await axiosServer.delete(`/user/${userId}`)
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error('Failed to delete user')
  }
}
