/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PrismaFindManyArg {
  where?: Record<string, unknown>
  include?: Record<string, unknown>
  select?: Record<string, boolean> | Record<string, unknown>
  orderBy?: Record<string, unknown> | Record<string, unknown>[]
  skip?: number
  take?: number
  cursor?: Record<string, unknown>
  distinct?: string[]
  [key: string]: unknown
}

export interface PrismaCountArg {
  where?: Record<string, unknown>
  includes?: Record<string, unknown>
  select?: Record<string, boolean> | Record<string, unknown>
  orderBy?: Record<string, unknown> | Record<string, unknown>[]
  skip?: number
  take?: number
  cursor?: Record<string, unknown>
  distinct?: string[]
  [key: string]: unknown
}

export interface PrismaModelDelegate {
  findMany: (args: any) => Promise<unknown[]>
  count: (args: any) => Promise<number>
}

export interface IQueryParams {
  searchTerm?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  include?: string
  includes?: string
  [key: string]: unknown
}

export interface IQueryConfig {
  searchableFields?: string[]
  filterableFields?: string[]
}

export interface PrismaStringFilter {
  contains?: string
  startsWith?: string
  endsWith?: string
  mode?: 'default' | 'insensitive'
  equals?: string
  in?: string[]
  notIn?: string[]
  lt?: string
  lte?: string
  gt?: string
  gte?: string
  not?: PrismaStringFilter | string
  [key: string]: unknown
}

export interface prismaWhereCondition {
  or?: Record<string, unknown>[]
  and?: Record<string, unknown>[]
  not?: Record<string, unknown> | Record<string, unknown>[]
  [key: string]: unknown
}

export interface PrismaNumberFilter {
  equals?: number
  in?: number[]
  notIn?: number[]
  lt?: number
  lte?: number
  gt?: number
  gte?: number
  not?: PrismaNumberFilter | number
}

export interface IQueryResult<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
