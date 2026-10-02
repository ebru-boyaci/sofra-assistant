import { apiJson, apiJsonAllowErrorStatus } from './http'
import type { ActionStatusResponse, ExecuteRequest, ExecuteResponse } from './types'

export async function executeAction(
  request: ExecuteRequest,
  signal?: AbortSignal,
): Promise<ExecuteResponse> {
  const { status, data } = await apiJsonAllowErrorStatus<unknown>('/api/actions/execute', {
    method: 'POST',
    body: {
      user_id: request.user_id,
      action: request.action,
      params: request.params,
      confirm_token: request.confirm_token,
    },
    signal,
  })
  return { httpStatus: status, body: data }
}

export function getActionStatus(
  confirmToken: string,
  signal?: AbortSignal,
): Promise<ActionStatusResponse> {
  const q = new URLSearchParams({ confirm_token: confirmToken })
  return apiJson<ActionStatusResponse>(`/api/actions/status?${q}`, { signal })
}
