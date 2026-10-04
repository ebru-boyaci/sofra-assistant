import type {
  CartSummaryBlock,
  ConfirmationPromptBlock,
  OrderSummaryBlock,
} from '@/domain/ui-spec'
import type {
  ConfirmationStatus,
  ConfirmationView,
} from '@/domain/confirmation'
import { useShellCart, useShellUser } from '@/features/shell'
import { formatTry } from '@/shared/formatMoney'
import { Button, LockIcon, StatusBadge, WalletIcon } from '@/shared/ui'
import styles from './ConfirmationPrompt.module.css'

export type ConfirmationPromptProps = {
  block: ConfirmationPromptBlock
  onConfirm?: (block: ConfirmationPromptBlock) => void
  view?: ConfirmationView | null
  disabled?: boolean
  busy?: boolean
  expired?: boolean
  /** Server blocks from the same turn — displayed as-is, never recalculated. */
  contextBlock?: CartSummaryBlock | OrderSummaryBlock | null
}

const ACTION_LABEL: Record<ConfirmationPromptBlock['action'], string> = {
  place_order: 'Place order',
  cancel_order: 'Cancel order',
  add_tip: 'Add tip',
}

const STATUS_COPY: Record<
  ConfirmationStatus,
  { kicker: string; tone: string }
> = {
  LIVE: { kicker: 'Confirmation required', tone: styles.live },
  CONFIRMING: { kicker: 'Confirming', tone: styles.busy },
  RECONCILING: { kicker: 'Checking status', tone: styles.busy },
  DONE: { kicker: 'Confirmed', tone: styles.done },
  EXPIRED: { kicker: 'Expired', tone: styles.expired },
  SUPERSEDED: { kicker: 'Replaced', tone: styles.replaced },
  REJECTED: { kicker: 'Unavailable', tone: styles.rejected },
}

function bannerSubtitle(
  status: ConfirmationStatus,
  action: ConfirmationPromptBlock['action'],
): string {
  switch (status) {
    case 'LIVE':
      if (action === 'cancel_order') {
        return 'Please confirm you want to cancel this order.'
      }
      if (action === 'add_tip') {
        return 'Please review the tip before we apply it.'
      }
      return 'Please review the details before we place your order.'
    case 'CONFIRMING':
      return 'Sending your confirmation…'
    case 'RECONCILING':
      return 'Checking the latest status with the server…'
    case 'DONE':
      return 'This confirmation is complete.'
    case 'EXPIRED':
      return 'Ask again for a fresh confirmation.'
    case 'SUPERSEDED':
      return 'A newer confirmation replaced this one.'
    case 'REJECTED':
      return 'This confirmation cannot be used.'
  }
}

function confirmButtonLabel(
  status: ConfirmationStatus,
  action: ConfirmationPromptBlock['action'],
  viewLabel: string | undefined,
  isBusy: boolean,
  isExpired: boolean,
  isSuperseded: boolean,
): string {
  if (isBusy) return viewLabel ?? 'Confirming…'
  if (isExpired || status === 'EXPIRED') return 'Expired'
  if (isSuperseded || status === 'SUPERSEDED') return 'Replaced'
  if (status === 'REJECTED') return 'Unavailable'
  if (status !== 'LIVE') return viewLabel ?? 'Confirm'
  if (action === 'place_order') return 'Confirm & place order'
  if (action === 'cancel_order') return 'Confirm cancellation'
  if (action === 'add_tip') return 'Confirm tip'
  return viewLabel ?? 'Confirm'
}

function dismissLabel(
  action: ConfirmationPromptBlock['action'],
  isExpired: boolean,
  isSuperseded: boolean,
): string {
  if (isExpired) return 'Expired'
  if (isSuperseded) return 'Replaced'
  if (action === 'cancel_order') return 'Keep order'
  return 'Not now'
}

