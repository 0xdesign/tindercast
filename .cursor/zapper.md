# ATTENTION LLMs - API Usage Instructions
# This document has all the information needed to get onchain data with the Zapper API.
#
# This document contains:
#
# - Developer Assistant Instructions (data structure notes, component creation, best practices)
# - Autonomous Agent Instructions (access, authentication, query structure, recommendations)
# - Farcaster Onchain Context (used for getting onchain information on Farcaster users)
# - Complete API Schema
#
# You can interact with the Zapper API in two primary ways
#
# 1. Developer Assistant Mode
# When a developer asks you to help build queries or UI components:
# - Follow the UI creation instructions above
# - Use the schema to construct valid GraphQL queries
# - Create React components that properly handle the data structure
# - Ensure all queries match the exact schema requirements
# - Include proper TypeScript types and error handling
#
# 2. Autonomous Agent Mode
# For agents making direct API calls programmatically:
#
# API Endpoint
# ```
# https://public.zapper.xyz/graphql
# ```
#
# For programatic access to the schema and API use instructions
# ```
# curl https://protocol.zapper.xyz/agents.txt
# ```
#
# Authentication
# The API requires a custom header with an API key:
#
# ```typescript
# // For use with Apollo Client
# const authLink = setContext((_, { headers }) => {
#   return {
#     headers: {
#       ...headers,
#       'x-zapper-api-key': API_KEY,
#     },
#   };
# });
#
# // For fetch requests
# const headers = {
#   'Content-Type': 'application/json',
#   'x-zapper-api-key': API_KEY
# };
# ```
#
# Making Requests
# Example query structure:
# ```typescript
# const query = `
#   query PortfolioQuery($addresses: [Address!]!) {
#     portfolio(addresses: $addresses) {
#       totals {
#         total
#         totalByNetwork {
#           network
#           total
#         }
#       }
#     }
#   }
# `;
#
# const variables = {
#   addresses: ['0x...']
# };
# ```
#
# Best Practices for Autonomous Agents:
# 1. Always validate addresses before querying
# 2. Implement proper rate limiting
# 3. Handle API errors gracefully
# 4. Cache responses when appropriate
# 5. Use proper typing for responses
# 6. Monitor query complexity
# 7. Implement retries with exponential backoff
# 8. Verify network values against the Network enum
#
# Response Handling:
# ```typescript
# interface PortfolioResponse {
#   data: {
#     portfolio: {
#       totals: {
#         total: number;
#         totalByNetwork: Array<{
#           network: string;
#           total: number;
#         }>;
#       };
#     };
#   };
# }
#
# // Example error handling
# try {
#   const response = await makeGraphQLRequest(query, variables);
#   if (response.errors) {
#     handleErrors(response.errors);
#   }
#   return response.data;
# } catch (error) {
#   handleNetworkError(error);
# }
# ```
#
# For reference, here's a CURL request going to the Zapper API. Notice the URL, and Auth setup :
# curl --location 'https://public.zapper.xyz/graphql' --header 'Content-Type: application/json' --header 'x-zapper-api-key: YOUR_API_KEY' --data '{"query":"query providerPorfolioQuery($addresses: [Address!]!, $networks: [Network!]!) { portfolio(addresses: $addresses, networks: $networks) { tokenBalances { address network token { balance balanceUSD baseToken { name symbol } } } } }","variables":{"addresses":["0x3d280fde2ddb59323c891cf30995e1862510342f"],"networks":["ETHEREUM_MAINNET"]}}'
#
# In Node.JS, that would look like this (notice the auth setup and URL) :
# const axios = require('axios');
#
# const API_KEY = 'YOUR_API_KEY';
#
# const query = `
#   query providerPorfolioQuery($addresses: [Address!]!, $networks: [Network!]!) {
#     portfolio(addresses: $addresses, networks: $networks) {
#       tokenBalances {
#         address
#         network
#         token {
#           balance
#           balanceUSD
#           baseToken {
#             name
#             symbol
#           }
#         }
#       }
#     }
#   }
# `;
#
# async function fetchPortfolio() {
#   try {
#     const response = await axios({
#       url: 'https://public.zapper.xyz/graphql',
#       method: 'post',
#       headers: {
#         'Content-Type': 'application/json',
#         'x-zapper-api-key': API_KEY,
#       },
#       data: {
#         query,
#         variables: {
#           addresses: ['0x3d280fde2ddb59323c891cf30995e1862510342f'],
#           networks: ['ETHEREUM_MAINNET'],
#         },
#       },
#     });
#
#     if (response.data.errors) {
#       throw new Error(`GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
#     }
#
#     return response.data.data;
#   } catch (error) {
#     console.error('Error fetching portfolio:', error.message);
#     if (error.response) {
#       console.error('Response data:', error.response.data);
#     }
#     throw error;
#   }
# }
#
# // Example usage
# (async () => {
#   try {
#     const portfolio = await fetchPortfolio();
#     console.log(JSON.stringify(portfolio, null, 2));
#   } catch (error) {
#     console.error('Failed to fetch portfolio:', error.message);
#     process.exit(1);
#   }
# })();
#
# ATTENTION LLMs - Farcaster Onchain Context Instructions:
# This endpoints allows you to query portfolio data for any Farcaster user by first resolving their FID (Farcaster ID) or username to their associated addresses, then using those addresses to fetch complete portfolio data. The process requires two sequential queries:
#
# 1. Use the `accounts` query to resolve Farcaster identifiers to addresses:
# ```graphql
# query GetFarcasterAddresses($fids: [Float!], $farcasterUsernames: [String!]) {
#  accounts(fids: $fids, farcasterUsernames: $farcasterUsernames) {
#    farcasterProfile {
#      username
#      fid
#      connectedAddresses
#      custodyAddress
#    }
#  }
# }
# ```
#
# 2. Use the resolved addresses to query the `portfolio` endpoint for complete onchain data. Remember to combine both `connectedAddresses` and `custodyAddress` in your query.
#
# Farcaster Transaction Timeline
# The transaction timeline endpoint provides a chronological feed of onchain activity for any Farcaster user. Like the portfolio endpoint, this requires first resolving the user's addresses through their FID or username. The process involves:
#
# 1. Use the same `accounts` query as above to get the user's addresses
#
# 2. Query the `accountsTimeline` endpoint with the resolved addresses to get transaction history:
# ```graphql
# query GetFarcasterTimeline($addresses: [Address!], $isSigner: Boolean = true) {
#  accountsTimeline(
#    addresses: $addresses
#    isSigner: $isSigner
#    spamFilter: true
#  ) {
#    edges {
#      node {
#        timestamp
#        transaction {
#          hash
#          network
#        }
#        interpretation {
#          processedDescription
#          # Additional transfer details available
#        }
#      }
#    }
#  }
# }
# ```
#
# The timeline provides rich transaction data including human-readable descriptions, token transfers, NFT activities, and interaction details with various protocols and applications.
#
# ATTENTION LLMs - Schema Processing Instructions:
#
# You are about to receive a comprehensive GraphQL schema for blockchain data access.
# This schema includes interfaces, types, and example queries for accessing:
# - Portfolio data (Tokens, App Positions, NFTs)
# - Onchain Token Prices (Current and Historical)
# - Account primitives such as ENS, Farcaster, and Lens.
# - Onchain transaction histories for addresses and apps.
# - Network information
#
# The schema is extensive and includes many nested types. When processing:
# 1. Index the full schema for future reference
# 2. Note required (!) vs optional fields
# 3. Pay attention to enum values, especially Network types
# 4. Understand the relationships between types
# 5. Use example queries as templates for common patterns

interface NFT implements Node {
  id: ID!
  tokenId: String!
  rarityRank: Int @deprecated
  lastSaleEth: BigDecimal @deprecated(reason: "Use lastSale field instead")
  estimatedValueEth: BigDecimal @deprecated(reason: "Use estimatedValue field instead")
  supply: BigDecimal!
  circulatingSupply: BigDecimal!

  """ERC-1155 token can have multiple owners"""
  holdersCount: BigDecimal!
  socialLinks: [SocialLink!]!
  collection: NftCollection!
  metadata: NftMetadata
  traits: [NftTrait!]!
  royaltyInfo(salePrice: String): NftTokenRoyaltyInfo
  transfers(
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    order: NftTransferConnectionOrderInput

    """Deprecated use the args"""
    input: NftTransferConnectionInput
  ): NftTransferConnection
  mediasV2: [NftMediaV2!]!
  mediasV3: NftMedias!
  name: String!
  description: String

  """ERC-1155 token can have multiple owners"""
  holders(
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    last: Int

    """Cursor of an edge (excluded)"""
    before: String
    followedBy: Address

    """Deprecated use the args"""
    input: NftHolderConnectionInput
  ): NftHolderConnection!

  """ERC-1155 token can have multiple owners"""
  holdersFollowedByAddress(input: HoldersFollowedByAddressInput!): [NftHolder!]!

  """Token was hidden by owner"""
  isHidden(input: ByAddressInput!): Boolean!

  """Estimated value of the NFT"""
  estimatedValue: NftValueDenomination

  """Last sale of the NFT"""
  lastSale: NftValueDenomination
}

interface Node {
  id: ID!
}

input NftTransferConnectionOrderInput {
  orderBy: NftTransferSort!
  orderDirection: OrderDirectionOption!
}

enum NftTransferSort {
  TIMESTAMP
}

enum OrderDirectionOption {
  DESC
  ASC
}

input NftTransferConnectionInput {
  offset: Int = 0
  first: Int = 25

  """Cursor of an edge (excluded)"""
  after: String
  search: String
  order: NftTransferConnectionOrderInput
}

union NftMediaV2 = Image | Animation | Audio

input NftHolderConnectionInput {
  first: Int = 25

  """Cursor of an edge (excluded)"""
  after: String

  """Cursor of an edge (excluded) to move backwards"""
  before: String
  search: String
  followedBy: Address
}

input HoldersFollowedByAddressInput {
  address: Address!
}

input ByAddressInput {
  address: Address!
}

interface AbstractToken {
  type: String!
  address: String!
  network: Network!
  balance: String!
  balanceUSD: Float!
  price: Float!
  symbol: String!
  decimals: Float!
}

enum Network {
  ETHEREUM_MAINNET
  POLYGON_MAINNET
  OPTIMISM_MAINNET
  GNOSIS_MAINNET
  BINANCE_SMART_CHAIN_MAINNET
  FANTOM_OPERA_MAINNET
  AVALANCHE_MAINNET
  ARBITRUM_MAINNET
  CELO_MAINNET
  HARMONY_MAINNET
  MOONRIVER_MAINNET
  BITCOIN_MAINNET
  CRONOS_MAINNET
  AURORA_MAINNET
  EVMOS_MAINNET
  BASE_MAINNET
  BLAST_MAINNET
  SOLANA_MAINNET
  DEGEN_MAINNET
  MODE_MAINNET
  ZKSYNC_MAINNET
  MANTLE_MAINNET
  SCROLL_MAINNET
  MOONBEAM_MAINNET
  LINEA_MAINNET
  ZORA_MAINNET
  METIS_MAINNET
  WORLDCHAIN_MAINNET
  SHAPE_MAINNET
  OPBNB_MAINNET
  APECHAIN_MAINNET
  MORPH_MAINNET
  BOB_MAINNET
  UNICHAIN_MAINNET
  CORE_MAINNET
  RACE_MAINNET
  FRAX_MAINNET
  B2_MAINNET
  TAIKO_MAINNET
  CYBER_MAINNET
  ZERO_MAINNET
  IMMUTABLEX_MAINNET
  ARBITRUM_NOVA_MAINNET
  XAI_MAINNET
  REDSTONE_MAINNET
  POLYGON_ZKEVM_MAINNET
  FLOW_MAINNET
  INK_MAINNET
  SONIC_MAINNET
  SONEIUM_MAINNET
  ABSTRACT_MAINNET
  ROOTSTOCK_MAINNET
  BERACHAIN_MAINNET
  STORY_MAINNET
  RONIN_MAINNET
  LENS_MAINNET
}

interface AbstractDisplayItem {
  type: String!
}

interface AbstractPositionBalance {
  type: String!
  key: String
  address: String!
  network: Network!
  appId: String!
  groupId: String!
  groupLabel: String
  displayProps: DisplayProps
}

interface AbstractMetadataItem {
  type: String!
}

interface MarketData {
  type: MarketDataType!
  isExchangeable: Boolean!
  price(currency: Currency = USD): Float
}

enum MarketDataType {
  COIN_GECKO
  JUPITER
  ONCHAIN
}

enum Currency {
  USD
  EUR
  GBP
  CAD
  CNY
  KRW
  JPY
  RUB
  AUD
  NZD
  CHF
  SGD
  INR
  BRL
  ETH
  BTC
  HKD
  SEK
  NOK
  MXN
  TRY
}

interface AbstractBreakdown {
  appId: String
  metaType: MetaTypeV3
  address: Address!
  network: Network!
  balanceUSD: Float!
  type: BreakdownType!
  breakdown: [AbstractBreakdown!]!
}

