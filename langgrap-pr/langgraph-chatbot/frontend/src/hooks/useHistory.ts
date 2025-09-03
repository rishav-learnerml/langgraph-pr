import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  setSessions,
  setLoading,
  setError,
} from "@/redux/slices/historySlice";
import { useCallback } from "react";
import { BASE_URL,API_ENDPOINTS } from "@/constants/api_endpoints";


export function useHistory() {
  const dispatch = useDispatch();
  const { sessions, loading, error } = useSelector(
    (state: RootState) => state.history
  );

  const fetchSessions = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const res = await fetch(`${BASE_URL}${API_ENDPOINTS.SESSIONS}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      dispatch(setSessions(data));
    } catch (err: any) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  return { sessions, loading, error, fetchSessions };
}
