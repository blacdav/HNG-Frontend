export const filterOptions = {
  gender: ['', 'male', 'female'],
  age_group: ['', 'child', 'teenager', 'adult', 'senior'],
  sort_by: ['', 'name', 'age', 'country', 'createdAt', 'updatedAt'],
  order: ['', 'asc', 'desc'],
}

export const initialFilters = {
  gender: '',
  age_group: '',
  country: '',
  sort_by: '',
  order: '',
}

export const initialPagination = {
  page: 1,
  limit: 10,
  totalPages: 1,
  totalItems: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}
