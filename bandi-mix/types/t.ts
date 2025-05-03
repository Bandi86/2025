export interface PrismaBase {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrismaUser extends PrismaBase {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  isAdmin: boolean;
  isPaid: boolean;
  isBanned: boolean;
  // comments: PrismaComment[];
  // subscription?: PrismaSubscription;
}

export interface PrismaAdminPosts extends PrismaBase {
  slug: string;
  title: string;
  content: string;
  imageurl?: string;
  // comments: PrismaComment[];
}

export interface PrismaFreeTipps extends PrismaBase {
  slug: string;
  title: string;
  content: string;
  // comments: PrismaComment[];
  deadline: string;
  price: number;
  prize: number;
  odds: number;
  imageurl: string;
}

export interface PrismaPremiumTipps extends PrismaBase {
  slug: string;
  title: string;
  content: string;
  // comments: PrismaComment[];
  deadline: string;
  price: number;
  prize: number;
  odds: number;
  imageurl: string;
}

export interface PrismaComment extends PrismaBase {
  content: string;
  hidden: boolean;
  userId: string;
  postId: string;
  freeTippId?: string;
  premiumTippId?: string;
}

export interface PrismaSubscription extends PrismaBase {
  userId: string;
  validUntil: string;
}

export interface PrismaFreeTipsStatistic extends PrismaBase {
  numberOfTipps: number;
  goodTippNumber: number;
  badTippNumber: number;
  AllBet: number;
  WinMoney: number;
  LostMoney: number;
}

// Frontend poszt meta típus, PrismaAdminPosts kiterjesztése
export interface PostMeta extends Omit<PrismaAdminPosts, 'content'> {
  isPremium?: boolean;
  deadline?: string;
  imageurl?: string;
  commentsCount?: number;
  content?: string;
}
