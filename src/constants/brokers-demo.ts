/** Demo broker hub data — Vantrex-first, TradingView brokers layout. */

export type BrokerAssetFilter = "all" | "crypto" | "forex" | "stocks" | "futures" | "cfds";

export type BrokerCard = {
  id: string;
  name: string;
  tier: "platinum" | "gold";
  badge?: string;
  assets: BrokerAssetFilter[];
  rating: number;
  ratingLabel: string;
  reviews: string;
  accounts: string;
  promo?: string;
  featured?: boolean;
  description: string;
};

export const BROKER_FILTERS: { id: BrokerAssetFilter; labelKey: string }[] = [
  { id: "all", labelKey: "brokersPage.filterAll" },
  { id: "crypto", labelKey: "brokersPage.filterCrypto" },
  { id: "forex", labelKey: "brokersPage.filterForex" },
  { id: "stocks", labelKey: "brokersPage.filterStocks" },
  { id: "futures", labelKey: "brokersPage.filterFutures" },
  { id: "cfds", labelKey: "brokersPage.filterCfds" },
];

export const VELION_BROKER: BrokerCard = {
  id: "vantrex",
  name: "Vantrex Capital",
  tier: "platinum",
  badge: "Featured",
  assets: ["crypto", "forex", "stocks", "futures", "cfds"],
  rating: 4.8,
  ratingLabel: "Excellent",
  reviews: "12.4K",
  accounts: "128K+",
  promo: "Open account — institutional custody included",
  featured: true,
  description: "Trade crypto, FX, indices, and metals with AI strategies, live charts, and segregated client funds.",
};

/** Supporting product cards that showcase Vantrex offerings in the same layout. */
export const VELION_OFFERINGS: BrokerCard[] = [
  {
    id: "vantrex-crypto",
    name: "Vantrex Crypto",
    tier: "platinum",
    assets: ["crypto"],
    rating: 4.8,
    ratingLabel: "Excellent",
    reviews: "8.2K",
    accounts: "96K+",
    promo: "Spot + AI bot strategies",
    description: "BTC, ETH, majors and alts with live pricing and one-click orders.",
  },
  {
    id: "vantrex-forex",
    name: "Vantrex Forex",
    tier: "platinum",
    assets: ["forex", "cfds"],
    rating: 4.7,
    ratingLabel: "Excellent",
    reviews: "6.1K",
    accounts: "74K+",
    promo: "Tight spreads on majors",
    description: "Major and cross pairs with professional chart workspace.",
  },
  {
    id: "vantrex-equities",
    name: "Vantrex Equities",
    tier: "gold",
    assets: ["stocks", "futures"],
    rating: 4.6,
    ratingLabel: "Great",
    reviews: "4.9K",
    accounts: "52K+",
    description: "Index exposure and equity ideas backed by desk research.",
  },
];

export const BROKER_HERO_STAT = {
  orders: "414 065 574",
  labelKey: "brokersPage.ordersLabel",
} as const;
