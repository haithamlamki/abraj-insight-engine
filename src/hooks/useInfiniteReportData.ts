import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchPaginatedData, getTableName } from "@/lib/supabaseQueries";

const PAGE_SIZE = 50;

/**
 * Hook for infinite scroll data fetching
 */
export function useInfiniteReportData(reportType: string) {
  const tableName = getTableName(reportType);
  
  return useInfiniteQuery({
    queryKey: [reportType, tableName, 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchPaginatedData(tableName, pageParam, PAGE_SIZE);
    },
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.reduce((sum, page) => sum + page.data.length, 0);
      if (lastPage.count && loadedItems < lastPage.count) {
        return loadedItems;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
}
