import { useCallback, useEffect, useState } from "react";
import { fetchProducts, type ProductQuery } from "../services/product.service";
import type { Paginated, Product } from "../types";

/** Load a page of products with loading/error/refetch handling. */
export function useProducts(query: ProductQuery = {}) {
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(query);

  const load = useCallback(async () => {
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
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
