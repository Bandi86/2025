import axiosServer from '../axios/axios-config-server'
import { AdminUser, FetchUsersParams, PaginatedUsersResponse } from '../../types/admin-user'

export async function fetchAdminUsers(
  params: FetchUsersParams = {}
): Promise<PaginatedUsersResponse> {
  // Map frontend params to backend API params
  const query: Record<string, any> = {
    page: params.page,
    pageSize: params.limit,
    search: params.searchQuery,
    sort: params.sortBy,
    role: params.roleFilter,
    status: params.newStatusFilter
  }
  // Remove undefined
  Object.keys(query).forEach((k) => query[k] === undefined && delete query[k])
  const res = await axiosServer.get('/user', { params: query })
  const { users, pagination } = res.data
  return {
    users,
    totalUsers: pagination.total,
    totalPages: Math.ceil(pagination.total / (pagination.pageSize || 10)),
    currentPage: pagination.page
  }
}

export async function fetchAdminUserById(userId: string): Promise<AdminUser | null> {
  try {
    const res = await axiosServer.get(`/user/${userId}`)
    return res.data
  } catch (e) {
    return null
  }
}

export type { AdminUser } from '../../types/admin-user'
