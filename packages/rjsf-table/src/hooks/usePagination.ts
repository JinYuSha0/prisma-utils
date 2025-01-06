import type { DataGridProps } from "@mui/x-data-grid";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigation, useSearchParams } from "react-router";

type LoaderData<T> = { list: T[]; count: number };

type PaginationProps<T, P> = {
  initialPage?: number;
  defaultPageSize?: number;
};

export function usePagination<T = any, P = any>(props?: PaginationProps<T, P>) {
  const { initialPage = 0, defaultPageSize = 10 } = props ?? {};
  const navigation = useNavigation();
  const loaderData = useLoaderData<LoaderData<P>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const memoRef = useRef<LoaderData<P>>(undefined);
  const [paginationModel, setPaginationModel] = useState({
    page: initialPage,
    pageSize: defaultPageSize,
  });
  const memoData = useMemo<Partial<LoaderData<P>>>(() => {
    if (!loaderData) {
      if (memoRef.current) return memoRef.current;
      return {};
    }
    if (!memoRef.current) {
      memoRef.current = loaderData;
    }
    return loaderData;
  }, [loaderData]);
  useEffect(() => {
    const { page, pageSize } = paginationModel;
    const {
      page: unused_page,
      size: unused_pageSize,
      ...rest
    } = Object.fromEntries(Array.from(searchParams.entries())) ?? {};
    const params = new URLSearchParams();
    if (page) {
      params.set("page", String(page + 1));
      params.set("size", String(pageSize));
    }
    Object.keys(rest).forEach((key) => {
      params.set(key, String(rest[key]));
    });
    setSearchParams(params);
  }, [paginationModel]);
  return {
    loading: navigation.state !== "idle",
    pagination: true,
    paginationMode: "server",
    paginationModel,
    pageSizeOptions: [defaultPageSize],
    rows: (memoData.list ?? []) as unknown as T[],
    rowCount: memoData.count ?? 10,
    initialState: {
      pagination: {
        paginationModel: {
          page: initialPage,
          pageSize: defaultPageSize,
        },
      },
    },
    getRowId: (item: { id: string }) => item.id,
    onPaginationModelChange: setPaginationModel,
  } as Pick<
    DataGridProps,
    | "loading"
    | "pagination"
    | "paginationMode"
    | "paginationModel"
    | "pageSizeOptions"
    | "initialState"
    | "rowCount"
    | "onPaginationModelChange"
  > & { rows: T[] };
}
