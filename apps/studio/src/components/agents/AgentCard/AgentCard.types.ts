import type { MarketplaceItem } from '@/lib/marketplace-api';
import type { AgentRecord } from '@/lib/types';

/* ─── Variant / View / Context unions ─── */
export type CardVariant = 'default' | 'active' | 'loading';
export type CardView = 'grid' | 'list';
export type CardContext = 'marketplace' | 'studio';

/* ─── Props (discriminated union on `context`) ─── */
interface BaseCardProps {
  variant?: CardVariant;
  view?: CardView;
  onClick?: () => void;
  className?: string;
}

export interface MarketplaceCardProps extends BaseCardProps {
  context: 'marketplace';
  item: MarketplaceItem;
  agent?: never;
  showDeploy?: never;
}

export interface StudioCardProps extends BaseCardProps {
  context?: 'studio';
  agent: AgentRecord;
  showDeploy?: boolean;
  item?: never;
}

export type AgentCardProps = MarketplaceCardProps | StudioCardProps;