function paramTotal(params: Record<string, unknown>): number | null {
  const value = params.total_try
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function ConfirmationPrompt({
  block,
  onConfirm,
  view = null,
  disabled = false,
  busy = false,
  expired = false,
  contextBlock = null,
}: ConfirmationPromptProps) {
  const destructive = block.action === 'cancel_order'
  const status: ConfirmationStatus = view?.status ?? 'LIVE'
  const copy = STATUS_COPY[status]
  const isBusy = view?.busy ?? busy
  const isExpired = view?.expired ?? expired
  const isSuperseded = view?.superseded ?? false
  const inactive =
    disabled ||
    onConfirm == null ||
    (view != null ? !view.canConfirm : isBusy || isExpired || isSuperseded)

  const userQuery = useShellUser()
  const cartQuery = useShellCart()
  const wallet = userQuery.data?.wallet_balance_try

  const cart =
    contextBlock?.type === 'cart_summary' ? contextBlock : null
  const order =
    contextBlock?.type === 'order_summary' ? contextBlock : null

  const paramsRestaurantId =
    typeof block.params.restaurant_id === 'string'
      ? block.params.restaurant_id
      : null
  const restaurantName =
    paramsRestaurantId != null &&
    cartQuery.data?.restaurant_id === paramsRestaurantId
      ? cartQuery.data.restaurant_name
      : (order?.restaurant ?? null)

  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.qty, 0) ?? null
  const totalFromParams = paramTotal(block.params)
  const displayTotal =
    cart?.total_try ?? order?.total_try ?? totalFromParams

  const label = confirmButtonLabel(
    status,
    block.action,
    view?.buttonLabel,
    isBusy,
    isExpired,
    isSuperseded,
  )
  const secondaryLabel = dismissLabel(block.action, isExpired, isSuperseded)
  const showConfirmMark = status === 'LIVE' && !isBusy && !isExpired && !isSuperseded
  const regionLabel = [
    copy.kicker,
    ACTION_LABEL[block.action],
    displayTotal != null ? `total ${formatTry(displayTotal)}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <section
      className={`${styles.root} ${copy.tone}${destructive ? ` ${styles.destructive}` : ''}`}
      data-block="confirmation_prompt"
      data-status={status}
      aria-label={regionLabel}
    >
      <header className={styles.banner}>
        <span className={styles.lockBadge} aria-hidden="true">
          <LockIcon className={styles.lockIcon} />
        </span>
        <div className={styles.bannerCopy}>
          <p className={styles.bannerTitle}>{copy.kicker}</p>
          <p className={styles.bannerSub}>
            {bannerSubtitle(status, block.action)}
          </p>
        </div>
      </header>

      <div className={`${styles.body}${destructive ? ` ${styles.bodyCompact}` : ''}`}>
        {(restaurantName != null ||
          itemCount != null ||
          wallet != null ||
          order != null) && (
          <div className={styles.metaRow}>
            <div className={styles.merchant}>
              {restaurantName != null && (
                <p className={styles.merchantName}>{restaurantName}</p>
              )}
              {itemCount != null && (
                <p className={styles.merchantMeta}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              )}
              {order != null && (
                <p className={styles.merchantMeta}>{order.order_id}</p>
              )}
            </div>

            {order?.status != null && (
              <StatusBadge status={order.status}>
                {order.status.replace(/^./u, (c) =>
                  c.toLocaleUpperCase('en-US'),
                )}
              </StatusBadge>
            )}

            {wallet != null && block.action !== 'cancel_order' && (
              <span
                className={`${styles.walletPill}${status === 'DONE' ? ` ${styles.walletPaid}` : ''}`}
              >
                <WalletIcon className={styles.walletIcon} />
                <span className={styles.walletCopy}>
                  <span className={styles.walletLabel}>
                    {status === 'DONE' ? 'Paid' : 'Pay with wallet'}
                  </span>
                  <span className={styles.walletBalance}>
                    Balance: {formatTry(wallet)}
                  </span>
                </span>
              </span>
            )}
          </div>
        )}

        {cart != null && cart.items.length > 0 && (
          <ul className={styles.lines}>
            {cart.items.map((item, index) => (
              <li key={`${item.name}-${index}`} className={styles.line}>
                <span className={styles.lineName}>
                  {item.qty} × {item.name}
                </span>
                <span className={styles.linePrice}>
                  {formatTry(item.price_try)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {(cart != null || displayTotal != null) && (
          <div
            className={`${styles.totals}${cart == null ? ` ${styles.totalsSolo}` : ''}`}
          >
            {cart?.subtotal_try != null && (
              <div className={styles.row}>
                <span>Subtotal</span>
                <span className={styles.amount}>
                  {formatTry(cart.subtotal_try)}
                </span>
              </div>
            )}
            {cart?.delivery_fee_try != null && (
              <div className={styles.row}>
                <span>Delivery</span>
                <span className={styles.amount}>
                  {cart.delivery_fee_try === 0
                    ? 'Free'
                    : formatTry(cart.delivery_fee_try)}
                </span>
              </div>
            )}
            {displayTotal != null && (
              <div className={`${styles.row} ${styles.totalRow}`}>
                <span>Total</span>
                <span className={styles.amount}>{formatTry(displayTotal)}</span>
              </div>
            )}
          </div>
        )}

        {cart == null && order == null && (
          <p className={styles.summary}>{block.summary}</p>
        )}

        {view?.countdownLabel != null &&
          view.status === 'LIVE' &&
          !isExpired && (
          <p className={styles.countdown}>
            Expires in{' '}
            <span className={styles.countdownValue}>{view.countdownLabel}</span>
          </p>
        )}

        {status !== 'DONE' && (
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              className={styles.cancelBtn}
              disabled={inactive}
            >
              {secondaryLabel}
            </Button>
            <Button
              type="button"
              variant="primary"
              className={styles.confirmBtn}
              disabled={inactive}
              onClick={() => onConfirm?.(block)}
            >
              {showConfirmMark ? (
                <span aria-hidden="true">✓ </span>
              ) : null}
              {label}
            </Button>
          </div>
        )}

        {(isExpired ||
          isSuperseded ||
          (view?.message != null && status !== 'DONE')) && (
          <p className={styles.hint} role="status">
            {view?.message ??
              (isSuperseded
                ? 'Replaced by a newer confirmation.'
                : 'This confirmation expired. Ask again for a fresh one.')}
          </p>
        )}
      </div>
    </section>
  )
}
