import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProducts, type ProductQuery } from "../services/product.service";
import type { Paginated, Product } from "../types";

/** Load a page of products with loading/error/refetch handling. */
export function useProducts(query: ProductQuery = {}, enabled = true) {
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const key = JSON.stringify(query);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts(JSON.parse(key) as ProductQuery);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [enabled, key]);

  const loadMore = useCallback(async () => {
    if (
      !enabled ||
      !data ||
      loading ||
      loadingMoreRef.current ||
      data.pagination.page >= data.pagination.pages
    ) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const query = JSON.parse(key) as ProductQuery;
      const result = await fetchProducts({ ...query, page: data.pagination.page + 1 });
      setData((current) => current
        ? { ...result, items: [...current.items, ...result.items] }
        : result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [data, enabled, key, loading]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, loadingMore, error, refetch: load, loadMore };
}