enum MetaTypeV3 {
  WALLET
  SUPPLIED
  BORROWED
  CLAIMABLE
  VESTING
  LOCKED
  NFT
}

enum BreakdownType {
  POSITION
  TOKEN
  NON_FUNGIBLE_TOKEN
}

interface AbstractPosition {
  appId: String!
  type: ContractType!
  network: Network!
}

enum ContractType {
  POSITION
  BASE_TOKEN
  APP_TOKEN
  NON_FUNGIBLE_TOKEN
}

interface AbstractAppView {
  label: String!
  type: AppViewType!
  positionType: String
}

enum AppViewType {
  list
  split
  dropdown
}

interface CollectionEvent implements Node {
  id: ID!
  timestamp: Int!
  txHash: String!
  intention: String
  event: CollectionEventOld! @deprecated(reason: "Use `CollectionEvent` instead")
  token: NftToken!
  fromAccount: Account!
  toAccount: Account!
}

union CollectionEventOld = EventSale | EventTransfer

type EventSale {
  timestamp: Int!
  txHash: String!
  payments: [NftPayment!]!
}

type EventTransfer {
  timestamp: Int!
  txHash: String!
}

interface NftCollectionTraitGroupBase implements Node {
  id: ID!
  name: String!
  display: NftTraitDisplayType!
}

enum NftTraitDisplayType {
  STRING
  NUMBER
  BOOST_NUMBER
  BOOST_PERCENTAGE
  DATE
}

type PageInfo {
  hasPreviousPage: Boolean!
  hasNextPage: Boolean!
  startCursor: String
  endCursor: String
}

type Animation {
  originalUri: String!

  """File size in bytes. Return `null` if unknown."""
  fileSize: Int

  """
  File mime type from https://www.iana.org/assignments/media-types/media-types.xhtml
  """
  mimeType: String
  url: String! @deprecated(reason: "Use `original` instead.")

  """Returns a link of the original animation"""
  original: String!
}

type AnimationEdge {
  node: Animation!
  cursor: String!
}

type AnimationConnection {
  edges: [AnimationEdge!]!
  pageInfo: PageInfo!
}

type Audio {
  originalUri: String!
  original: String!

  """File size in bytes. Return `null` if unknown."""
  fileSize: Int

  """
  File mime type from https://www.iana.org/assignments/media-types/media-types.xhtml
  """
  mimeType: String
}

type AudioEdge {
  node: Audio!
  cursor: String!
}

type AudioConnection {
  edges: [AudioEdge!]!
  pageInfo: PageInfo!
}

type Image {
  originalUri: String!

  """See https://blurha.sh/"""
  blurhash: String

  """Primary color hex"""
  predominantColor: String
  width: Int
  height: Int

  """File size in bytes. Return `null` if unknown."""
  fileSize: Int

  """
  File mime type from https://www.iana.org/assignments/media-types/media-types.xhtml
  """
  mimeType: String
  url(
    """Deprecated, use `width` or the predefined field sizes"""
    input: ImageUrlInput
    width: Int
    format: ImageFormat
  ): String!

  """Returns a link of the image 100px wide"""
  thumbnail: String!

  """Returns a link of the image 250px wide"""
  medium: String!

  """Returns a link of the image 500px wide"""
  large: String!

  """Returns a link of the original image"""
  original: String!
}

input ImageUrlInput {
  size: ImageSize!
}

enum ImageSize {
  THUMBNAIL
  MEDIUM
  LARGE
  ORIGINAL
}

enum ImageFormat {
  webp
  avif
  json
}

type ImageEdge {
  node: Image!
  cursor: String!
}

type ImageConnection {
  edges: [ImageEdge!]!
  pageInfo: PageInfo!
}

type NftMedias {
  images(
    excludeFormats: [NftMediaExcludeFormat!]
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
  ): ImageConnection!
  animations(
    excludeFormats: [NftMediaExcludeFormat!]
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
  ): AnimationConnection!
  audios(
    excludeFormats: [NftMediaExcludeFormat!]
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
  ): AudioConnection!
}

enum NftMediaExcludeFormat {
  SVG
  GIF
  AVIF
  WEBM
  HTML
}

type NftAvatar {
  isCurrentlyHeld: Boolean!
  nft: NftToken!
}

type NftTokenRoyaltyInfo {
  receiver: String!
  amount: String!
}

type NftDenomination {
  network: String!
  address: String!
  symbol: String!
  imageUrl: String
}

type NftValueDenomination {
  valueUsd: Float!
  valueWithDenomination: Float!
  denomination: NftDenomination!
}

type NftToken implements NFT & Node {
  id: ID!
  tokenId: String!
  rarityRank: Int @deprecated
  lastSaleEth: BigDecimal @deprecated(reason: "Use lastSale field instead")
  estimatedValueEth: BigDecimal @deprecated(reason: "Use estimatedValue field instead")
  supply: BigDecimal!
  circulatingSupply: BigDecimal!

  """ERC-1155 token can have multiple owners"""
  holdersCount: BigDecimal!
  socialLinks: [SocialLink!]!
  collection: NftCollection!
  metadata: NftMetadata
  traits: [NftTrait!]!
  royaltyInfo(salePrice: String): NftTokenRoyaltyInfo
  transfers(
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    order: NftTransferConnectionOrderInput

    """Deprecated use the args"""
    input: NftTransferConnectionInput
  ): NftTransferConnection
  mediasV2: [NftMediaV2!]!
  mediasV3: NftMedias!
  name: String!
  description: String

  """ERC-1155 token can have multiple owners"""
  holders(
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    last: Int

    """Cursor of an edge (excluded)"""
    before: String
    followedBy: Address

    """Deprecated use the args"""
    input: NftHolderConnectionInput
  ): NftHolderConnection!

  """ERC-1155 token can have multiple owners"""
  holdersFollowedByAddress(input: HoldersFollowedByAddressInput!): [NftHolder!]!

  """Token was hidden by owner"""
  isHidden(input: ByAddressInput!): Boolean!

  """Estimated value of the NFT"""
  estimatedValue: NftValueDenomination

  """Last sale of the NFT"""
  lastSale: NftValueDenomination
}

type NftTokenErc721 implements NFT & Node {
  id: ID!
  tokenId: String!
  rarityRank: Int @deprecated
  lastSaleEth: BigDecimal @deprecated(reason: "Use lastSale field instead")
  estimatedValueEth: BigDecimal @deprecated(reason: "Use estimatedValue field instead")
  supply: BigDecimal!
  circulatingSupply: BigDecimal!

  """ERC-1155 token can have multiple owners"""
  holdersCount: BigDecimal!
  socialLinks: [SocialLink!]!
  collection: NftCollection!
  metadata: NftMetadata
  traits: [NftTrait!]!
  royaltyInfo(salePrice: String): NftTokenRoyaltyInfo
  transfers(
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    order: NftTransferConnectionOrderInput

    """Deprecated use the args"""
    input: NftTransferConnectionInput
  ): NftTransferConnection
  mediasV2: [NftMediaV2!]!
  mediasV3: NftMedias!
  name: String!
  description: String

  """ERC-1155 token can have multiple owners"""
  holders(
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    last: Int

    """Cursor of an edge (excluded)"""
    before: String
    followedBy: Address

    """Deprecated use the args"""
    input: NftHolderConnectionInput
  ): NftHolderConnection!

  """ERC-1155 token can have multiple owners"""
  holdersFollowedByAddress(input: HoldersFollowedByAddressInput!): [NftHolder!]!

  """Token was hidden by owner"""
  isHidden(input: ByAddressInput!): Boolean!

  """Estimated value of the NFT"""
  estimatedValue: NftValueDenomination

  """Last sale of the NFT"""
  lastSale: NftValueDenomination
}

type NftTokenErc1155 implements NFT & Node {
  id: ID!
  tokenId: String!
  rarityRank: Int @deprecated
  lastSaleEth: BigDecimal @deprecated(reason: "Use lastSale field instead")
  estimatedValueEth: BigDecimal @deprecated(reason: "Use estimatedValue field instead")
  supply: BigDecimal!
  circulatingSupply: BigDecimal!

  """ERC-1155 token can have multiple owners"""
  holdersCount: BigDecimal!
  socialLinks: [SocialLink!]!
  collection: NftCollection!
  metadata: NftMetadata
  traits: [NftTrait!]!
  royaltyInfo(salePrice: String): NftTokenRoyaltyInfo
  transfers(
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    order: NftTransferConnectionOrderInput

    """Deprecated use the args"""
    input: NftTransferConnectionInput
  ): NftTransferConnection
  mediasV2: [NftMediaV2!]!
  mediasV3: NftMedias!
  name: String!
  description: String

  """ERC-1155 token can have multiple owners"""
  holders(
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    last: Int

    """Cursor of an edge (excluded)"""
    before: String
    followedBy: Address

    """Deprecated use the args"""
    input: NftHolderConnectionInput
  ): NftHolderConnection!

  """ERC-1155 token can have multiple owners"""
  holdersFollowedByAddress(input: HoldersFollowedByAddressInput!): [NftHolder!]!

  """Token was hidden by owner"""
  isHidden(input: ByAddressInput!): Boolean!

  """Estimated value of the NFT"""
  estimatedValue: NftValueDenomination

  """Last sale of the NFT"""
  lastSale: NftValueDenomination
}

type NftTokenEdge {
  node: NftToken!
  cursor: String!
}

type NftTokenConnection {
  edges: [NftTokenEdge!]!
  pageInfo: PageInfo!
}

type EnsMetadata {
  avatar: EnsAvatar
  description: String
  github: String
  twitter: String
  email: String
  website: String
}

union EnsAvatar = NftToken | NftTokenErc721 | NftTokenErc1155 | AvatarUrl

type AvatarUrl {
  url: String!
  mimeType: String
}

type EnsRecord {
  name: Ens!
  metadata: EnsMetadata!
}

type Account implements Node {
  id: ID!
  address: Address!
  displayName: DisplayName!
  avatar(opepenSize: AllowedOpepenSizes! = XS): AccountAvatar!
  description: Description
  socialLinks: [AccountSocialLink!]!
  ens: String @deprecated(reason: "Use ensRecord instead")
  kind: String!
  contract: Contract
  metadata: [AddressMetadataObject!]!
  isContract: Boolean!
  nftAvatar: NftAvatar @deprecated(reason: "Use avatar instead")
  opepenURI: String!
  blockiesURI: String!
  isFollowedBy(address: Address!): Boolean!
  followStats: FollowerStats
  followers(first: Int, after: String): FollowerConnection!
  following(first: Int, after: String): FollowerConnection!
  ensRecord: EnsRecord
  basename: String
  lensProfile: LensProfile
  farcasterProfile: FarcasterProfile
  label: String
}

enum AllowedOpepenSizes {
  XXS
  XS
  S
  M
  L
  XL
}

type DisplayName {
  value: String!
  source: AccountDisplayNameSource!
}

enum AccountDisplayNameSource {
  ENS
  BASENAME
  LENS
  FARCASTER
  LABEL
  ADDRESS
}

type Description {
  value: String!
  source: AccountDescriptionSource!
}

enum AccountDescriptionSource {
  ENS
  LENS
  FARCASTER
}

type AccountSocialLink {
  url: String!
  name: AccountSocialLinkName!
  source: AccountSocialLinkSource!
}

enum AccountSocialLinkName {
  WEBSITE
  TWITTER
  GITHUB
  EMAIL
  HEY
  WARPCAST
}

enum AccountSocialLinkSource {
  ENS
  LENS
  FARCASTER
}

type FollowerStats {
  followerCount: Int!
  followingCount: Int!
}

type AccountEdge {
  node: Account!
  cursor: String!
}

