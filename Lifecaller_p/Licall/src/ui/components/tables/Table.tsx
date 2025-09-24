import React, { useState, useMemo } from 'react'
import { TableColumn, PaginationInfo } from '@/types'
import { Button } from '../Button'

export interface TableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  pagination?: PaginationInfo
  onPageChange?: (page: number) => void
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void
  loading?: boolean
  emptyMessage?: string
  className?: string
  rowClassName?: (row: T, index: number) => string
  onRowClick?: (row: T, index: number) => void
  striped?: boolean
  hoverable?: boolean
}

export function Table<T = any>({
  data,
  columns,
  pagination,
  onPageChange,
  onSort,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  className = '',
  rowClassName,
  onRowClick,
  striped = true,
  hoverable = true,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (column: keyof T) => {
    const newDirection =
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'

    setSortColumn(column)
    setSortDirection(newDirection)
    onSort?.(column, newDirection)
  }

  const getSortIcon = (column: keyof T) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      )
    }

    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )
    }

    return (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const renderPagination = () => {
    if (!pagination || !onPageChange) return null

    const { page, pages, total } = pagination
    const startItem = (page - 1) * pagination.limit + 1
    const endItem = Math.min(page * pagination.limit, total)

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            Próximo
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{startItem}</span> a{' '}
              <span className="font-medium">{endItem}</span> de{' '}
              <span className="font-medium">{total}</span> resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>

              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                let pageNum = i + 1

                if (pages > 7) {
                  if (page <= 4) {
                    pageNum = i + 1
                  } else if (page >= pages - 3) {
                    pageNum = pages - 6 + i
                  } else {
                    pageNum = page - 3 + i
                  }
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium"
                  >
                    {pageNum}
                  </Button>
                )
              })}

              <Button
                variant="ghost"
                size="sm"
                disabled={page >= pages}
                onClick={() => onPageChange(page + 1)}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </nav>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="min-w-full divide-y divide-gray-200">
            <div className="bg-gray-50 px-6 py-3">
              <div className="flex space-x-4">
                {columns.map((_, index) => (
                  <div key={index} className="h-4 bg-gray-300 rounded flex-1"></div>
                ))}
              </div>
            </div>
            <div className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex space-x-4">
                    {columns.map((_, colIndex) => (
                      <div key={colIndex} className="h-4 bg-gray-200 rounded flex-1"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-lg ${className}`}>
      <div className="min-w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`bg-white divide-y divide-gray-200 ${striped ? 'divide-y' : ''}`}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={index}
                  className={`
                    ${striped && index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                    ${hoverable ? 'hover:bg-gray-100' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${rowClassName ? rowClassName(row, index) : ''}
                  `}
                  onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm">
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '-')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  )
}