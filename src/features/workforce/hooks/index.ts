// Workforce Hooks - Public API

export {
  // Query hooks
  useMarketplaceEmployees,
  useEmployeeDetail,
  useHiredEmployees,
  usePurchasedEmployees,
  useEmployeeCategories,
  useEmployeeReviews,
  useWorkforceStats,
  useIsEmployeeHired,
  // Mutation hooks
  useHireEmployee,
  useToggleEmployeeStatus,
  useSubmitEmployeeReview,
  // Utility hooks
  useInvalidateWorkforceQueries,
  // Types
  type EmployeeDetailData,
  type MarketplaceFilters,
  type EmployeeReview,
  type WorkforceStats,
} from './use-workforce-queries';