type FollowerConnection {
  edges: [AccountEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type AccountAvatar {
  value: Avatar!
  source: AccountAvatarSource!
}

union Avatar = NftToken | NftTokenErc721 | NftTokenErc1155 | NftAvatar | AvatarUrl

enum AccountAvatarSource {
  ZAPPER
  ENS
  LENS
  FARCASTER
  OPEPENS
  BLOCKIES
}

type Badge {
  tokenId: Int!
  badgeName: String!
  claimed: Boolean!
  badgeNetwork: Network!
  userAddress: Address!
}

type SocialStats {
  followersCount: Int!
  followedCount: Int!
  addedFollowersCountLast24Hours: Int!
}

"""Deprecated: Use `Account` instead"""
type User {
  address: Address!
  ens: String
  avatar: NftToken
  blockiesURI: String!
  blockieUrl: String
  level: Int!
  levelUpXpRequired: Int!
  xp: Int!
  zp: Int!
  pendingZp: Int!
  avatarURI: String
  socialStats: SocialStats!
  badges: [Badge!]!
  followedBy: Boolean!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PaginatedUser {
  edges: [UserEdge!]!
  totalCount: Int!
}

type ActivityFeedApp {
  slug: String!
  name: String!
  url: String
  tags: [String!]!
  imgUrl: String!
  imageUrl: String! @deprecated(reason: "Use imgUrl instead")
  description: String!
  app: App!
}

type NetworkMetadata {
  chainId: Float!
  networkType: NetworkIndexerType!
  name: String!
  url: String!
}

enum NetworkIndexerType {
  EIP_155
  LAYER_ZERO
  WORMHOLE
}

type SocialLink {
  name: String!
  label: String!
  url: String!
  logoUrl: String!
}

type NftCollection implements Node {
  id: ID!
  address: Address!
  subCollectionIdentifier: String!
  name: String!
  displayName: String
  symbol: String!
  description: String!
  network: Network!
  deployer: Address!
  owner: Address!
  deployedAt: Timestamp
  ownedAt: Timestamp
  socialLinks: [SocialLink!]!

  """Image of the collection as an horizontal rectangle"""
  bannerImageUrl: String @deprecated(reason: "Use `medias.banner`")

  """Image of the collection as a vertical rectangle"""
  cardImageUrl: String @deprecated(reason: "Use `medias.card`")
  supply: BigDecimal!
  totalSupply: BigDecimal!
  floorPriceEth: BigDecimal @deprecated(reason: "Use floorPrice instead")
  floorPriceSourceMarketPlace: NftDataSourceMarketplace
  topOfferPriceEth: BigDecimal @deprecated(reason: "Use topOfferPrice instead")
  topOfferSourceMarketPlace: NftDataSourceMarketplace
  holdersCount: BigDecimal!
  nftStandard: NftStandard!

  """Disabled collection will return `null`"""
  disabled: Boolean!
  type: NftCollectionType!
  openseaId: String
  spamScore: BigDecimal
  stats: NftCollectionStats!
  isApproved(spenderAddress: Address!, ownerAddress: Address!): Boolean!
  approvalTransaction(spenderAddress: Address!, ownerAddress: Address!): TransactionConfig!
  revokeApprovalTransaction(spenderAddress: Address!, ownerAddress: Address!): TransactionConfig!

  """Floor price of the NFT collection"""
  floorPrice: NftValueDenomination

  """Top offer of the NFT collection"""
  topOfferPrice: NftValueDenomination
  nfts(
    first: Int = 25

    """Cursor of an edge (excluded)"""
    after: String
    tokenIds: [String!]
    owners: [Address!]
    traitIds: [String!]
    order: NftTokenConnectionOrderInput
    traits: [NftTokenTraitInput!]

    """Deprecated, use the args"""
    input: NftConnectionInput
  ): NftTokenConnection!
  events(
    first: Int! = 25

    """Cursor of an edge (excluded)"""
    after: String
    tokenIds: [String!]
    owners: [Address!]
    followedBy: Address
    traits: [NftTokenTraitInput!]
    period: NftPaymentStatsPeriod

    """Deprecated: use the args"""
    input: CollectionEventConnectionInput
  ): CollectionEventConnection!
  traitGroups: [NftCollectionTraitGroupBase!]!
  traitGroupValues(input: NftCollectionTraitValuesArgs!): NftCollectionTraitValueConnection!
  traits: [NftCollectionTraitType!]!
  holders(input: NftHolderConnectionInput, first: Int, after: String): PaginatedNftHolder!
  medias: NftCollectionMedias!
  circulatingSupply: BigDecimal!
  totalCirculatingSupply: BigDecimal!
  groups: [NftCollectionGroup!]!
  marketCap: BigDecimal
}

"""
`Date` type as integer. Type represents date and time as number of milliseconds from start of UNIX epoch.
"""
scalar Timestamp

enum NftDataSourceMarketplace {
  OPENSEA
  X2Y2
  LOOKSRARE
  RESERVOIR
  BLUR
}

enum NftStandard {
  ERC_721
  ERC_1155
}

enum NftCollectionType {
  GENERAL
  BRIDGED
  BADGE
  POAP
  TICKET
  ACCOUNT_BOUND
  WRITING
  GAMING
  ART_BLOCKS
  BRAIN_DROPS
  LENS_PROFILE
  LENS_FOLLOW
  LENS_COLLECT
  ZORA_ERC721
  ZORA_ERC1155
  BLUEPRINT
}

input NftTokenConnectionOrderInput {
  orderBy: NftTokenSort!
  orderDirection: OrderDirectionOption = ASC
}

enum NftTokenSort {
  RARITY_RANK
  LAST_SALE_ETH
  ESTIMATED_VALUE_ETH
}

input NftTokenTraitInput {
  type: String!
  value: String!
}

input NftConnectionInput {
  first: Int = 25

  """Cursor of an edge (excluded)"""
  after: String

  """Cursor of an edge (excluded) to move backwards"""
  before: String
  search: String
  tokenIds: [String!]
  owners: [Address!]
  traitIds: [String!]
  order: NftTokenConnectionOrderInput
  traits: [NftTokenTraitInput!]
}

enum NftPaymentStatsPeriod {
  Week
  Month
  Quarter
}

input CollectionEventConnectionInput {
  first: Int = 25

  """Cursor of an edge (excluded)"""
  after: String

  """Cursor of an edge (excluded) to move backwards"""
  before: String
  search: String
  tokenIds: [String!]
  owners: [Address!]
  followedBy: Address
  traits: [NftTokenTraitInput!]
  period: NftPaymentStatsPeriod
}

input NftCollectionTraitValuesArgs {
  first: Int = 10

  """Cursor of an edge (excluded)"""
  after: String
  traitName: String!
  search: String
}

union NftCollectionTraitType = NftCollectionTraitString | NftCollectionTraitNumeric

type NftCollectionTraitString {
  value: String!
  values: [NftCollectionTraitValue!]
}

type NftCollectionTraitNumeric {
  value: String!
  display: NftTraitDisplayType!
  min: Float
  max: Float
}

type NftCollectionMedias {
  """Image of the collection as an horizontal rectangle"""
  banner(excludeFormats: [NftMediaExcludeFormat!]): Image

  """Image of the collection as a vertical rectangle"""
  card(excludeFormats: [NftMediaExcludeFormat!]): Image

  """Image of the collection as a square"""
  logo(excludeFormats: [NftMediaExcludeFormat!]): Image
}

type NftCollectionEdge {
  node: NftCollection!
  cursor: String!
}

type NftCollectionsForOwnersCollectionsConnection {
  edges: [NftCollectionEdge!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type NFTDisplayItem {
  type: String!
  network: Network!
  collectionAddress: Address!
  tokenId: String!
  quantity: Float
  nftToken: NftToken
  isMint: Boolean
  isBurn: Boolean
  nftCollection: NftCollection
}

type AppFungibleToken {
  address: Address!
  network: Network!
  price: BigDecimal
  symbol: String!
  decimals: Float!
  label: String!
  imageUrls: [String!]!
  appImageUrl: String!
  isDebt: Boolean!
}

type TokenDisplayItem {
  type: String!
  network: Network!
  tokenAddress: Address!
  amountRaw: String!
  id: ID!
  token: FunginbleToken
  tokenV2: FungibleToken
}

union FunginbleToken = AppFungibleToken | BaseFungibleToken

type BaseFungibleToken {
  address: Address!
  network: Network!
  price: BigDecimal
  symbol: String!
  decimals: Float!
  imageUrl: String
}

type ActivityInterpretation {
  description: String!
  descriptionDisplayItems: [ActivityFeedDisplayItem!]!
  inboundAttachments: [ActivityFeedDisplayItem!]!
  outboundAttachments: [ActivityFeedDisplayItem!]!
  inboundAttachmentsConnection(first: Int, after: String, attachmentTypes: [SupportedEventDisplayItem!]): AttachmentConnection!
  outboundAttachmentsConnection(first: Int, after: String, attachmentTypes: [SupportedEventDisplayItem!]): AttachmentConnection!
  processedDescription: String!
}

union ActivityFeedDisplayItem = ActorDisplayItem | AppDisplayItem | AppContractNetworkDisplayItem | ChatChannelDisplayItem | CompositeDisplayItem | ImageDisplayItem | NetworkDisplayItem | NFTCollectionDisplayItem | NFTDisplayItem | NumberDisplayItem | ProposalDisplayItemObject | StringDisplayItem | TokenContractDisplayItem | TokenDisplayItem | TransactionDisplayItem

type ActorDisplayItem {
  type: String!
  address: Address!
  actor: Actor! @deprecated(reason: "Use `account` instead")
  actorV2: ActorV2! @deprecated(reason: "Use `account` instead")
  account: Account!
}

union Actor = User | Wallet | Contract

type Wallet {
  address: Address!
  ens: String
}

union ActorV2 = Account | Contract

type AppDisplayItem {
  type: String!
  id: ID!
  appId: String! @deprecated(reason: "Use app.slug instead")
  network: Network!
  app: ActivityFeedApp
}

type AppContractNetworkDisplayItem {
  type: String!
  address: String!
  network: Network!
  app: ActivityFeedApp
}

type ChatChannelDisplayItem {
  type: String!
  channelId: String!
}

type CompositeDisplayItem {
  type: String!
  itemCount: Int!
  items(first: Int = 1000): [ActivityFeedLeafDisplayItem!]!
}

union ActivityFeedLeafDisplayItem = ActorDisplayItem | AppDisplayItem | AppContractNetworkDisplayItem | ChatChannelDisplayItem | ImageDisplayItem | NetworkDisplayItem | NFTCollectionDisplayItem | NFTDisplayItem | NumberDisplayItem | ProposalDisplayItemObject | StringDisplayItem | TokenContractDisplayItem | TokenDisplayItem | TransactionDisplayItem

type ImageDisplayItem {
  type: String!
  url: String!
}

type NetworkDisplayItem {
  type: String!
  chainId: Float!
  networkType: NetworkIndexerType!
  networkMetadata: NetworkMetadata
}

type NFTCollectionDisplayItem {
  type: String!
  network: Network!
  collectionAddress: Address!
  quantity: Float
  nftCollection: NftCollection
}

type NumberDisplayItem {
  type: String!
  value: Float! @deprecated(reason: "use numberValue instead")
  numberValue: Float!
}

type ProposalDisplayItemObject {
  type: String!
  id: ID!
  network: Network!
  platform: String!
}

type StringDisplayItem {
  type: String!
  value: String! @deprecated(reason: "use stringValue instead")
  stringValue: String!
}

type TokenContractDisplayItem {
  type: String!
  network: Network!
  address: Address!
  token: FunginbleToken
}

type TransactionDisplayItem {
  type: String!
  event: ActivityEvent!
}

enum SupportedEventDisplayItem {
  Actor
  App
  AppContractNetwork
  ChatChannel
  Composite
  Image
  Network
  Nft
  NftCollection
  Number
  Proposal
  String
  Token
  TokenContract
  Transaction
}

type ActivityFeedDisplayItemEdge {
  node: ActivityFeedDisplayItem!
  cursor: String!
}

type AttachmentConnection {
  edges: [ActivityFeedDisplayItemEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
  nftCount: Int!
}

type ActivityEventInterpreter {
  id: String!
  priority: Int!
  category: ActivityEventTopic!
  app: ActivityFeedApp
  isCodeless: Boolean!
}

enum ActivityEventTopic {
  Defi
  Swaps
  NftMints
  NftSales
  NftFi
  NftBidding
  Social
  Bridge
  Gaming
  Governance
  Fundraising
  Art
  Metaverse
  None
  Nft
  All
  Unknown
}

type OnChainTransactionReceipt {
  contractAddress: Address
  gasUsed: Int!
  status: Int!
}

type DecodedInput {
  signature: String!
  data: [String!]!
}

type DecodedInputDataValue {
  name: String!
  value: String!
}

type DecodedInputV2 {
  signature: String!
  data: [DecodedInputDataValue!]!
}

type OnChainTransactionLog {
  address: String!
  data: String!
  topics: [String!]!
  logIndex: Int!
  transactionIndex: Int!
}

type OnChainTransaction {
  network: Network!
  hash: String!
  nonce: Int!
  blockHash: String!
  blockNumber: Int!
  value: String!
  gasPrice: String!
  gas: Int!
  input: String!
  from: Address!
  fromUser: Account
  to: Address
  timestamp: Timestamp!
  receipt: OnChainTransactionReceipt
  logs: [OnChainTransactionLog!]!
  link: String!
  fromEns: String
  transactionFee: Float!
  transactionPrice: Float!
  toUser: Account
  decodedInput: DecodedInput
  decodedInputV2: DecodedInputV2
}

type ActivityPerspective {
  type: String!
  value: String!
}

type ActivityEvent {
  key: String!
  network: Network!
  source: String!
  eventType: String!
  isAbiAvailable: Boolean!
  isEditable: Boolean!
  interpreterId: String
  interpreter: ActivityEventInterpreter
  timestamp: Timestamp!
  perspective: ActivityPerspective!
  interpretation: ActivityInterpretation!
  transaction: OnChainTransaction
  similarEventCount: Int
  app: ActivityFeedApp
  accountDeltasV2(first: Int = 6, after: String): ActivityAccountDeltaConnection!
  perspectiveDelta: ActivityAccountDelta
  sigHash: String
}

type ActivityEventEdge {
  node: ActivityEvent!
  cursor: String!
}

type ActivityEventConnection {
  edges: [ActivityEventEdge!]!
  pageInfo: PageInfo!
}

type AccountTransactionHistoryEntry {
  subject: String!
  hash: String!
  network: Network!
  blockTimestamp: Timestamp!
  fromAddress: String!
  toAddress: String
  methodSighash: String
}

type AccountTransactionHistoryEdge {
  node: AccountTransactionHistoryEntry!
  cursor: String!
}

type TimelineEventV2 implements Node {
  id: ID!
  hash: String!
  eventHash: String!
  network: Network!
  index: Int!
  fromAddress: Account!
  toAddress: Account
  methodSighash: String!
  timestamp: Timestamp!
  interpreterId: String!
  value: String!
  rawInput: String!
  gas: String!
  networkObject: NetworkObject
  app: App
  transaction: OnChainTransaction!
  interpretation: ActivityInterpretation!
  perspective: String!
  perspectiveDelta: ActivityAccountDelta
  methodSignature: String
  deltas(first: Int = 6, after: String): ActivityAccountDeltaConnection!
}

type ChatMessage implements Node {
  id: ID!
  channelId: ID!
  fromAddress: String!
  createdAt: Timestamp!
  isConsecutive: Boolean!
  content: ChatMessageContent!
}

union ChatMessageContent = ChatMessageTextContent | ChatMessageNewMemberContent | ChatMessageGifContent | ChatMessageReplyContent

type ChatMessageTextContent {
  type: String!
  text: String!
}

type ChatMessageNewMemberContent {
  type: String!
  initialShares: Int!
}

type ChatMessageGifContent {
  type: String!
  giphyId: String!
}

type ChatMessageReplyContent {
  type: String!
  text: String!
}

type ChatMessageEdge {
  node: ChatMessage!
  cursor: String!
}

type TokenNetworkAndAddress {
  network: Network!
  address: String!
}

type SupportedTokenHolder {
  holderAddress: String!
  value: String!
  percentileShare: Float!
  account: Account!
}

type SupportedTokenHolderEdge {
  node: SupportedTokenHolder!
  cursor: String!
}

type PaginatedSupportedTokenHolders {
  edges: [SupportedTokenHolderEdge!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type SupportedBaseToken implements Node {
  id: ID!
  address: String!
  network: Network!
  label: String
  name: String!
  decimals: Float!
  imgUrl: String!
  symbol: String!
  holders: PaginatedSupportedTokenHolders
  holdersFollowedByAddress: [SupportedTokenHolder!]!
  coingeckoID: String
  canExchange: Boolean
  verified: Boolean!
  hide: Boolean
  totalSupply: String
  price: Float!
  dailyVolume: Float
  createdAt: Timestamp!
  updatedAt: Timestamp!
}

type GroupedSupportedBaseToken {
  uniqKey: String!
  name: String!
  symbol: String!
  coingeckoID: String
  imgUrl: String!
  newtworksAndAddresses: [TokenNetworkAndAddress!]!
  canExchange: Boolean
  hide: Boolean
}

type SupportedBaseTokenHistoricData {
  price1HourAgo: Float!
  price24HoursAgo: Float!
  price7DaysAgo: Float!
  price30DaysAgo: Float!
  volume1HourAgo: Float!
  volume24HoursAgo: Float!
  volume7DaysAgo: Float!
  volume30DaysAgo: Float!
  priceChange1Hour: Float
  priceChange24Hours: Float
  priceChange7Days: Float
  priceChange30Days: Float
  volumeChange1Hour: Float
  volumeChange24Hours: Float
  volumeChange7Days: Float
  volumeChange30Days: Float
}

type TrendingTokenEdge {
  node: SupportedBaseToken!
  cursor: String!
  historicData: SupportedBaseTokenHistoricData!
}

type DisplayItemWrapper {
  label: AbstractDisplayItem!
  value: AbstractDisplayItem!
}

type DisplayItemString implements AbstractDisplayItem {
  type: String!
  valueString: String!
}

type DisplayItemNumber implements AbstractDisplayItem {
  type: String!
  valueNumber: Float!
}

type DisplayItemDollar implements AbstractDisplayItem {
  type: String!
  valueDollar: Float!
}

type DisplayItemPercentage implements AbstractDisplayItem {
  type: String!
  valuePct: Float!
}

type DisplayItemTranslation implements AbstractDisplayItem {
  type: String!
  valueTranslation: String!
}

type StatsItem {
  label: String!
  value: AbstractDisplayItem!
}

type DisplayProps {
  label: String!
  secondaryLabel: AbstractDisplayItem
  tertiaryLabel: AbstractDisplayItem
  images: [String!]!
  statsItems: [StatsItem!]
  balanceDisplayMode: BalanceDisplayMode
}

enum BalanceDisplayMode {
  DEFAULT
  UNDERLYING
}

type TokenWithMetaType {
  metaType: MetaTypeV3
  token: AbstractToken!
}

type ContractPositionBalance implements AbstractPositionBalance {
  type: String!
  key: String
  address: String!
  network: Network!
  appId: String!
  groupId: String!
  groupLabel: String
  displayProps: DisplayProps
  balanceUSD: Float!
  tokens: [TokenWithMetaType!]!
}

type AppTokenPositionBalance implements AbstractToken & AbstractPositionBalance {
  type: String!
  address: String!
  network: Network!
  balance: String!
  balanceUSD: Float!
  price: Float!
  symbol: String!
  decimals: Float!
  key: String
  appId: String!
  groupId: String!
  groupLabel: String
  displayProps: DisplayProps
  supply: Float!
  pricePerShare: [Float!]!
  tokens: [AbstractToken!]!
  hasMissingUnderlyingTokenPrice: Boolean!
}

type BaseTokenPositionBalance implements AbstractToken {
  type: String!
  address: String!
  network: Network!
  balance: String!
  balanceUSD: Float!
  price: Float!
  symbol: String!
  decimals: Float!
  priceSource: Erc20TokenPriceSource
}

enum Erc20TokenPriceSource {
  ORACLE
  COINGECKO
  OCP_V1
  OCP_V2
  NONE
}

type NftBalanceCollection {
  id: String!
  name: String!
  floorPrice: Float!
  floorPriceUSD: Float!
  img: String!
  imgBanner: String!
  imgProfile: String!
  imgFeatured: String!
  description: String!
  socials: [NftSocialLink!]!
  owners: Float!
  items: Float!
  volume24h: Float!
  volume24hUSD: Float!
}

type NftSocialLink {
  name: String!
  url: String!
}

type NftAsset {
  balance: Float!
  balanceUSD: Float!
  assetImg: String!
  assetName: String!
  tokenId: String!
}

type NonFungiblePositionBalance implements AbstractToken {
  type: String!
  address: String!
  network: Network!
  balance: String!
  balanceUSD: Float!
  price: Float!
  symbol: String!
  decimals: Float!
  collection: NftBalanceCollection
  assets: [NftAsset!]
}

type StringMetadataItem implements AbstractMetadataItem {
  type: String!
  valueString: String!
}

type NumberMetadataItem implements AbstractMetadataItem {
  type: String!
  valueNumber: Float!
}

type DollarMetadataItem implements AbstractMetadataItem {
  type: String!
  valueDollar: Float!
}

type PercentageMetadataItem implements AbstractMetadataItem {
  type: String!
  valuePct: Float!
}

type MetadataItemWithLabel {
  label: String!
  item: AbstractMetadataItem!
}

type BalanceJobId {
  jobId: String!
}

type BalanceJobStatus {
  jobId: String!
  status: String!
}

type PortfolioTotals {
  total: Float!
  appsTotal: Float!
  totalWithNFT: Float!
  totalByNetwork: [TotalByNetwork!]!
  totalByNetworkWithNFT: [TotalByNetwork!]!
  totalByAddress: [TotalByAddress!]!
  claimables: [ClaimableToken!]!
  debts: [ClaimableToken!]!
  holdings: [PortfolioHolding!]!
}

type PortfolioHolding {
  key: String!
  label: String!
  balanceUSD: Float!
  pct: Float!
}

type ClaimableToken {
  appId: String!
  address: String!
  token: AbstractToken!
}

type TotalByNetwork {
  network: Network!
  total: Float!
}

type TotalByAddress {
  address: String!
  total: Float!
}

type ProductItem {
  label: String!
  assets: [AbstractPositionBalance!]!
  meta: [MetadataItemWithLabel!]!
}

type NftBalance {
  network: Network!
  balanceUSD: Float!
}

type Portfolio {
  proxies: [ProxyAccount!]!

  """Use tokenBalances from portfolioV2 to avoid computing balances"""
  tokenBalances: [TokenBalance!]!

  """Use appBalances from portfolioV2 to avoid computing balances"""
  appBalances: [AppBalance!]!
  nftBalances: [NftBalance!]!
  totals: PortfolioTotals!
}

type AppBalance {
  key: String!
  address: String!
  appId: String!
  appName: String!
  appImage: String!
  network: Network!
  updatedAt: Timestamp!
  balanceUSD: Float!
  products: [ProductItem!]!
}

type CoinGeckoMarketData implements MarketData {
  type: MarketDataType!
  isExchangeable: Boolean!
  price(currency: Currency = USD): Float
  coinGeckoId: String!
  coinGeckoUrl: String!
  totalSupply: String
  dailyVolume: Float
  marketCap: Float
}

type JupiterMarketData implements MarketData {
  type: MarketDataType!
  isExchangeable: Boolean!
  price(currency: Currency = USD): Float
}

type OnchainMarketData implements MarketData {
  type: MarketDataType!
  isExchangeable: Boolean!
  price(currency: Currency = USD): Float
  historicalPrice(currency: Currency = USD, timestamp: Timestamp!): OnchainHistoricalPrice
  marketCap: Float
  totalLiquidity(currency: Currency = USD): Float
  totalGasTokenLiquidity: Float
  priceChange5m: Float
  priceChange1h: Float
  priceChange24h: Float
  volume24h(currency: Currency = USD): Float
  priceTicks(currency: Currency!, timeFrame: TimeFrame!): [OnchainMarketDataPriceTick!]!
  latestSwaps(first: Int = 12, after: String): OnchainMarketDataLatestSwapConnection!
}

enum TimeFrame {
  HOUR
  DAY
  WEEK
  MONTH
  YEAR
}

type OnchainMarketDataPriceTick {
  median: Float!
  open: Float!
  close: Float!
  high: Float!
  low: Float!
  timestamp: Timestamp!
}

type FungibleToken implements Node {
  id: ID!
  address: Address!
  name: String!
  symbol: String!
  decimals: Int!
  totalSupply: String
  networkId: Int!

  """Use onchainMarketData for EVM tokens"""
  marketData: MarketData
  credibility: Float
  rank: Int
  securityRisk: FungibleTokenSecurityRisk
  networkV2: NetworkObject!
  isHoldersSupported: Boolean!
  network: Network! @deprecated(reason: "Use `networkV2` instead")
  imageUrl: String! @deprecated(reason: "Use `imageUrlV2`, which will return null if the image is not found")

  """Returns the token image URL or null if not found"""
  imageUrlV2: String
  priceData: OnchainMarketData
  onchainMarketData: OnchainMarketData
  isVerified: Boolean!
  holders(first: Float!, after: String): PaginatedSupportedTokenHolders
  holdersFollowedByAddress(address: Address!): [SupportedTokenHolder!]!
}

type FungibleTokenSecurityRisk {
  reason: HiddenTokenReason!
  strategy: HiddenTokenMethod!
}

enum HiddenTokenReason {
  Spam
  Rugpull
  Honeypot
  Worthless
  Arbitrary
}

enum HiddenTokenMethod {
  Manual
  GoPlus
  SpamDetection
}

type ChatChannel implements Node {
  id: ID!
  network: Network!
  name: String!
  description: String!
  createdAt: Timestamp!
  imageUrl: String!
  totalShares: Int!
  valuePerShare: String!
  channelFeePerShare: String!
  protocolFeePerShare: String!
}

type ChatChannelEdge {
  node: ChatChannel!
  cursor: String!
}

type ChatChannelMember implements Node {
  id: ID!
  address: String!
  shares: Int!
}

type ChatChannelMemberEdge {
  node: ChatChannelMember!
  cursor: String!
}

type ActivityAccountDelta implements Node {
  id: ID!
  tokenDeltasCount: Int!
  nftDeltasCount: Int!
  account: Account
  tokenDeltasV2(first: Int = 5, after: String): FungibleTokenDeltaConnection!
  nftDeltasV2(first: Int = 5, after: String): NftDeltaConnection!
}

type ActivityAccountDeltaEdge {
  node: ActivityAccountDelta!
  cursor: String!
}

type ActivityAccountDeltaConnection {
  edges: [ActivityAccountDeltaEdge!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type FungibleTokenDelta implements Node {
  id: ID!
  address: String!
  amountRaw: BigDecimal!
  attachment: TokenDisplayItem!
  token: FungibleToken
  appToken: AppFungibleToken
  amount: Float
}

type FungibleTokenDeltaEdge {
  node: FungibleTokenDelta!
  cursor: String!
}

type FungibleTokenDeltaConnection {
  edges: [FungibleTokenDeltaEdge!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type NftDelta implements Node {
  id: ID!
  collectionAddress: String!
  tokenId: String!
  amount: Float!
  amountRaw: BigDecimal!
  attachment: NFTDisplayItem!
  nft: NftToken
}

type NftDeltaEdge {
  node: NftDelta!
  cursor: String!
}

type NftDeltaConnection {
  edges: [NftDeltaEdge!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type ActivityEventDelta {
  transactionHash: String!
  network: Network!
  subject: String!
  transactionBlockTimestamp: Timestamp!
  nftCount: Int!
  fungibleCount: Int!
}

type ActivityTimelineEventDelta implements Node {
  id: ID!
  transactionHash: String!
  network: Network!
  subject: String!
  transactionBlockTimestamp: Timestamp!
  nftCount: Int!
  fungibleCount: Int!
  perspectiveAccount: Account!
  from: Account!
  to: Account
}

type ActivityEventDeltaEdge {
  node: ActivityEventDelta!
  cursor: String!
}

type PositionBreakdownDisplayProps {
  label: String!
  secondaryLabel: AbstractDisplayItem
  tertiaryLabel: AbstractDisplayItem
  images: [String!]!
  balanceDisplayMode: BalanceDisplayMode!
  stats: [DisplayItemWrapper!]!
  info: [DisplayItemWrapper!]!
}

type PositionBreakdown implements AbstractBreakdown {
  appId: String
  metaType: MetaTypeV3
  address: Address!
  network: Network!
  balanceUSD: Float!
  type: BreakdownType!
  breakdown: [AbstractBreakdown!]!
  displayProps: TokenBreakdownDisplayProps!
}

type TokenBreakdownDisplayProps {
  label: String!
  secondaryLabel: AbstractDisplayItem
  tertiaryLabel: AbstractDisplayItem
  balanceDisplayMode: BalanceDisplayMode!
  images: [String!]!
  stats: [DisplayItemWrapper!]!
  info: [DisplayItemWrapper!]!
}

type TokenBreakdownContext {
  balance: Float!
  balanceRaw: String!
  price: Float!
  name: String
  symbol: String!
  decimals: Float!
  verified: Boolean
}

type TokenBreakdown implements AbstractBreakdown {
  appId: String
  metaType: MetaTypeV3
  address: Address!
  network: Network!
  balanceUSD: Float!
  type: BreakdownType!
  breakdown: [AbstractBreakdown!]!
  context: TokenBreakdownContext!
  displayProps: TokenBreakdownDisplayProps!
}

type NonFungibleTokenBreakdownDisplayProps {
  label: String!
  secondaryLabel: AbstractDisplayItem
  tertiaryLabel: AbstractDisplayItem
  balanceDisplayMode: BalanceDisplayMode!
  images: [String!]!
  stats: [DisplayItemWrapper!]!
  info: [DisplayItemWrapper!]!
  profileImage: String!
  profileBanner: String!
  featuredImage: String
}

type NonFungibleTokenBreakdownContext {
  incomplete: Boolean!
  openseaId: String!
  floorPrice: Float!
  holdersCount: Float!
  amountHeld: Float!
}

type NonFungibleTokenBreakdownAsset {
  tokenId: String!
  balance: Float!
  assetImg: String!
  balanceUSD: Float!
  assetName: String!
}

type NonFungibleTokenBreakdown implements AbstractBreakdown {
  appId: String
  metaType: MetaTypeV3
  address: Address!
  network: Network!
  balanceUSD: Float!
  type: BreakdownType!
  breakdown: [AbstractBreakdown!]!
  context: NonFungibleTokenBreakdownContext!
  assets: [NonFungibleTokenBreakdownAsset!]!
  displayProps: NonFungibleTokenBreakdownDisplayProps!
}

type AppContractPosition {
  key: String!
  address: String!
  appId: String!
  appName: String!
  groupId: String!
  type: ContractType!
  label: String!
  liquidity: Float
  groupLabel: String! @deprecated(reason: "prefer using label")
  network: Network!
  displayProps: PositionBreakdownDisplayProps!
  tokens: [AbstractPosition!]!
  baseTokensSymbols: [String!]!
  baseTokens: [BaseTokenPosition!]!
}

type AppTokenPosition implements AbstractPosition {
  appId: String! @deprecated(reason: "use app.slug instead")
  type: ContractType!
  network: Network!
  appName: String! @deprecated(reason: "use app.name instead")
  decimals: Int!
  metaType: String
  groupId: String!
  label: String
  liquidity: Float
  groupLabel: String @deprecated(reason: "prefer using label")
  price: Float!
  pricePerShare: [Float!]!
  supply: String!
  symbol: String!
  address: String!
  name: String
  tokens: [AbstractPosition!]!
  displayProps: PositionBreakdownDisplayProps!
  baseTokensSymbols: [String!]!
  baseTokens: [BaseTokenPosition!]!
}

type AppTokenPositionEdge {
  node: AppTokenPosition!
  cursor: String!
}

type NonFungibleTokenPosition implements AbstractPosition {
  appId: String! @deprecated(reason: "no app for non-fungible tokens")
  type: ContractType!
  network: Network!
  appName: String! @deprecated(reason: "no app for non-fungible tokens")
  address: String!
  symbol: String!
  decimals: Int!
  price: Float!
  assets: [NftAsset!]
  displayProps: NonFungibleTokenBreakdownDisplayProps!
}

type BaseTokenPosition implements AbstractPosition {
  appId: String!
  type: ContractType!
  network: Network!
  metaType: String
  address: String!
  symbol: String!
  price: Float!
  decimals: Int!
  status: String
  hide: Boolean
  canExchange: Boolean
}

type AppPosition {
  appPosition: Position!
}

union Position = AppTokenPosition | AppContractPosition

type AppPositionEdge {
  node: AppPosition!
  cursor: String!
}

type AppPositionConnection {
  edges: [AppPositionEdge!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type AppPositionGroup {
  label: String!
  groupLabel: String! @deprecated(reason: "prefer using label")
  appTokenPositions: [AppTokenPosition!]! @deprecated(reason: "prefer using investments")
  contractPositions: [AppContractPosition!]! @deprecated(reason: "prefer using investments")
  positions: AppPositionConnection!
  baseTokenSymbols: [String!]!
  baseTokens: [BaseTokenPosition!]!
}

type AppListView implements AbstractAppView {
  label: String!
  type: AppViewType!
  positionType: String
  positions: AppPositionGroup!
  totalPositions: Float!
  groupIds: [String!]
}

type AppDropdownView implements AbstractAppView {
  label: String!
  type: AppViewType!
  positionType: String
  options: [AbstractAppView!]!
  groupIds: [String!]
}

type AppSplitView implements AbstractAppView {
  label: String!
  type: AppViewType!
  positionType: String
  views: [AbstractAppView!]!
  groupIds: [String!]
}

type AppTvl {
  """Associated network of the app"""
  network: Network!

  """Total value locked of an app for a given network"""
  tvl: Float!
}

type AppCategoryObject {
  id: ID!
  name: String!
  slug: String!
  description: String!
  trendable: Boolean!
  createdAt: Timestamp!
  updatedAt: Timestamp!
}

type AppLinks {
  """Discord channel link"""
  discord: String

  """GitHub organization link"""
  github: String

  """Medium blog link"""
  medium: String

  """Telegram channel link"""
  telegram: String

  """Twitter profile link"""
  twitter: String
}

type AppGroupDefinition {
  id: String!
  label: String!
  groupLabel: String @deprecated(reason: "should no longer be used")
  isHiddenFromExplore: Boolean
  type: String!
}

type App implements Node {
  id: ID!

  """Unique application ID"""
  databaseId: Int!

  """Unique application slug"""
  slug: String!

  """Current status of the application"""
  status: AppStatus!

  """Group in which this application belongs to"""
  groups: [String!]! @deprecated(reason: "Prefer using groupDefinition")

  """Group in which this application belongs to"""
  groupDefinitions: [AppGroupDefinition!]!

  """The typical display name of the application"""
  displayName: String!

  """Application website"""
  url: String

  """Application links"""
  links: AppLinks
  websiteUrl: String @deprecated(reason: "Renamed to url")

  """Description of the application."""
  description: String!
  label: String
  imgUrl: String!
  tags: [ApplicationTag!]!
  positions: [AppPositionGroup!]!
  tvl: [AppTvl!]!
  tokenAddress: String
  tokenNetwork: Network
  token: BaseTokenPosition
  categoryId: Int
  category: AppCategoryObject
  twitterUrl: String
  farcasterUrl: String
  createdAt: Timestamp!
  appPositions(network: Network!, groupId: String!, first: Float = 25, after: String): AppPositionConnection!
}

enum AppStatus {
  ARCHIVED
  ENABLED
  DISABLED
  PENDING
  REJECTED
}

enum ApplicationTag {
  ALGORITHMIC_STABLECOIN
  ASSET_MANAGEMENT
  BONDS
  BRIDGE
  COLLATERALIZED_DEBT_POSITION
  CROSS_CHAIN
  DECENTRALIZED_EXCHANGE
  DERIVATIVES
  ELASTIC_FINANCE
  FARMING
  FUND_MANAGER
  GAMING
  INFRASTRUCTURE
  INSURANCE
  LAUNCHPAD
  LENDING
  LIQUIDITY_POOL
  LIQUID_STAKING
  LOTTERY
  MARGIN_TRADING
  NFT_LENDING
  NFT_MARKETPLACE
  OPTIONS
  PAYMENTS
  PERPETUALS_EXCHANGE
  PREDICTION_MARKET
  PRIVACY
  REAL_ESTATE
  RESERVE_CURRENCY
  STABLECOIN
  STAKING
  SYNTHETICS
  TOKENIZED_RISK
  YIELD_AGGREGATOR
  LIMIT_ORDER
}

type AppEdge {
  node: App!
  cursor: String!
}

type FiniliarPortfolioSnapshot {
  totalUsd: Float!
  timestamp: Timestamp!
}

type FiniliarPortfolioChange {
  changePercentage: Float!
  oldestSnapshot: FiniliarPortfolioSnapshot!
  latestSnapshot: FiniliarPortfolioSnapshot!
}

type OnchainMarketDataLatestSwap implements Node {
  id: ID!
  transactionHash: String!
  timestamp: Timestamp!
  soldAmount: Float!
  soldTokenAddress: Address!
  boughtAmount: Float!
  boughtTokenAddress: Address!
  gasTokenVolume: Float!
  volumeUsd: Float!
  from: Account!
  boughtToken: FungibleToken
  soldToken: FungibleToken
  network: NetworkObject!
}

type OnchainMarketDataLatestFarcasterSwap implements Node {
  id: ID!
  transactionHash: String!
  timestamp: Timestamp!
  soldAmount: Float!
  soldTokenAddress: Address!
  boughtAmount: Float!
  boughtTokenAddress: Address!
  gasTokenVolume: Float!
  volumeUsd: Float!
}

type OnchainMarketDataLatestSwapEdge {
  node: OnchainMarketDataLatestSwap!
  cursor: String!
}

type OnchainMarketDataLatestSwapConnection {
  edges: [OnchainMarketDataLatestSwapEdge!]!
  pageInfo: PageInfo!
}

type OnchainMarketDataLatestFarcasterSwapEdge {
  node: OnchainMarketDataLatestFarcasterSwap!
  cursor: String!
}

type OnchainHistoricalPrice {
  timestamp: Timestamp!
  price: Float!
}

type NetworkExchangeConfigurationObject {
  enabled: Boolean!
  suggestedTokenAddresses: [String!]!
  feeBasisPoints: Float!

  """Fee percentage eg. value of 0.5 -> 0.5% fee taken from total amount"""
  feePercentage: Float!
  feeRecipientAddress: String
  exchangeProviderStrategy: String!
  exchangeProviderUrl: String!
}

type NetworkObject {
  id: Int!
  name: String!
  slug: String!
  enumValue: Network! @deprecated(reason: "Use network ID instead")
  enabled: Boolean!
  evmCompatible: Boolean @deprecated(reason: "Use vm instead")
  vm: VirtualMachineType!
  chainId: Int
  hasLiveFeedEtl: Boolean!
  holdingsEnabled: Boolean!
  nftBalancesEnabled: Boolean!
  holdingsComparisonJobEnabled: Boolean!
  thirdPartyBaseTokensEnabled: Boolean!
  onchainPricesEnabled: Boolean!
  activityFeedEnabled: Boolean!
  trendsEnabled: Boolean!
  pushNotificationEnabled: Boolean!
  farcasterZappyBotEnabled: Boolean!
  pnlEnabled: Boolean!
  multicallContractAddress: String
  wrappedGasTokenAddress: String
  blocksPerDayEstimate: Int
  blockScannerType: String
  blockScannerBaseUrl: String
  publicRpcUrl: String
  enabledAt: Timestamp
  exchangeConfiguration: NetworkExchangeConfigurationObject
}

enum VirtualMachineType {
  EVM
  SVM
  BITCOIN
}

type PortfolioV2AppBalancesByAccount {
  id: ID!
  accountAddress: Address!
  account: Account!
  balanceUSD: Float!
  smartAccount: ProxyAccount
}

type PortfolioV2AppBalancesByAccountEdge {
  node: PortfolioV2AppBalancesByAccount!
  cursor: String!
}

type PortfolioV2AppBalancesByAccountConnection {
  edges: [PortfolioV2AppBalancesByAccountEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2AppBalanceByAppAccountBalance {
  id: ID!

  """Address of the account"""
  accountAddress: Address!

  """Balance of the account in USD"""
  balanceUSD: Float!

  """Count of positions for this account"""
  positionCount: Int!
}

type PortfolioV2AppBalanceByAppAccountBalanceEdge {
  node: PortfolioV2AppBalanceByAppAccountBalance!
  cursor: String!
}

type PortfolioV2AppBalanceByAppAccountBalanceConnection {
  edges: [PortfolioV2AppBalanceByAppAccountBalanceEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2AppBalanceByApp {
  """ID"""
  id: ID!

  """App ID"""
  appId: ID!

  """Network ID"""
  networkId: ID!

  """Balance of the app in USD"""
  balanceUSD: Float!

  """Count of positions for this app/network"""
  positionCount: Int!
  app: App!
  network: NetworkObject!
  accountBalances(first: Int = 5): PortfolioV2AppBalanceByAppAccountBalanceConnection!
  balances(first: Int = 25, after: String, filters: PortfolioV2AppBalanceByAppBalanceFiltersInput): PortfolioV2AppBalanceByAppPositionBalanceConnection! @deprecated(reason: "Use positionBalances instead")
  positionBalances(first: Int = 25, after: String, filters: PortfolioV2AppBalanceByAppBalanceFiltersInput): PortfolioV2AppBalanceByAppPositionBalanceConnection!
}

input PortfolioV2AppBalanceByAppBalanceFiltersInput {
  minBalanceUSD: Float
  metaType: MetaTypeV3
  symbolLike: String
  search: String
}

type PortfolioV2AppBalanceByAppEdge {
  node: PortfolioV2AppBalanceByApp!
  cursor: String!
}

type PortfolioV2AppBalanceByAppConnection {
  edges: [PortfolioV2AppBalanceByAppEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2AppBalanceByMetaType {
  id: ID!
  metaType: MetaTypeV3!
  positionCount: Int!
  balanceUSD: Float!
  networkBalances(first: Int = 5): PortfolioV2AppBalanceByMetaTypeNetworkBalanceConnection!
}

type PortfolioV2AppBalanceByMetaTypeEdge {
  node: PortfolioV2AppBalanceByMetaType!
  cursor: String!
}

type PortfolioV2AppBalanceByMetaTypeConnection {
  edges: [PortfolioV2AppBalanceByMetaTypeEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2AppBalanceByMetaTypeNetworkBalance {
  id: ID!

  """Network ID"""
  networkId: ID!

  """Balance of the network in USD"""
  balanceUSD: Float!
  network: NetworkObject!
}

type PortfolioV2AppBalanceByMetaTypeNetworkBalanceEdge {
  node: PortfolioV2AppBalanceByMetaTypeNetworkBalance!
  cursor: String!
}

type PortfolioV2AppBalanceByMetaTypeNetworkBalanceConnection {
  edges: [PortfolioV2AppBalanceByMetaTypeNetworkBalanceEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2AppBalanceByNetwork {
  id: ID!
  networkId: ID!
  network: NetworkObject!
  balanceUSD: Float!
}

type PortfolioV2AppBalanceByNetworkEdge {
  node: PortfolioV2AppBalanceByNetwork!
  cursor: String!
}

type PortfolioV2AppBalanceByNetworkConnection {
  edges: [PortfolioV2AppBalanceByNetworkEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2AppBalanceByToken {
  id: ID!
  tokenAddress: String!
  networkId: ID!
  network: NetworkObject!
  balanceUSD: Float!
  token: FungibleToken
}

type PortfolioV2AppBalanceByTokenEdge {
  node: PortfolioV2AppBalanceByToken!
  cursor: String!
}

type PortfolioV2AppBalanceByTokenConnection {
  edges: [PortfolioV2AppBalanceByTokenEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2NftBalanceByCollection {
  id: ID!
  collectionId: ID!
  collection: NftCollection!
  balance: String!
  balanceDistinct: String!
  balanceUSD: Float!
}

type PortfolioV2NftBalanceByCollectionEdge {
  node: PortfolioV2NftBalanceByCollection!
  cursor: String!
}

type PortfolioV2NftBalanceByCollectionConnection {
  edges: [PortfolioV2NftBalanceByCollectionEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2NftBalanceByNetwork {
  id: ID!
  networkId: ID!
  network: NetworkObject!
  balance: String!
  balanceUSD: Float!
}

type PortfolioV2NftBalanceByNetworkEdge {
  node: PortfolioV2NftBalanceByNetwork!
  cursor: String!
}

type PortfolioV2NftBalanceByNetworkConnection {
  edges: [PortfolioV2NftBalanceByNetworkEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2NftBalanceByToken {
  id: ID!
  tokenId: ID!
  token: NftToken!
  balance: String!
  balanceUSD: Float!
}

type PortfolioV2NftBalanceByTokenEdge {
  node: PortfolioV2NftBalanceByToken!
  cursor: String!
}

type PortfolioV2NftBalanceByTokenConnection {
  edges: [PortfolioV2NftBalanceByTokenEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2TokenBalancesByAccountTokenBalance {
  id: ID!
  tokenAddress: Address!
  network: Network!
  name: String!
  symbol: String!
  decimals: Float!
  imgUrl: String!
  verified: Boolean!
  price: Float!
  balance: Float!
  balanceUSD: Float!
  balanceRaw: String!
}

type PortfolioV2TokenBalancesByAccountTokenBalanceEdge {
  node: PortfolioV2TokenBalancesByAccountTokenBalance!
  cursor: String!
}

type PortfolioV2TokenBalancesByAccount {
  id: ID!
  accountAddress: Address!
  account: Account!
  balanceUSD: Float!
  smartAccount: ProxyAccount
  tokenBalances(first: Int = 5): PortfolioV2TokenBalanceByAccountTokenBalanceConnection!
}

type PortfolioV2TokenBalancesByAccountEdge {
  node: PortfolioV2TokenBalancesByAccount!
  cursor: String!
}

type PortfolioV2TokenBalancesByAccountConnection {
  edges: [PortfolioV2TokenBalancesByAccountEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2TokenBalanceByAccountTokenBalance {
  id: ID!
  tokenAddress: String!
  networkId: ID!
  name: String!
  symbol: String!
  decimals: Float!
  verified: Boolean!
  price: Float!
  balance: Float!
  balanceUSD: Float!
  balanceRaw: String!
  network: NetworkObject!
}

type PortfolioV2TokenBalanceByAccountTokenBalanceEdge {
  node: PortfolioV2TokenBalanceByAccountTokenBalance!
  cursor: String!
}

type PortfolioV2TokenBalanceByAccountTokenBalanceConnection {
  edges: [PortfolioV2TokenBalanceByAccountTokenBalanceEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2TokenBalancesByNetwork {
  id: ID!
  networkId: ID!
  networkSlug: Network! @deprecated(reason: "Use network.slug instead")
  balanceUSD: Float!
  network: NetworkObject!
}

type PortfolioV2TokenBalancesByNetworkEdge {
  node: PortfolioV2TokenBalancesByNetwork!
  cursor: String!
}

type PortfolioV2TokenBalancesByNetworkConnection {
  edges: [PortfolioV2TokenBalancesByNetworkEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2TokenBalanceByTokenAccountBalance {
  id: ID!
  accountAddress: Address!
  balance: Float!
  balanceUSD: Float!
  balanceRaw: String!
  account: Account!
  smartAccount: ProxyAccount
}

type PortfolioV2TokenBalanceByTokenAccountBalanceEdge {
  node: PortfolioV2TokenBalanceByTokenAccountBalance!
  cursor: String!
}

type PortfolioV2TokenBalanceByTokenAccountBalanceConnection {
  edges: [PortfolioV2TokenBalanceByTokenAccountBalanceEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2TokenBalanceByToken {
  id: ID!
  tokenAddress: String!
  networkId: ID!
  name: String!
  symbol: String!
  decimals: Float!
  verified: Boolean!
  price: Float!
  balance: Float!
  balanceUSD: Float!
  balanceRaw: String!
  network: NetworkObject!

  """The URL of the token image"""
  imgUrl: String! @deprecated(reason: "Use imgUrlV2 instead, which will return null if the image is not found")

  """The URL of the token image, or null if the image is not found"""
  imgUrlV2: String
  accountBalances(first: Int = 5): PortfolioV2TokenBalanceByTokenAccountBalanceConnection!
}

type PortfolioV2TokenBalanceByTokenEdge {
  node: PortfolioV2TokenBalanceByToken!
  cursor: String!
}

type PortfolioV2TokenBalanceByTokenConnection {
  edges: [PortfolioV2TokenBalanceByTokenEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ProxyAccount {
  ownerAddress: Address!
  address: Address!
  networkId: ID!
  network: Network!
  appId: String @deprecated(reason: "Use `app.slug` field instead")
  app: App
  owner: Account!
  networkV2: NetworkObject!
}

type WalletTokenBalanceToken {
  id: ID!
  address: String!
  network: Network!
  label: String
  imgUrl: String!
  name: String!
  decimals: Float!
  symbol: String!
  verified: Boolean!
  price: Float!
}

type BaseTokenBalance {
  baseToken: WalletTokenBalanceToken!
  balance: Float!
  balanceUSD: Float!
  balanceRaw: String!
}

type TokenBalance {
  key: String!
  address: String!
  network: Network!
  token: BaseTokenBalance!
  proxy: ProxyAccount @deprecated(reason: "Use `proxies` on the `Portfolio` object instead")
  updatedAt: Timestamp!
}

type AddressMetadataObject implements Node {
  id: ID!
  address: Address!
  network: String
  relatedEntityTypes: [OnchainEntityType!]!
  label: String!
  labelSource: String!
  updatedAt: Timestamp!
  createdAt: Timestamp!
}

enum OnchainEntityType {
  TOKEN
  DAO
  NFT_COLLECTION
}

type AddressMetadataEdge {
  node: AddressMetadataObject!
  cursor: String!
}

type ParamType {
  type: String!
  name: String
  indexed: Boolean
  components: [ParamType!]
}

type Contract {
  address: Address!
  network: Network!
  app: App
}

type FarcasterMetadata {
  displayName: String
  description: String
  warpcast: String
  imageUrl: String
}

type FarcasterProfile implements Node {
  id: ID!
  username: String!
  custodyAddress: String!
  fid: Int!
  connectedAddresses: [String!]!
  metadata: FarcasterMetadata!
  zapperBotSubscribedAddresses: [Address!]!
  followStats: FarcasterFollowerStats
  followers(first: Int, after: String): FarcasterFollowerConnection!
  following(first: Int, after: String): FarcasterFollowerConnection!
}

type FarcasterFollowerStats {
  followerCount: Int!
  followingCount: Int!
}

type FarcasterProfileEdge {
  node: FarcasterProfile!
  cursor: String!
}

type FarcasterFollowerConnection {
  edges: [FarcasterProfileEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type LensMetadata {
  name: String
  handleNamespace: String
  fullHandle: String
  description: String
  hey: String
  twitter: String
  website: String
  imageUrl: String
  coverImageUrl: String
}

type LensProfile {
  handle: String!
  metadata: LensMetadata!
}

type TimelineV2EntryEdge {
  node: TimelineV2Entry!
  cursor: String!
}

union TimelineV2Entry = TimelineEventV2Entries | ActivityAccountDeltaEntries

type TimelineEventV2Entries implements Node {
  id: ID!
  entries: [TimelineEventV2!]!
}

type ActivityAccountDeltaEntries implements Node {
  id: ID!
  entries: [ActivityTimelineEventDelta!]!
}

type TransactionHistoryV2EntryEdge {
  node: TransactionHistoryV2Entry!
  cursor: String!
}

union TransactionHistoryV2Entry = TimelineEventV2 | ActivityTimelineEventDelta

type TransactionHistoryV2EntryConnection {
  edges: [TransactionHistoryV2EntryEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type NftUserCollectionEdge {
  node: NftCollection!
  cursor: String!
  balance: Int!
  balanceUSD: Float!
}

type NftUserCollectionConnection {
  edges: [NftUserCollectionEdge!]!
  pageInfo: PageInfo!
}

type NftUserTokenEdge {
  node: NftToken!
  cursor: String!
  balance: Int! @deprecated(reason: "Use `balanceRaw` instead")
  balanceRaw: String!
  balanceUSD: Float!
  valuationStrategy: NftValuationStrategy!
  lastReceived: DateTime
  ownedAt: DateTime
  token: NftToken! @deprecated(reason: "Use `node`")
  balances: [NftUserTokenBalance!]!
}

enum NftValuationStrategy {
  TOP_OFFER
  ESTIMATED_VALUE
  OVERRIDE
}

"""
A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.
"""
scalar DateTime

type NftUserTokenConnection {
  edges: [NftUserTokenEdge!]!
  pageInfo: PageInfo!
}

type NftPayment {
  tokenAddress: Address! @deprecated(reason: "Use `token`")
  tokenSymbol: String @deprecated(reason: "Use `token`")
  tokenValue: BigDecimal!
  tokenValueETH: BigDecimal!
  tokenValueUSD: BigDecimal!
}

type NftTransfer implements Node {
  id: ID!
  timestamp: Int!
  txHash: String!
  network: Network!
  payments: [NftPayment!]!
}

type NftTransferEdge {
  node: NftTransfer!
  cursor: String!
  heldForInSeconds: Int
}

type NftTransferConnection {
  edges: [NftTransferEdge!]!
  pageInfo: PageInfo!
}

type CollectionEventSale implements CollectionEvent & Node {
  id: ID!
  timestamp: Int!
  txHash: String!
  intention: String
  event: CollectionEventOld! @deprecated(reason: "Use `CollectionEvent` instead")
  token: NftToken!
  fromAccount: Account!
  toAccount: Account!
  payments: [NftPayment!]!
}

type CollectionEventTransfer implements CollectionEvent & Node {
  id: ID!
  timestamp: Int!
  txHash: String!
  intention: String
  event: CollectionEventOld! @deprecated(reason: "Use `CollectionEvent` instead")
  token: NftToken!
  fromAccount: Account!
  toAccount: Account!
}

type CollectionEventEdge {
  node: CollectionEvent!
  cursor: String!
}

type CollectionEventConnection {
  edges: [CollectionEventEdge!]!
  pageInfo: PageInfo!
}

type NftCollectionStats {
  hourlyVolumeEth: BigDecimal!
  hourlyVolumeEthPercentChange: Float
  dailyVolumeEth: BigDecimal!
  dailyVolumeEthPercentChange: Float
  weeklyVolumeEth: BigDecimal!
  weeklyVolumeEthPercentChange: Float
  monthlyVolumeEth: BigDecimal!
  monthlyVolumeEthPercentChange: Float
  totalVolumeEth: BigDecimal!
  hourlyVolume: NftValueDenomination!
  dailyVolume: NftValueDenomination!
  weeklyVolume: NftValueDenomination!
  monthlyVolume: NftValueDenomination!
  totalVolume: NftValueDenomination!
}

type NftCollectionTraitGroupString implements Node & NftCollectionTraitGroupBase {
  id: ID!
  name: String!
  display: NftTraitDisplayType!
}

type NftCollectionTraitGroupNumericRange implements Node & NftCollectionTraitGroupBase {
  id: ID!
  name: String!
  display: NftTraitDisplayType!
  min: Float!
  max: Float!
}

type NftCollectionTraitValue implements Node {
  id: ID!
  value: String!
  estimatedValueEth: BigDecimal
  supply: BigDecimal!
  supplyPercentage: Float!
}

type NftCollectionTraitValueEdge {
  node: NftCollectionTraitValue!
  cursor: String!
}

type NftCollectionTraitValueConnection {
  edges: [NftCollectionTraitValueEdge!]!
  pageInfo: PageInfo!
}

type TransactionConfig {
  data: String!
  to: Address!
  from: Address!
}

type NftContract {
  address: Address!
  network: Network!
}

type NftCollectionGroup implements Node {
  id: ID!
  key: String!
  name: String!
  description: String!
  socialLinks: [SocialLink!]!

  """Image of the collection group as a square"""
  logoImageUrl: String

  """Image of the collection group as an horizontal rectangle"""
  bannerImageUrl: String

  """Image of the collection group as a vertical rectangle"""
  cardImageUrl: String
  disabled: Boolean!
  isCurated: Boolean!
  relatedContracts: [NftContract!]
  relatedCollectionType: NftCollectionType
}

type NftCollectionHolder implements Node {
  id: ID!

  """Number of unique items"""
  holdCount: BigDecimal!

  """Total number of items - for ERC-1155"""
  holdTotalCount: BigDecimal!
  account: Account!
}

type NftCollectionHolderEdge {
  node: NftCollectionHolder!
  cursor: String!
}

type PaginatedNftHolder {
  edges: [NftCollectionHolderEdge!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type NftEventTokenPayment {
  from: Address!
  to: Address!
  tokenAmountRaw: String!
  historicPriceUsd: Float
  gasAmountRaw: Float
  token: FungibleToken
}

type NftEvent implements Node {
  id: ID!
  eventType: String!
  from: Address!
  to: Address!
  quantity: String!
  block: Int!
  timestamp: Int!
  txHash: String!
  payment: NftEventTokenPayment
  nft: NftToken!
}

type NftEventEdge {
  node: NftEvent!
  cursor: String!
}

type NftEventConnection {
  edges: [NftEventEdge!]!
  pageInfo: PageInfo!
}

type NftHolder implements Node {
  id: ID!

  """Number of unique items, not counting ERC-1155 copies"""
  holdCount: BigDecimal!

  """Total number of items including ERC-1155 copies"""
  holdTotalCount: BigDecimal!
  account: Account!
}

type NftHolderEdge {
  node: NftHolder!
  cursor: String!
}

type NftHolderConnection {
  edges: [NftHolderEdge!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type NftTrait implements Node {
  id: ID!
  attributeName: String!
  attributeValue: String!
  estimatedValueEth: BigDecimal @deprecated(reason: "Use estimatedValue instead")
  supply: BigDecimal!
  supplyPercentage: Float!
}

type NftMetadata {
  uri: String
  data: String
}

type NftUserTokenBalance {
  balance: BigDecimal!
  valuationStrategy: NftValuationStrategy!
  user: User! @deprecated(reason: "Use `account` instead to take advantage of the `Account` type")
  account: Account!
}

type AnyPositionBalanceEdge {
  node: AnyPositionBalance!
  cursor: String!
}

union AnyPositionBalance = AppTokenPositionBalance | ContractPositionBalance

type PortfolioV2AppBalanceByAppPositionBalanceConnection {
  edges: [AnyPositionBalanceEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PortfolioV2AppBalance {
  byAccount(first: Int = 25, after: String, filters: PortfolioV2AppBalanceByAccountFiltersInput): PortfolioV2AppBalancesByAccountConnection!
  byApp(first: Int = 25, after: String, filters: PortfolioV2AppBalanceByAppFiltersInput): PortfolioV2AppBalanceByAppConnection!
  byMetaType(first: Int = 25, after: String, filters: PortfolioV2AppBalanceByMetaTypeFiltersInput): PortfolioV2AppBalanceByMetaTypeConnection!
  byNetwork(first: Int = 25, after: String, filters: PortfolioV2AppBalanceByNetworkFiltersInput): PortfolioV2AppBalanceByNetworkConnection!
  byToken(first: Int = 25, after: String, filters: PortfolioV2AppBalanceByTokenFiltersInput): PortfolioV2AppBalanceByTokenConnection!
  totalBalanceUSD: Float!
}

input PortfolioV2AppBalanceByAccountFiltersInput {
  minBalanceUSD: Float
}

input PortfolioV2AppBalanceByAppFiltersInput {
  minBalanceUSD: Float
  metaType: MetaTypeV3
  symbolLike: String
  search: String
  tokens: [PortfolioV2AppBalanceByAppTokenFilterInput!]
}

input PortfolioV2AppBalanceByAppTokenFilterInput {
  address: String!
  network: Network!
}

input PortfolioV2AppBalanceByMetaTypeFiltersInput {
  minBalanceUSD: Float
}

input PortfolioV2AppBalanceByNetworkFiltersInput {
  minBalanceUSD: Float
}

input PortfolioV2AppBalanceByTokenFiltersInput {
  minBalanceUSD: Float
}

type PortfolioV2TokenBalanceMetadata {
  addresses: [Address!]!
  networks: [Network!]!
}

type PortfolioV2TokenBalance {
  metadata: PortfolioV2TokenBalanceMetadata!
  byToken(first: Int = 25, after: String, filters: PortfolioV2TokenBalancesByTokenFiltersInput): PortfolioV2TokenBalanceByTokenConnection!
  byAccount(first: Int = 25, after: String, filters: PortfolioV2TokenBalancesByAccountFiltersInput): PortfolioV2TokenBalancesByAccountConnection!
  byNetwork(first: Int = 25, after: String, filters: PortfolioV2TokenBalancesByNetworkFiltersInput): PortfolioV2TokenBalancesByNetworkConnection!
  totalBalanceUSD: Float!
}

input PortfolioV2TokenBalancesByTokenFiltersInput {
  minBalanceUSD: Float
  symbolLike: String
  tokenAddress: String
  includeTokensWithMissingPrices: Boolean
}

input PortfolioV2TokenBalancesByAccountFiltersInput {
  minBalanceUSD: Float
  symbolLike: String
  tokenAddress: String
  includeTokensWithMissingPrices: Boolean
}

input PortfolioV2TokenBalancesByNetworkFiltersInput {
  minBalanceUSD: Float
  symbolLike: String
  tokenAddress: String
  includeTokensWithMissingPrices: Boolean
}

type PortfolioV2NftBalance {
  byNetwork(first: Int = 25, after: String, filters: PortfolioV2NftBalanceByNetworkFiltersInput, order: PortfolioV2NftBalanceByNetworkOrderInput): PortfolioV2NftBalanceByNetworkConnection!
  byCollection(first: Int = 25, after: String, filters: PortfolioV2NftBalanceByCollectionFiltersInput, order: PortfolioV2NftBalanceByCollectionOrderInput): PortfolioV2NftBalanceByCollectionConnection!
  byToken(first: Int = 25, after: String, filters: PortfolioV2NftBalanceByTokenFiltersInput, order: PortfolioV2NftBalanceByTokenInputInput): PortfolioV2NftBalanceByTokenConnection!
  totalBalanceUSD: Float!
}

input PortfolioV2NftBalanceByNetworkFiltersInput {
  minBalanceUSD: Float
}

input PortfolioV2NftBalanceByNetworkOrderInput {
  by: PortfolioV2NftOrderByOption!
}

enum PortfolioV2NftOrderByOption {
  USD_WORTH
  LAST_RECEIVED
}

input PortfolioV2NftBalanceByCollectionFiltersInput {
  hidden: Boolean
  collectionName: String
  network: Network
}

input PortfolioV2NftBalanceByCollectionOrderInput {
  by: PortfolioV2NftOrderByOption!
}

input PortfolioV2NftBalanceByTokenFiltersInput {
  hidden: Boolean
  collectionKey: String
  network: Network
}

input PortfolioV2NftBalanceByTokenInputInput {
  by: PortfolioV2NftOrderByOption!
}

type PortfolioV2Metadata {
  addresses: [Address!]!
  networks: [Network!]!
}

type PortfolioV2 {
  metadata: PortfolioV2Metadata!
  tokenBalances(
    """Enqueue and wait for snapshot jobs for the token balances"""
    enqueueSnapshotJobs: Boolean = true

    """Enqueue and wait for tracking jobs for the token balances"""
    enqueueTrackingJobs: Boolean = true
  ): PortfolioV2TokenBalance!
  appBalances(
    """Re-enqueue and wait for snapshot jobs for the app balances"""
    enqueueSnapshotJobs: Boolean = true

    """Enqueue and wait for tracking jobs for the app balances"""
    enqueueTrackingJobs: Boolean = true
  ): PortfolioV2AppBalance!
  nftBalances(
    withOverrides: Boolean = false
    waitForUpdate: Boolean = false

    """Re-enqueue and wait for snapshot jobs for the nft balances"""
    enqueueSnapshotJobs: Boolean = false
  ): PortfolioV2NftBalance!
}

type NetworkTokenInfo {
  network: Network!
  address: Address!
  marketCap: BigDecimal
  gasLiquidityUsd: BigDecimal
  imageUrl: String!
}

type OnchainSearchResults {
  results: [OnchainSearchResultObject!]!
}

union OnchainSearchResultObject = AppResult | Erc20TokenResult | GasTokenResult | FarcasterProfileResult | UnifiedGasTokenResult | NftCollectionResult | UnifiedErc20TokenResult | UserResult | TransactionResult

type AppResult {
  id: String!
  category: SearchResultCategory!
  title: String!
  imageUrl: String
  score: String
  networks: [Network!]!
  appId: String!
  name: String
  app: App
}

enum SearchResultCategory {
  ADDRESS_LABEL
  APP
  APP_TOKEN
  APP_CONTRACT_POSITION
  BASE_TOKEN
  CHANNEL
  FARCASTER_PROFILE
  GAS_TOKEN
  UNIFIED_GAS_TOKEN
  ERC20_TOKEN
  NETWORK_BASE_TOKEN
  DAO
  NFT_COLLECTION
  NFT_COLLECTION_GROUP
  UNIFIED_ERC20_TOKEN
  USER
  TRANSACTION
}

type Erc20TokenResult {
  id: String!
  category: SearchResultCategory!
  title: String!
  imageUrl: String
  score: String
  address: Address!
  symbol: String!
  name: String
  network: Network!
  gasTokenLiquidityUsd: Float!
  erc20: FungibleToken
}

type GasTokenResult {
  id: String!
  category: SearchResultCategory!
  title: String!
  imageUrl: String
  score: String
  address: Address!
  symbol: String!
  name: String
  decimals: Float!
  totalSupply: Float!
  network: Network!
  gasTokenLiquidityUsd: Float!
  gasToken: FungibleToken
}

type FarcasterProfileResult {
  id: String!
  category: SearchResultCategory!
  title: String!
  imageUrl: String
  score: String
  fid: Float!
  username: String!
  displayName: String
}

type UnifiedGasTokenResult {
  id: String!
  category: SearchResultCategory!
  title: String!
  imageUrl: String
  score: String
  symbol: String!
  name: String
  groupId: String!
  perNetworkInfo: [NetworkTokenInfo!]!
  groupedGasTokens: [FungibleToken!]!
}

type NftCollectionResult {
  id: String!
  category: SearchResultCategory!
  title: String!
  imageUrl: String
  score: String
  network: Network!
  address: Address!
  monthlyVolume: BigDecimal!
  openseaSlug: String
  collectionGroupNames: [String!]!
  collection: NftCollection
}

type UnifiedErc20TokenResult {
  id: String!
  category: SearchResultCategory!
  title: String!
  imageUrl: String
  score: String
  symbol: String!
  name: String
  groupId: String!
  perNetworkInfo: [NetworkTokenInfo!]!
  groupedFungibleTokens: [FungibleToken!]!
}

type UserResult {
  id: String!
  category: SearchResultCategory!
  title: String!
  imageUrl: String
  score: String
  address: Address!
  ens: String
  lens: String
  network: Network!
  farcaster: String
  account: Account!
}

type TransactionResult {
  id: String!
  category: SearchResultCategory!
  title: String!
  imageUrl: String
  score: String
  hash: String!
  network: Network!
}

"""Address"""
scalar Address

"""Big decimal scalar"""
scalar BigDecimal

"""Ethereum Name Service"""
scalar Ens

"""
Float in percent points without the "%" character, standard range between 0 and 100 (e.g. 62.4 means 62.4%)
"""
scalar Percentage

scalar JSON

type Query {
  portfolio(
    """The wallet addresses for which to fetch balances for."""
    addresses: [Address!]!

    """The networks on which to fetch balances for."""
    networks: [Network!]

    """The appIds for which to fetch balances for."""
    appIds: [String!]

    """Whether to include NFT overrides in the balances."""
    withOverrides: Boolean = false
  ): Portfolio! @deprecated(reason: "Use portfolioV2 instead to ensure up to date data")
  balanceJobStatus(jobId: String!): BalanceJobStatus! @deprecated(reason: "Use portfolioV2 to avoid having to poll job statuses")
  transactionDetails(transactionHash: String!, network: Network!, realtimeInterpretation: Boolean = false): ActivityEvent @deprecated(reason: "Use transactionDetailsV2 instead")
  timelineEvent(key: String!, network: Network!, realtimeInterpretation: Boolean = false): ActivityEvent @deprecated(reason: "Use transactionDetailsV2 query instead.")
  transactionHistory(
    network: Network
    networks: [Network!]
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    spamFilter: Boolean = true
    realtimeInterpretation: Boolean = false
    startDate: Timestamp
    endDate: Timestamp
    addresses: [Address!]
    tokenAddresses: [Address!]
    isSigner: Boolean
    fromAddresses: [String!]
    toAddresses: [String!]
    sighashes: [String!]
    actionTypeIds: [Int!]
    experimentalSpamLess: Boolean
  ): ActivityEventConnection! @deprecated(reason: "Use transactionHistoryV2 instead")
  accountsTimeline(
    network: Network
    networks: [Network!]
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    spamFilter: Boolean = true
    realtimeInterpretation: Boolean = false
    startDate: Timestamp
    endDate: Timestamp
    addresses: [Address!]
    tokenAddresses: [Address!]
    isSigner: Boolean
    fromAddresses: [String!]
    toAddresses: [String!]
    sighashes: [String!]
    actionTypeIds: [Int!]
    experimentalSpamLess: Boolean
  ): ActivityEventConnection! @deprecated(reason: "Use transactionHistoryV2 query instead.")
  transactionsForApp(
    network: Network
    networks: [Network!]
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    spamFilter: Boolean = true
    realtimeInterpretation: Boolean = false
    startDate: Timestamp
    endDate: Timestamp
    slug: String!
  ): ActivityEventConnection!

  """
  Please use transactionsForApp query instead. This query will continue to work but may be deprecated in the future.
  """
  timelineForApp(
    network: Network
    networks: [Network!]
    first: Int

    """Cursor of an edge (excluded)"""
    after: String
    spamFilter: Boolean = true
    realtimeInterpretation: Boolean = false
    startDate: Timestamp
    endDate: Timestamp
    slug: String!
  ): ActivityEventConnection!
  account(address: Address, ens: String, basename: String): Account
  accounts(addresses: [Address!], ens: [String!], basenames: [String!]): [Account!]!
  farcasterProfile(username: String, fid: Int): FarcasterProfile
  appDetailsById(appId: String!): App!
  nftNetWorth(addresses: [Address!]!, network: Network, withOverrides: Boolean): BigDecimal
  nftUsersCollections(
    network: Network
    networks: [Network!]
    minCollectionValueUsd: Float
    search: String

    """Deprecated: use `collectionIds` instead"""
    collections: [Address!]

    """Deprecated: use `collectionIds` instead"""
    collectionInputs: [NftCollectionInput!]
    collectionIds: [ID!]
    standard: NftStandard
    onlyHidden: Boolean

    """
    Nullable will be removed in the future so do not send something nullable
    """
    owners: [Address!]
    first: Int = 24

    """Cursor of an edge (excluded)"""
    after: String
    input: NftUsersCollectionsConnectionInput
    withOverrides: Boolean
  ): NftUserCollectionConnection!
  nftUsersTokens(
    network: Network
    networks: [Network!]
    minEstimatedValueUsd: Float
    search: String

    """Deprecated: use `collectionIds` instead"""
    collections: [Address!]

    """Deprecated: use `collectionIds` instead"""
    collectionInputs: [NftCollectionInput!]
    collectionIds: [ID!]
    standard: NftStandard
    onlyHidden: Boolean
    bypassHidden: Boolean

    """
    Nullable will be removed in the future so do not send something nullable
    """
    owners: [Address!]
    first: Int = 24

    """Cursor of an edge (excluded)"""
    after: String
    input: NftUsersTokensConnectionInput
    withOverrides: Boolean
  ): NftUserTokenConnection!
  nftToken(collectionAddress: String!, network: Network!, tokenId: String!): NFT
  nftCollection(input: NftCollectionInput): NftCollection
  nftCollections(collections: [NftCollectionInput!]!): [NftCollection!]!
  nftCollectionsForDeployers(input: NftCollectionsForDeployersInput!): NftCollectionsForOwnersCollectionsConnection!
  nftCollectionsForOwners(input: NftCollectionsForOwnersInput!): NftCollectionsForOwnersCollectionsConnection!
  nftEventsFromBlock(input: NftEventInput!): NftEventConnection!
  fungibleToken(address: Address!, network: Network!): FungibleToken @deprecated(reason: "Use fungibleTokenV2 instead.")
  fungibleTokenV2(address: Address!, chainId: Int!): FungibleToken
  fungibleTokenBatch(tokens: [FungibleTokenInput!]!): [FungibleToken]! @deprecated(reason: "Use fungibleTokenBatchV2 instead.")
  fungibleTokenBatchV2(tokens: [FungibleTokenInputV2!]!): [FungibleToken]!
  contract(address: String!, network: Network!, allowInferred: Boolean = true): Contract! @deprecated(reason: "Use contractV2 instead.")
  contractV2(address: String!, chainId: Int!, allowInferred: Boolean = true): Contract!
  portfolioV2(addresses: [Address!]!, networks: [Network!], includeProxyAccounts: Boolean = true): PortfolioV2!
  transactionDetailsV2(hash: String!, network: Network!, index: Float, subject: Address): [TimelineEventV2!]
  transactionHistoryV2(subjects: [Address!]!, perspective: TransactionHistoryV2Perspective = Signer, first: Int = 10, after: String, filters: TransactionHistoryV2FiltersArgs): TransactionHistoryV2EntryConnection!
  search(input: SearchPublicInput!): OnchainSearchResults!
}

input NftCollectionInput {
  address: Address

  """Deprecated : Use `address` instead"""
  collectionAddress: String
  subCollectionIdentifier: String
  network: Network!
}

input NftUsersCollectionsConnectionInput {
  owners: [Address!]!
  network: Network
  minCollectionValueUsd: Float

  """Deprecated: use `collectionIds` instead"""
  collections: [Address!]

  """Deprecated: use `collectionIds` instead"""
  collectionInputs: [NftCollectionInput!]
  collectionIds: [ID!]
  standard: NftStandard
  search: String
  onlyHidden: Boolean
  withOverrides: Boolean
  first: Int = 24

  """Cursor of an edge (excluded)"""
  after: String
}

input NftUsersTokensConnectionInput {
  owners: [Address!]!
  network: Network
  networks: [Network!]
  minEstimatedValueUsd: Float

  """Deprecated: use `collectionIds` instead"""
  collections: [Address!]

  """Deprecated: use `collectionIds` instead"""
  collectionInputs: [NftCollectionInput!]
  collectionIds: [ID!]
  standard: NftStandard
  search: String
  onlyHidden: Boolean
  bypassHidden: Boolean
  withOverrides: Boolean
  first: Int = 24

  """Cursor of an edge (excluded)"""
  after: String
}

input NftCollectionsForDeployersInput {
  deployers: [Address!]
  first: Int

  """Cursor of an edge (excluded)"""
  after: String
  networks: [Network!]!
}

input NftCollectionsForOwnersInput {
  owners: [Address!]
  first: Int

  """Cursor of an edge (excluded)"""
  after: String
  networks: [Network!]!
}

input NftEventInput {
  network: Network!
  limit: Int!
  fromBlock: Int!
  untilBlock: Int
  after: String
}

input FungibleTokenInput {
  address: Address!
  network: Network!
}

input FungibleTokenInputV2 {
  address: Address!
  chainId: Int!
}

"""
The wallet's perspective of a transaction. The wallet can be the initiator of a transaction, or a receiving actor.
"""
enum TransactionHistoryV2Perspective {
  Signer
  Receiver
  All
}

input TransactionHistoryV2FiltersArgs {
  """Filter by network"""
  network: [Network!]

  """Filter by token transferred"""
  tokenAddress: [Address!]

  """
  Filter by which address signed the transaction, or which address sent a token
  """
  receivedFrom: [Address!]

  """Filter by which address received a token"""
  sentTo: [Address!]
  categories: [TransactionHistoryV2Category!]

  """
  Filter by which contract was used, typically the "to" field of the transaction
  """
  contractAddress: [Address!]
}

"""
The category of the events in the transaction history. Can be Swap, Brige, etc
"""
enum TransactionHistoryV2Category {
  Bridge
  Swap
  Nft_Sale
  Nft_Mint
}

input SearchPublicInput {
  search: String!
  networks: [Network!]
  maxResultsPerCategory: Float = 3
  categories: [OnchainSearchCategory!]
}

enum OnchainSearchCategory {
  ADDRESS_LABEL
  APP
  FARCASTER_PROFILE
  GAS_TOKEN
  UNIFIED_GAS_TOKEN
  ERC20_TOKEN
  NFT_COLLECTION
  UNIFIED_ERC20_TOKEN
  USER
  TRANSACTION
}

type Mutation {
  computeAppBalances(input: PortfolioInput!): BalanceJobId! @deprecated(reason: "Use appBalances from portfolioV2 to avoid having to use this compute mutation")
  computeTokenBalances(input: PortfolioInput!): BalanceJobId! @deprecated(reason: "Use tokenBalances from portfolioV2 to avoid having to use this compute mutation")
  refreshNftMetadata(id: ID!): NFT
}

input PortfolioInput {
  """The wallet addresses for which to fetch balances"""
  addresses: [Address!]!

  """The networks for which to fetch balances"""
  networks: [Network!]

  """The app slugs for which to fetch balances"""
  appIds: [String!]
  flagAsStale: Boolean
}