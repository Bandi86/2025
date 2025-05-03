
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model AdminPosts
 * 
 */
export type AdminPosts = $Result.DefaultSelection<Prisma.$AdminPostsPayload>
/**
 * Model FreeTipps
 * 
 */
export type FreeTipps = $Result.DefaultSelection<Prisma.$FreeTippsPayload>
/**
 * Model PremiumTipps
 * 
 */
export type PremiumTipps = $Result.DefaultSelection<Prisma.$PremiumTippsPayload>
/**
 * Model Comment
 * 
 */
export type Comment = $Result.DefaultSelection<Prisma.$CommentPayload>
/**
 * Model Subscription
 * 
 */
export type Subscription = $Result.DefaultSelection<Prisma.$SubscriptionPayload>
/**
 * Model freeTipsStatistic
 * 
 */
export type freeTipsStatistic = $Result.DefaultSelection<Prisma.$freeTipsStatisticPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.adminPosts`: Exposes CRUD operations for the **AdminPosts** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AdminPosts
    * const adminPosts = await prisma.adminPosts.findMany()
    * ```
    */
  get adminPosts(): Prisma.AdminPostsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.freeTipps`: Exposes CRUD operations for the **FreeTipps** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FreeTipps
    * const freeTipps = await prisma.freeTipps.findMany()
    * ```
    */
  get freeTipps(): Prisma.FreeTippsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.premiumTipps`: Exposes CRUD operations for the **PremiumTipps** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PremiumTipps
    * const premiumTipps = await prisma.premiumTipps.findMany()
    * ```
    */
  get premiumTipps(): Prisma.PremiumTippsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.comment`: Exposes CRUD operations for the **Comment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Comments
    * const comments = await prisma.comment.findMany()
    * ```
    */
  get comment(): Prisma.CommentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.subscription`: Exposes CRUD operations for the **Subscription** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Subscriptions
    * const subscriptions = await prisma.subscription.findMany()
    * ```
    */
  get subscription(): Prisma.SubscriptionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.freeTipsStatistic`: Exposes CRUD operations for the **freeTipsStatistic** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FreeTipsStatistics
    * const freeTipsStatistics = await prisma.freeTipsStatistic.findMany()
    * ```
    */
  get freeTipsStatistic(): Prisma.freeTipsStatisticDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.7.0
   * Query Engine version: 3cff47a7f5d65c3ea74883f1d736e41d68ce91ed
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    AdminPosts: 'AdminPosts',
    FreeTipps: 'FreeTipps',
    PremiumTipps: 'PremiumTipps',
    Comment: 'Comment',
    Subscription: 'Subscription',
    freeTipsStatistic: 'freeTipsStatistic'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "adminPosts" | "freeTipps" | "premiumTipps" | "comment" | "subscription" | "freeTipsStatistic"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      AdminPosts: {
        payload: Prisma.$AdminPostsPayload<ExtArgs>
        fields: Prisma.AdminPostsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AdminPostsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AdminPostsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload>
          }
          findFirst: {
            args: Prisma.AdminPostsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AdminPostsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload>
          }
          findMany: {
            args: Prisma.AdminPostsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload>[]
          }
          create: {
            args: Prisma.AdminPostsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload>
          }
          createMany: {
            args: Prisma.AdminPostsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AdminPostsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload>[]
          }
          delete: {
            args: Prisma.AdminPostsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload>
          }
          update: {
            args: Prisma.AdminPostsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload>
          }
          deleteMany: {
            args: Prisma.AdminPostsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AdminPostsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AdminPostsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload>[]
          }
          upsert: {
            args: Prisma.AdminPostsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPostsPayload>
          }
          aggregate: {
            args: Prisma.AdminPostsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAdminPosts>
          }
          groupBy: {
            args: Prisma.AdminPostsGroupByArgs<ExtArgs>
            result: $Utils.Optional<AdminPostsGroupByOutputType>[]
          }
          count: {
            args: Prisma.AdminPostsCountArgs<ExtArgs>
            result: $Utils.Optional<AdminPostsCountAggregateOutputType> | number
          }
        }
      }
      FreeTipps: {
        payload: Prisma.$FreeTippsPayload<ExtArgs>
        fields: Prisma.FreeTippsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FreeTippsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FreeTippsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload>
          }
          findFirst: {
            args: Prisma.FreeTippsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FreeTippsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload>
          }
          findMany: {
            args: Prisma.FreeTippsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload>[]
          }
          create: {
            args: Prisma.FreeTippsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload>
          }
          createMany: {
            args: Prisma.FreeTippsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FreeTippsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload>[]
          }
          delete: {
            args: Prisma.FreeTippsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload>
          }
          update: {
            args: Prisma.FreeTippsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload>
          }
          deleteMany: {
            args: Prisma.FreeTippsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FreeTippsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FreeTippsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload>[]
          }
          upsert: {
            args: Prisma.FreeTippsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FreeTippsPayload>
          }
          aggregate: {
            args: Prisma.FreeTippsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFreeTipps>
          }
          groupBy: {
            args: Prisma.FreeTippsGroupByArgs<ExtArgs>
            result: $Utils.Optional<FreeTippsGroupByOutputType>[]
          }
          count: {
            args: Prisma.FreeTippsCountArgs<ExtArgs>
            result: $Utils.Optional<FreeTippsCountAggregateOutputType> | number
          }
        }
      }
      PremiumTipps: {
        payload: Prisma.$PremiumTippsPayload<ExtArgs>
        fields: Prisma.PremiumTippsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PremiumTippsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PremiumTippsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload>
          }
          findFirst: {
            args: Prisma.PremiumTippsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PremiumTippsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload>
          }
          findMany: {
            args: Prisma.PremiumTippsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload>[]
          }
          create: {
            args: Prisma.PremiumTippsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload>
          }
          createMany: {
            args: Prisma.PremiumTippsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PremiumTippsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload>[]
          }
          delete: {
            args: Prisma.PremiumTippsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload>
          }
          update: {
            args: Prisma.PremiumTippsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload>
          }
          deleteMany: {
            args: Prisma.PremiumTippsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PremiumTippsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PremiumTippsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload>[]
          }
          upsert: {
            args: Prisma.PremiumTippsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PremiumTippsPayload>
          }
          aggregate: {
            args: Prisma.PremiumTippsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePremiumTipps>
          }
          groupBy: {
            args: Prisma.PremiumTippsGroupByArgs<ExtArgs>
            result: $Utils.Optional<PremiumTippsGroupByOutputType>[]
          }
          count: {
            args: Prisma.PremiumTippsCountArgs<ExtArgs>
            result: $Utils.Optional<PremiumTippsCountAggregateOutputType> | number
          }
        }
      }
      Comment: {
        payload: Prisma.$CommentPayload<ExtArgs>
        fields: Prisma.CommentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CommentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CommentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          findFirst: {
            args: Prisma.CommentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CommentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          findMany: {
            args: Prisma.CommentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          create: {
            args: Prisma.CommentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          createMany: {
            args: Prisma.CommentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CommentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          delete: {
            args: Prisma.CommentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          update: {
            args: Prisma.CommentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          deleteMany: {
            args: Prisma.CommentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CommentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CommentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          upsert: {
            args: Prisma.CommentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          aggregate: {
            args: Prisma.CommentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateComment>
          }
          groupBy: {
            args: Prisma.CommentGroupByArgs<ExtArgs>
            result: $Utils.Optional<CommentGroupByOutputType>[]
          }
          count: {
            args: Prisma.CommentCountArgs<ExtArgs>
            result: $Utils.Optional<CommentCountAggregateOutputType> | number
          }
        }
      }
      Subscription: {
        payload: Prisma.$SubscriptionPayload<ExtArgs>
        fields: Prisma.SubscriptionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SubscriptionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SubscriptionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          findFirst: {
            args: Prisma.SubscriptionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SubscriptionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          findMany: {
            args: Prisma.SubscriptionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[]
          }
          create: {
            args: Prisma.SubscriptionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          createMany: {
            args: Prisma.SubscriptionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SubscriptionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[]
          }
          delete: {
            args: Prisma.SubscriptionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          update: {
            args: Prisma.SubscriptionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          deleteMany: {
            args: Prisma.SubscriptionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SubscriptionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SubscriptionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[]
          }
          upsert: {
            args: Prisma.SubscriptionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          aggregate: {
            args: Prisma.SubscriptionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSubscription>
          }
          groupBy: {
            args: Prisma.SubscriptionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SubscriptionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SubscriptionCountArgs<ExtArgs>
            result: $Utils.Optional<SubscriptionCountAggregateOutputType> | number
          }
        }
      }
      freeTipsStatistic: {
        payload: Prisma.$freeTipsStatisticPayload<ExtArgs>
        fields: Prisma.freeTipsStatisticFieldRefs
        operations: {
          findUnique: {
            args: Prisma.freeTipsStatisticFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.freeTipsStatisticFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload>
          }
          findFirst: {
            args: Prisma.freeTipsStatisticFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.freeTipsStatisticFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload>
          }
          findMany: {
            args: Prisma.freeTipsStatisticFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload>[]
          }
          create: {
            args: Prisma.freeTipsStatisticCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload>
          }
          createMany: {
            args: Prisma.freeTipsStatisticCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.freeTipsStatisticCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload>[]
          }
          delete: {
            args: Prisma.freeTipsStatisticDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload>
          }
          update: {
            args: Prisma.freeTipsStatisticUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload>
          }
          deleteMany: {
            args: Prisma.freeTipsStatisticDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.freeTipsStatisticUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.freeTipsStatisticUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload>[]
          }
          upsert: {
            args: Prisma.freeTipsStatisticUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$freeTipsStatisticPayload>
          }
          aggregate: {
            args: Prisma.FreeTipsStatisticAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFreeTipsStatistic>
          }
          groupBy: {
            args: Prisma.freeTipsStatisticGroupByArgs<ExtArgs>
            result: $Utils.Optional<FreeTipsStatisticGroupByOutputType>[]
          }
          count: {
            args: Prisma.freeTipsStatisticCountArgs<ExtArgs>
            result: $Utils.Optional<FreeTipsStatisticCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    adminPosts?: AdminPostsOmit
    freeTipps?: FreeTippsOmit
    premiumTipps?: PremiumTippsOmit
    comment?: CommentOmit
    subscription?: SubscriptionOmit
    freeTipsStatistic?: freeTipsStatisticOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    comments: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | UserCountOutputTypeCountCommentsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
  }


  /**
   * Count Type AdminPostsCountOutputType
   */

  export type AdminPostsCountOutputType = {
    comments: number
  }

  export type AdminPostsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | AdminPostsCountOutputTypeCountCommentsArgs
  }

  // Custom InputTypes
  /**
   * AdminPostsCountOutputType without action
   */
  export type AdminPostsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPostsCountOutputType
     */
    select?: AdminPostsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AdminPostsCountOutputType without action
   */
  export type AdminPostsCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
  }


  /**
   * Count Type FreeTippsCountOutputType
   */

  export type FreeTippsCountOutputType = {
    comments: number
  }

  export type FreeTippsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | FreeTippsCountOutputTypeCountCommentsArgs
  }

  // Custom InputTypes
  /**
   * FreeTippsCountOutputType without action
   */
  export type FreeTippsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTippsCountOutputType
     */
    select?: FreeTippsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * FreeTippsCountOutputType without action
   */
  export type FreeTippsCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
  }


  /**
   * Count Type PremiumTippsCountOutputType
   */

  export type PremiumTippsCountOutputType = {
    comments: number
  }

  export type PremiumTippsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | PremiumTippsCountOutputTypeCountCommentsArgs
  }

  // Custom InputTypes
  /**
   * PremiumTippsCountOutputType without action
   */
  export type PremiumTippsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTippsCountOutputType
     */
    select?: PremiumTippsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PremiumTippsCountOutputType without action
   */
  export type PremiumTippsCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    username: string | null
    email: string | null
    password: string | null
    avatar: string | null
    isAdmin: boolean | null
    isPaid: boolean | null
    isBanned: boolean | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    username: string | null
    email: string | null
    password: string | null
    avatar: string | null
    isAdmin: boolean | null
    isPaid: boolean | null
    isBanned: boolean | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    username: number
    email: number
    password: number
    avatar: number
    isAdmin: number
    isPaid: number
    isBanned: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    username?: true
    email?: true
    password?: true
    avatar?: true
    isAdmin?: true
    isPaid?: true
    isBanned?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    username?: true
    email?: true
    password?: true
    avatar?: true
    isAdmin?: true
    isPaid?: true
    isBanned?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    username?: true
    email?: true
    password?: true
    avatar?: true
    isAdmin?: true
    isPaid?: true
    isBanned?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    username: string
    email: string
    password: string
    avatar: string | null
    isAdmin: boolean
    isPaid: boolean
    isBanned: boolean
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    email?: boolean
    password?: boolean
    avatar?: boolean
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
    comments?: boolean | User$commentsArgs<ExtArgs>
    subscription?: boolean | User$subscriptionArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    email?: boolean
    password?: boolean
    avatar?: boolean
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    email?: boolean
    password?: boolean
    avatar?: boolean
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    username?: boolean
    email?: boolean
    password?: boolean
    avatar?: boolean
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "username" | "email" | "password" | "avatar" | "isAdmin" | "isPaid" | "isBanned", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | User$commentsArgs<ExtArgs>
    subscription?: boolean | User$subscriptionArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      comments: Prisma.$CommentPayload<ExtArgs>[]
      subscription: Prisma.$SubscriptionPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      username: string
      email: string
      password: string
      avatar: string | null
      isAdmin: boolean
      isPaid: boolean
      isBanned: boolean
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    comments<T extends User$commentsArgs<ExtArgs> = {}>(args?: Subset<T, User$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    subscription<T extends User$subscriptionArgs<ExtArgs> = {}>(args?: Subset<T, User$subscriptionArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly username: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly avatar: FieldRef<"User", 'String'>
    readonly isAdmin: FieldRef<"User", 'Boolean'>
    readonly isPaid: FieldRef<"User", 'Boolean'>
    readonly isBanned: FieldRef<"User", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.comments
   */
  export type User$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * User.subscription
   */
  export type User$subscriptionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    where?: SubscriptionWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model AdminPosts
   */

  export type AggregateAdminPosts = {
    _count: AdminPostsCountAggregateOutputType | null
    _min: AdminPostsMinAggregateOutputType | null
    _max: AdminPostsMaxAggregateOutputType | null
  }

  export type AdminPostsMinAggregateOutputType = {
    id: string | null
    slug: string | null
    title: string | null
    content: string | null
    imageurl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AdminPostsMaxAggregateOutputType = {
    id: string | null
    slug: string | null
    title: string | null
    content: string | null
    imageurl: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AdminPostsCountAggregateOutputType = {
    id: number
    slug: number
    title: number
    content: number
    imageurl: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AdminPostsMinAggregateInputType = {
    id?: true
    slug?: true
    title?: true
    content?: true
    imageurl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AdminPostsMaxAggregateInputType = {
    id?: true
    slug?: true
    title?: true
    content?: true
    imageurl?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AdminPostsCountAggregateInputType = {
    id?: true
    slug?: true
    title?: true
    content?: true
    imageurl?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AdminPostsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AdminPosts to aggregate.
     */
    where?: AdminPostsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminPosts to fetch.
     */
    orderBy?: AdminPostsOrderByWithRelationInput | AdminPostsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AdminPostsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminPosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminPosts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AdminPosts
    **/
    _count?: true | AdminPostsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AdminPostsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AdminPostsMaxAggregateInputType
  }

  export type GetAdminPostsAggregateType<T extends AdminPostsAggregateArgs> = {
        [P in keyof T & keyof AggregateAdminPosts]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAdminPosts[P]>
      : GetScalarType<T[P], AggregateAdminPosts[P]>
  }




  export type AdminPostsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AdminPostsWhereInput
    orderBy?: AdminPostsOrderByWithAggregationInput | AdminPostsOrderByWithAggregationInput[]
    by: AdminPostsScalarFieldEnum[] | AdminPostsScalarFieldEnum
    having?: AdminPostsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AdminPostsCountAggregateInputType | true
    _min?: AdminPostsMinAggregateInputType
    _max?: AdminPostsMaxAggregateInputType
  }

  export type AdminPostsGroupByOutputType = {
    id: string
    slug: string
    title: string
    content: string
    imageurl: string
    createdAt: Date
    updatedAt: Date
    _count: AdminPostsCountAggregateOutputType | null
    _min: AdminPostsMinAggregateOutputType | null
    _max: AdminPostsMaxAggregateOutputType | null
  }

  type GetAdminPostsGroupByPayload<T extends AdminPostsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AdminPostsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AdminPostsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AdminPostsGroupByOutputType[P]>
            : GetScalarType<T[P], AdminPostsGroupByOutputType[P]>
        }
      >
    >


  export type AdminPostsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    imageurl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    comments?: boolean | AdminPosts$commentsArgs<ExtArgs>
    _count?: boolean | AdminPostsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["adminPosts"]>

  export type AdminPostsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    imageurl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["adminPosts"]>

  export type AdminPostsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    imageurl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["adminPosts"]>

  export type AdminPostsSelectScalar = {
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    imageurl?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AdminPostsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "slug" | "title" | "content" | "imageurl" | "createdAt" | "updatedAt", ExtArgs["result"]["adminPosts"]>
  export type AdminPostsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | AdminPosts$commentsArgs<ExtArgs>
    _count?: boolean | AdminPostsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AdminPostsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type AdminPostsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AdminPostsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AdminPosts"
    objects: {
      comments: Prisma.$CommentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      slug: string
      title: string
      content: string
      imageurl: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["adminPosts"]>
    composites: {}
  }

  type AdminPostsGetPayload<S extends boolean | null | undefined | AdminPostsDefaultArgs> = $Result.GetResult<Prisma.$AdminPostsPayload, S>

  type AdminPostsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AdminPostsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AdminPostsCountAggregateInputType | true
    }

  export interface AdminPostsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AdminPosts'], meta: { name: 'AdminPosts' } }
    /**
     * Find zero or one AdminPosts that matches the filter.
     * @param {AdminPostsFindUniqueArgs} args - Arguments to find a AdminPosts
     * @example
     * // Get one AdminPosts
     * const adminPosts = await prisma.adminPosts.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AdminPostsFindUniqueArgs>(args: SelectSubset<T, AdminPostsFindUniqueArgs<ExtArgs>>): Prisma__AdminPostsClient<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AdminPosts that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AdminPostsFindUniqueOrThrowArgs} args - Arguments to find a AdminPosts
     * @example
     * // Get one AdminPosts
     * const adminPosts = await prisma.adminPosts.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AdminPostsFindUniqueOrThrowArgs>(args: SelectSubset<T, AdminPostsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AdminPostsClient<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AdminPosts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminPostsFindFirstArgs} args - Arguments to find a AdminPosts
     * @example
     * // Get one AdminPosts
     * const adminPosts = await prisma.adminPosts.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AdminPostsFindFirstArgs>(args?: SelectSubset<T, AdminPostsFindFirstArgs<ExtArgs>>): Prisma__AdminPostsClient<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AdminPosts that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminPostsFindFirstOrThrowArgs} args - Arguments to find a AdminPosts
     * @example
     * // Get one AdminPosts
     * const adminPosts = await prisma.adminPosts.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AdminPostsFindFirstOrThrowArgs>(args?: SelectSubset<T, AdminPostsFindFirstOrThrowArgs<ExtArgs>>): Prisma__AdminPostsClient<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AdminPosts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminPostsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AdminPosts
     * const adminPosts = await prisma.adminPosts.findMany()
     * 
     * // Get first 10 AdminPosts
     * const adminPosts = await prisma.adminPosts.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const adminPostsWithIdOnly = await prisma.adminPosts.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AdminPostsFindManyArgs>(args?: SelectSubset<T, AdminPostsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AdminPosts.
     * @param {AdminPostsCreateArgs} args - Arguments to create a AdminPosts.
     * @example
     * // Create one AdminPosts
     * const AdminPosts = await prisma.adminPosts.create({
     *   data: {
     *     // ... data to create a AdminPosts
     *   }
     * })
     * 
     */
    create<T extends AdminPostsCreateArgs>(args: SelectSubset<T, AdminPostsCreateArgs<ExtArgs>>): Prisma__AdminPostsClient<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AdminPosts.
     * @param {AdminPostsCreateManyArgs} args - Arguments to create many AdminPosts.
     * @example
     * // Create many AdminPosts
     * const adminPosts = await prisma.adminPosts.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AdminPostsCreateManyArgs>(args?: SelectSubset<T, AdminPostsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AdminPosts and returns the data saved in the database.
     * @param {AdminPostsCreateManyAndReturnArgs} args - Arguments to create many AdminPosts.
     * @example
     * // Create many AdminPosts
     * const adminPosts = await prisma.adminPosts.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AdminPosts and only return the `id`
     * const adminPostsWithIdOnly = await prisma.adminPosts.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AdminPostsCreateManyAndReturnArgs>(args?: SelectSubset<T, AdminPostsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AdminPosts.
     * @param {AdminPostsDeleteArgs} args - Arguments to delete one AdminPosts.
     * @example
     * // Delete one AdminPosts
     * const AdminPosts = await prisma.adminPosts.delete({
     *   where: {
     *     // ... filter to delete one AdminPosts
     *   }
     * })
     * 
     */
    delete<T extends AdminPostsDeleteArgs>(args: SelectSubset<T, AdminPostsDeleteArgs<ExtArgs>>): Prisma__AdminPostsClient<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AdminPosts.
     * @param {AdminPostsUpdateArgs} args - Arguments to update one AdminPosts.
     * @example
     * // Update one AdminPosts
     * const adminPosts = await prisma.adminPosts.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AdminPostsUpdateArgs>(args: SelectSubset<T, AdminPostsUpdateArgs<ExtArgs>>): Prisma__AdminPostsClient<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AdminPosts.
     * @param {AdminPostsDeleteManyArgs} args - Arguments to filter AdminPosts to delete.
     * @example
     * // Delete a few AdminPosts
     * const { count } = await prisma.adminPosts.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AdminPostsDeleteManyArgs>(args?: SelectSubset<T, AdminPostsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AdminPosts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminPostsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AdminPosts
     * const adminPosts = await prisma.adminPosts.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AdminPostsUpdateManyArgs>(args: SelectSubset<T, AdminPostsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AdminPosts and returns the data updated in the database.
     * @param {AdminPostsUpdateManyAndReturnArgs} args - Arguments to update many AdminPosts.
     * @example
     * // Update many AdminPosts
     * const adminPosts = await prisma.adminPosts.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AdminPosts and only return the `id`
     * const adminPostsWithIdOnly = await prisma.adminPosts.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AdminPostsUpdateManyAndReturnArgs>(args: SelectSubset<T, AdminPostsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AdminPosts.
     * @param {AdminPostsUpsertArgs} args - Arguments to update or create a AdminPosts.
     * @example
     * // Update or create a AdminPosts
     * const adminPosts = await prisma.adminPosts.upsert({
     *   create: {
     *     // ... data to create a AdminPosts
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AdminPosts we want to update
     *   }
     * })
     */
    upsert<T extends AdminPostsUpsertArgs>(args: SelectSubset<T, AdminPostsUpsertArgs<ExtArgs>>): Prisma__AdminPostsClient<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AdminPosts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminPostsCountArgs} args - Arguments to filter AdminPosts to count.
     * @example
     * // Count the number of AdminPosts
     * const count = await prisma.adminPosts.count({
     *   where: {
     *     // ... the filter for the AdminPosts we want to count
     *   }
     * })
    **/
    count<T extends AdminPostsCountArgs>(
      args?: Subset<T, AdminPostsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AdminPostsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AdminPosts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminPostsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AdminPostsAggregateArgs>(args: Subset<T, AdminPostsAggregateArgs>): Prisma.PrismaPromise<GetAdminPostsAggregateType<T>>

    /**
     * Group by AdminPosts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminPostsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AdminPostsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AdminPostsGroupByArgs['orderBy'] }
        : { orderBy?: AdminPostsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AdminPostsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAdminPostsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AdminPosts model
   */
  readonly fields: AdminPostsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AdminPosts.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AdminPostsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    comments<T extends AdminPosts$commentsArgs<ExtArgs> = {}>(args?: Subset<T, AdminPosts$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AdminPosts model
   */
  interface AdminPostsFieldRefs {
    readonly id: FieldRef<"AdminPosts", 'String'>
    readonly slug: FieldRef<"AdminPosts", 'String'>
    readonly title: FieldRef<"AdminPosts", 'String'>
    readonly content: FieldRef<"AdminPosts", 'String'>
    readonly imageurl: FieldRef<"AdminPosts", 'String'>
    readonly createdAt: FieldRef<"AdminPosts", 'DateTime'>
    readonly updatedAt: FieldRef<"AdminPosts", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AdminPosts findUnique
   */
  export type AdminPostsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
    /**
     * Filter, which AdminPosts to fetch.
     */
    where: AdminPostsWhereUniqueInput
  }

  /**
   * AdminPosts findUniqueOrThrow
   */
  export type AdminPostsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
    /**
     * Filter, which AdminPosts to fetch.
     */
    where: AdminPostsWhereUniqueInput
  }

  /**
   * AdminPosts findFirst
   */
  export type AdminPostsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
    /**
     * Filter, which AdminPosts to fetch.
     */
    where?: AdminPostsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminPosts to fetch.
     */
    orderBy?: AdminPostsOrderByWithRelationInput | AdminPostsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AdminPosts.
     */
    cursor?: AdminPostsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminPosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminPosts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AdminPosts.
     */
    distinct?: AdminPostsScalarFieldEnum | AdminPostsScalarFieldEnum[]
  }

  /**
   * AdminPosts findFirstOrThrow
   */
  export type AdminPostsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
    /**
     * Filter, which AdminPosts to fetch.
     */
    where?: AdminPostsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminPosts to fetch.
     */
    orderBy?: AdminPostsOrderByWithRelationInput | AdminPostsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AdminPosts.
     */
    cursor?: AdminPostsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminPosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminPosts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AdminPosts.
     */
    distinct?: AdminPostsScalarFieldEnum | AdminPostsScalarFieldEnum[]
  }

  /**
   * AdminPosts findMany
   */
  export type AdminPostsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
    /**
     * Filter, which AdminPosts to fetch.
     */
    where?: AdminPostsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminPosts to fetch.
     */
    orderBy?: AdminPostsOrderByWithRelationInput | AdminPostsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AdminPosts.
     */
    cursor?: AdminPostsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminPosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminPosts.
     */
    skip?: number
    distinct?: AdminPostsScalarFieldEnum | AdminPostsScalarFieldEnum[]
  }

  /**
   * AdminPosts create
   */
  export type AdminPostsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
    /**
     * The data needed to create a AdminPosts.
     */
    data: XOR<AdminPostsCreateInput, AdminPostsUncheckedCreateInput>
  }

  /**
   * AdminPosts createMany
   */
  export type AdminPostsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AdminPosts.
     */
    data: AdminPostsCreateManyInput | AdminPostsCreateManyInput[]
  }

  /**
   * AdminPosts createManyAndReturn
   */
  export type AdminPostsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * The data used to create many AdminPosts.
     */
    data: AdminPostsCreateManyInput | AdminPostsCreateManyInput[]
  }

  /**
   * AdminPosts update
   */
  export type AdminPostsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
    /**
     * The data needed to update a AdminPosts.
     */
    data: XOR<AdminPostsUpdateInput, AdminPostsUncheckedUpdateInput>
    /**
     * Choose, which AdminPosts to update.
     */
    where: AdminPostsWhereUniqueInput
  }

  /**
   * AdminPosts updateMany
   */
  export type AdminPostsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AdminPosts.
     */
    data: XOR<AdminPostsUpdateManyMutationInput, AdminPostsUncheckedUpdateManyInput>
    /**
     * Filter which AdminPosts to update
     */
    where?: AdminPostsWhereInput
    /**
     * Limit how many AdminPosts to update.
     */
    limit?: number
  }

  /**
   * AdminPosts updateManyAndReturn
   */
  export type AdminPostsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * The data used to update AdminPosts.
     */
    data: XOR<AdminPostsUpdateManyMutationInput, AdminPostsUncheckedUpdateManyInput>
    /**
     * Filter which AdminPosts to update
     */
    where?: AdminPostsWhereInput
    /**
     * Limit how many AdminPosts to update.
     */
    limit?: number
  }

  /**
   * AdminPosts upsert
   */
  export type AdminPostsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
    /**
     * The filter to search for the AdminPosts to update in case it exists.
     */
    where: AdminPostsWhereUniqueInput
    /**
     * In case the AdminPosts found by the `where` argument doesn't exist, create a new AdminPosts with this data.
     */
    create: XOR<AdminPostsCreateInput, AdminPostsUncheckedCreateInput>
    /**
     * In case the AdminPosts was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AdminPostsUpdateInput, AdminPostsUncheckedUpdateInput>
  }

  /**
   * AdminPosts delete
   */
  export type AdminPostsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
    /**
     * Filter which AdminPosts to delete.
     */
    where: AdminPostsWhereUniqueInput
  }

  /**
   * AdminPosts deleteMany
   */
  export type AdminPostsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AdminPosts to delete
     */
    where?: AdminPostsWhereInput
    /**
     * Limit how many AdminPosts to delete.
     */
    limit?: number
  }

  /**
   * AdminPosts.comments
   */
  export type AdminPosts$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * AdminPosts without action
   */
  export type AdminPostsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminPosts
     */
    select?: AdminPostsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminPosts
     */
    omit?: AdminPostsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminPostsInclude<ExtArgs> | null
  }


  /**
   * Model FreeTipps
   */

  export type AggregateFreeTipps = {
    _count: FreeTippsCountAggregateOutputType | null
    _avg: FreeTippsAvgAggregateOutputType | null
    _sum: FreeTippsSumAggregateOutputType | null
    _min: FreeTippsMinAggregateOutputType | null
    _max: FreeTippsMaxAggregateOutputType | null
  }

  export type FreeTippsAvgAggregateOutputType = {
    price: number | null
    prize: number | null
    odds: number | null
  }

  export type FreeTippsSumAggregateOutputType = {
    price: number | null
    prize: number | null
    odds: number | null
  }

  export type FreeTippsMinAggregateOutputType = {
    id: string | null
    slug: string | null
    title: string | null
    content: string | null
    imageurl: string | null
    deadline: Date | null
    price: number | null
    prize: number | null
    odds: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FreeTippsMaxAggregateOutputType = {
    id: string | null
    slug: string | null
    title: string | null
    content: string | null
    imageurl: string | null
    deadline: Date | null
    price: number | null
    prize: number | null
    odds: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FreeTippsCountAggregateOutputType = {
    id: number
    slug: number
    title: number
    content: number
    imageurl: number
    deadline: number
    price: number
    prize: number
    odds: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type FreeTippsAvgAggregateInputType = {
    price?: true
    prize?: true
    odds?: true
  }

  export type FreeTippsSumAggregateInputType = {
    price?: true
    prize?: true
    odds?: true
  }

  export type FreeTippsMinAggregateInputType = {
    id?: true
    slug?: true
    title?: true
    content?: true
    imageurl?: true
    deadline?: true
    price?: true
    prize?: true
    odds?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FreeTippsMaxAggregateInputType = {
    id?: true
    slug?: true
    title?: true
    content?: true
    imageurl?: true
    deadline?: true
    price?: true
    prize?: true
    odds?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FreeTippsCountAggregateInputType = {
    id?: true
    slug?: true
    title?: true
    content?: true
    imageurl?: true
    deadline?: true
    price?: true
    prize?: true
    odds?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type FreeTippsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FreeTipps to aggregate.
     */
    where?: FreeTippsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FreeTipps to fetch.
     */
    orderBy?: FreeTippsOrderByWithRelationInput | FreeTippsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FreeTippsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FreeTipps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FreeTipps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FreeTipps
    **/
    _count?: true | FreeTippsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FreeTippsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FreeTippsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FreeTippsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FreeTippsMaxAggregateInputType
  }

  export type GetFreeTippsAggregateType<T extends FreeTippsAggregateArgs> = {
        [P in keyof T & keyof AggregateFreeTipps]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFreeTipps[P]>
      : GetScalarType<T[P], AggregateFreeTipps[P]>
  }




  export type FreeTippsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FreeTippsWhereInput
    orderBy?: FreeTippsOrderByWithAggregationInput | FreeTippsOrderByWithAggregationInput[]
    by: FreeTippsScalarFieldEnum[] | FreeTippsScalarFieldEnum
    having?: FreeTippsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FreeTippsCountAggregateInputType | true
    _avg?: FreeTippsAvgAggregateInputType
    _sum?: FreeTippsSumAggregateInputType
    _min?: FreeTippsMinAggregateInputType
    _max?: FreeTippsMaxAggregateInputType
  }

  export type FreeTippsGroupByOutputType = {
    id: string
    slug: string
    title: string
    content: string
    imageurl: string | null
    deadline: Date
    price: number
    prize: number
    odds: number
    createdAt: Date
    updatedAt: Date
    _count: FreeTippsCountAggregateOutputType | null
    _avg: FreeTippsAvgAggregateOutputType | null
    _sum: FreeTippsSumAggregateOutputType | null
    _min: FreeTippsMinAggregateOutputType | null
    _max: FreeTippsMaxAggregateOutputType | null
  }

  type GetFreeTippsGroupByPayload<T extends FreeTippsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FreeTippsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FreeTippsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FreeTippsGroupByOutputType[P]>
            : GetScalarType<T[P], FreeTippsGroupByOutputType[P]>
        }
      >
    >


  export type FreeTippsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    imageurl?: boolean
    deadline?: boolean
    price?: boolean
    prize?: boolean
    odds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    comments?: boolean | FreeTipps$commentsArgs<ExtArgs>
    _count?: boolean | FreeTippsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["freeTipps"]>

  export type FreeTippsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    imageurl?: boolean
    deadline?: boolean
    price?: boolean
    prize?: boolean
    odds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["freeTipps"]>

  export type FreeTippsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    imageurl?: boolean
    deadline?: boolean
    price?: boolean
    prize?: boolean
    odds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["freeTipps"]>

  export type FreeTippsSelectScalar = {
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    imageurl?: boolean
    deadline?: boolean
    price?: boolean
    prize?: boolean
    odds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type FreeTippsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "slug" | "title" | "content" | "imageurl" | "deadline" | "price" | "prize" | "odds" | "createdAt" | "updatedAt", ExtArgs["result"]["freeTipps"]>
  export type FreeTippsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | FreeTipps$commentsArgs<ExtArgs>
    _count?: boolean | FreeTippsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type FreeTippsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type FreeTippsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $FreeTippsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FreeTipps"
    objects: {
      comments: Prisma.$CommentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      slug: string
      title: string
      content: string
      imageurl: string | null
      deadline: Date
      price: number
      prize: number
      odds: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["freeTipps"]>
    composites: {}
  }

  type FreeTippsGetPayload<S extends boolean | null | undefined | FreeTippsDefaultArgs> = $Result.GetResult<Prisma.$FreeTippsPayload, S>

  type FreeTippsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FreeTippsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FreeTippsCountAggregateInputType | true
    }

  export interface FreeTippsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FreeTipps'], meta: { name: 'FreeTipps' } }
    /**
     * Find zero or one FreeTipps that matches the filter.
     * @param {FreeTippsFindUniqueArgs} args - Arguments to find a FreeTipps
     * @example
     * // Get one FreeTipps
     * const freeTipps = await prisma.freeTipps.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FreeTippsFindUniqueArgs>(args: SelectSubset<T, FreeTippsFindUniqueArgs<ExtArgs>>): Prisma__FreeTippsClient<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one FreeTipps that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FreeTippsFindUniqueOrThrowArgs} args - Arguments to find a FreeTipps
     * @example
     * // Get one FreeTipps
     * const freeTipps = await prisma.freeTipps.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FreeTippsFindUniqueOrThrowArgs>(args: SelectSubset<T, FreeTippsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FreeTippsClient<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FreeTipps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FreeTippsFindFirstArgs} args - Arguments to find a FreeTipps
     * @example
     * // Get one FreeTipps
     * const freeTipps = await prisma.freeTipps.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FreeTippsFindFirstArgs>(args?: SelectSubset<T, FreeTippsFindFirstArgs<ExtArgs>>): Prisma__FreeTippsClient<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FreeTipps that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FreeTippsFindFirstOrThrowArgs} args - Arguments to find a FreeTipps
     * @example
     * // Get one FreeTipps
     * const freeTipps = await prisma.freeTipps.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FreeTippsFindFirstOrThrowArgs>(args?: SelectSubset<T, FreeTippsFindFirstOrThrowArgs<ExtArgs>>): Prisma__FreeTippsClient<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more FreeTipps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FreeTippsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FreeTipps
     * const freeTipps = await prisma.freeTipps.findMany()
     * 
     * // Get first 10 FreeTipps
     * const freeTipps = await prisma.freeTipps.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const freeTippsWithIdOnly = await prisma.freeTipps.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FreeTippsFindManyArgs>(args?: SelectSubset<T, FreeTippsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a FreeTipps.
     * @param {FreeTippsCreateArgs} args - Arguments to create a FreeTipps.
     * @example
     * // Create one FreeTipps
     * const FreeTipps = await prisma.freeTipps.create({
     *   data: {
     *     // ... data to create a FreeTipps
     *   }
     * })
     * 
     */
    create<T extends FreeTippsCreateArgs>(args: SelectSubset<T, FreeTippsCreateArgs<ExtArgs>>): Prisma__FreeTippsClient<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many FreeTipps.
     * @param {FreeTippsCreateManyArgs} args - Arguments to create many FreeTipps.
     * @example
     * // Create many FreeTipps
     * const freeTipps = await prisma.freeTipps.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FreeTippsCreateManyArgs>(args?: SelectSubset<T, FreeTippsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FreeTipps and returns the data saved in the database.
     * @param {FreeTippsCreateManyAndReturnArgs} args - Arguments to create many FreeTipps.
     * @example
     * // Create many FreeTipps
     * const freeTipps = await prisma.freeTipps.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FreeTipps and only return the `id`
     * const freeTippsWithIdOnly = await prisma.freeTipps.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FreeTippsCreateManyAndReturnArgs>(args?: SelectSubset<T, FreeTippsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a FreeTipps.
     * @param {FreeTippsDeleteArgs} args - Arguments to delete one FreeTipps.
     * @example
     * // Delete one FreeTipps
     * const FreeTipps = await prisma.freeTipps.delete({
     *   where: {
     *     // ... filter to delete one FreeTipps
     *   }
     * })
     * 
     */
    delete<T extends FreeTippsDeleteArgs>(args: SelectSubset<T, FreeTippsDeleteArgs<ExtArgs>>): Prisma__FreeTippsClient<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one FreeTipps.
     * @param {FreeTippsUpdateArgs} args - Arguments to update one FreeTipps.
     * @example
     * // Update one FreeTipps
     * const freeTipps = await prisma.freeTipps.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FreeTippsUpdateArgs>(args: SelectSubset<T, FreeTippsUpdateArgs<ExtArgs>>): Prisma__FreeTippsClient<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more FreeTipps.
     * @param {FreeTippsDeleteManyArgs} args - Arguments to filter FreeTipps to delete.
     * @example
     * // Delete a few FreeTipps
     * const { count } = await prisma.freeTipps.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FreeTippsDeleteManyArgs>(args?: SelectSubset<T, FreeTippsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FreeTipps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FreeTippsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FreeTipps
     * const freeTipps = await prisma.freeTipps.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FreeTippsUpdateManyArgs>(args: SelectSubset<T, FreeTippsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FreeTipps and returns the data updated in the database.
     * @param {FreeTippsUpdateManyAndReturnArgs} args - Arguments to update many FreeTipps.
     * @example
     * // Update many FreeTipps
     * const freeTipps = await prisma.freeTipps.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more FreeTipps and only return the `id`
     * const freeTippsWithIdOnly = await prisma.freeTipps.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FreeTippsUpdateManyAndReturnArgs>(args: SelectSubset<T, FreeTippsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one FreeTipps.
     * @param {FreeTippsUpsertArgs} args - Arguments to update or create a FreeTipps.
     * @example
     * // Update or create a FreeTipps
     * const freeTipps = await prisma.freeTipps.upsert({
     *   create: {
     *     // ... data to create a FreeTipps
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FreeTipps we want to update
     *   }
     * })
     */
    upsert<T extends FreeTippsUpsertArgs>(args: SelectSubset<T, FreeTippsUpsertArgs<ExtArgs>>): Prisma__FreeTippsClient<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of FreeTipps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FreeTippsCountArgs} args - Arguments to filter FreeTipps to count.
     * @example
     * // Count the number of FreeTipps
     * const count = await prisma.freeTipps.count({
     *   where: {
     *     // ... the filter for the FreeTipps we want to count
     *   }
     * })
    **/
    count<T extends FreeTippsCountArgs>(
      args?: Subset<T, FreeTippsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FreeTippsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FreeTipps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FreeTippsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FreeTippsAggregateArgs>(args: Subset<T, FreeTippsAggregateArgs>): Prisma.PrismaPromise<GetFreeTippsAggregateType<T>>

    /**
     * Group by FreeTipps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FreeTippsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FreeTippsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FreeTippsGroupByArgs['orderBy'] }
        : { orderBy?: FreeTippsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FreeTippsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFreeTippsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FreeTipps model
   */
  readonly fields: FreeTippsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FreeTipps.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FreeTippsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    comments<T extends FreeTipps$commentsArgs<ExtArgs> = {}>(args?: Subset<T, FreeTipps$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the FreeTipps model
   */
  interface FreeTippsFieldRefs {
    readonly id: FieldRef<"FreeTipps", 'String'>
    readonly slug: FieldRef<"FreeTipps", 'String'>
    readonly title: FieldRef<"FreeTipps", 'String'>
    readonly content: FieldRef<"FreeTipps", 'String'>
    readonly imageurl: FieldRef<"FreeTipps", 'String'>
    readonly deadline: FieldRef<"FreeTipps", 'DateTime'>
    readonly price: FieldRef<"FreeTipps", 'Int'>
    readonly prize: FieldRef<"FreeTipps", 'Int'>
    readonly odds: FieldRef<"FreeTipps", 'Int'>
    readonly createdAt: FieldRef<"FreeTipps", 'DateTime'>
    readonly updatedAt: FieldRef<"FreeTipps", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * FreeTipps findUnique
   */
  export type FreeTippsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    /**
     * Filter, which FreeTipps to fetch.
     */
    where: FreeTippsWhereUniqueInput
  }

  /**
   * FreeTipps findUniqueOrThrow
   */
  export type FreeTippsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    /**
     * Filter, which FreeTipps to fetch.
     */
    where: FreeTippsWhereUniqueInput
  }

  /**
   * FreeTipps findFirst
   */
  export type FreeTippsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    /**
     * Filter, which FreeTipps to fetch.
     */
    where?: FreeTippsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FreeTipps to fetch.
     */
    orderBy?: FreeTippsOrderByWithRelationInput | FreeTippsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FreeTipps.
     */
    cursor?: FreeTippsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FreeTipps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FreeTipps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FreeTipps.
     */
    distinct?: FreeTippsScalarFieldEnum | FreeTippsScalarFieldEnum[]
  }

  /**
   * FreeTipps findFirstOrThrow
   */
  export type FreeTippsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    /**
     * Filter, which FreeTipps to fetch.
     */
    where?: FreeTippsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FreeTipps to fetch.
     */
    orderBy?: FreeTippsOrderByWithRelationInput | FreeTippsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FreeTipps.
     */
    cursor?: FreeTippsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FreeTipps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FreeTipps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FreeTipps.
     */
    distinct?: FreeTippsScalarFieldEnum | FreeTippsScalarFieldEnum[]
  }

  /**
   * FreeTipps findMany
   */
  export type FreeTippsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    /**
     * Filter, which FreeTipps to fetch.
     */
    where?: FreeTippsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FreeTipps to fetch.
     */
    orderBy?: FreeTippsOrderByWithRelationInput | FreeTippsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FreeTipps.
     */
    cursor?: FreeTippsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FreeTipps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FreeTipps.
     */
    skip?: number
    distinct?: FreeTippsScalarFieldEnum | FreeTippsScalarFieldEnum[]
  }

  /**
   * FreeTipps create
   */
  export type FreeTippsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    /**
     * The data needed to create a FreeTipps.
     */
    data: XOR<FreeTippsCreateInput, FreeTippsUncheckedCreateInput>
  }

  /**
   * FreeTipps createMany
   */
  export type FreeTippsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FreeTipps.
     */
    data: FreeTippsCreateManyInput | FreeTippsCreateManyInput[]
  }

  /**
   * FreeTipps createManyAndReturn
   */
  export type FreeTippsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * The data used to create many FreeTipps.
     */
    data: FreeTippsCreateManyInput | FreeTippsCreateManyInput[]
  }

  /**
   * FreeTipps update
   */
  export type FreeTippsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    /**
     * The data needed to update a FreeTipps.
     */
    data: XOR<FreeTippsUpdateInput, FreeTippsUncheckedUpdateInput>
    /**
     * Choose, which FreeTipps to update.
     */
    where: FreeTippsWhereUniqueInput
  }

  /**
   * FreeTipps updateMany
   */
  export type FreeTippsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FreeTipps.
     */
    data: XOR<FreeTippsUpdateManyMutationInput, FreeTippsUncheckedUpdateManyInput>
    /**
     * Filter which FreeTipps to update
     */
    where?: FreeTippsWhereInput
    /**
     * Limit how many FreeTipps to update.
     */
    limit?: number
  }

  /**
   * FreeTipps updateManyAndReturn
   */
  export type FreeTippsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * The data used to update FreeTipps.
     */
    data: XOR<FreeTippsUpdateManyMutationInput, FreeTippsUncheckedUpdateManyInput>
    /**
     * Filter which FreeTipps to update
     */
    where?: FreeTippsWhereInput
    /**
     * Limit how many FreeTipps to update.
     */
    limit?: number
  }

  /**
   * FreeTipps upsert
   */
  export type FreeTippsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    /**
     * The filter to search for the FreeTipps to update in case it exists.
     */
    where: FreeTippsWhereUniqueInput
    /**
     * In case the FreeTipps found by the `where` argument doesn't exist, create a new FreeTipps with this data.
     */
    create: XOR<FreeTippsCreateInput, FreeTippsUncheckedCreateInput>
    /**
     * In case the FreeTipps was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FreeTippsUpdateInput, FreeTippsUncheckedUpdateInput>
  }

  /**
   * FreeTipps delete
   */
  export type FreeTippsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    /**
     * Filter which FreeTipps to delete.
     */
    where: FreeTippsWhereUniqueInput
  }

  /**
   * FreeTipps deleteMany
   */
  export type FreeTippsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FreeTipps to delete
     */
    where?: FreeTippsWhereInput
    /**
     * Limit how many FreeTipps to delete.
     */
    limit?: number
  }

  /**
   * FreeTipps.comments
   */
  export type FreeTipps$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * FreeTipps without action
   */
  export type FreeTippsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
  }


  /**
   * Model PremiumTipps
   */

  export type AggregatePremiumTipps = {
    _count: PremiumTippsCountAggregateOutputType | null
    _avg: PremiumTippsAvgAggregateOutputType | null
    _sum: PremiumTippsSumAggregateOutputType | null
    _min: PremiumTippsMinAggregateOutputType | null
    _max: PremiumTippsMaxAggregateOutputType | null
  }

  export type PremiumTippsAvgAggregateOutputType = {
    price: number | null
    prize: number | null
    odds: number | null
  }

  export type PremiumTippsSumAggregateOutputType = {
    price: number | null
    prize: number | null
    odds: number | null
  }

  export type PremiumTippsMinAggregateOutputType = {
    id: string | null
    slug: string | null
    title: string | null
    content: string | null
    deadline: Date | null
    imageurl: string | null
    price: number | null
    prize: number | null
    odds: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PremiumTippsMaxAggregateOutputType = {
    id: string | null
    slug: string | null
    title: string | null
    content: string | null
    deadline: Date | null
    imageurl: string | null
    price: number | null
    prize: number | null
    odds: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PremiumTippsCountAggregateOutputType = {
    id: number
    slug: number
    title: number
    content: number
    deadline: number
    imageurl: number
    price: number
    prize: number
    odds: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PremiumTippsAvgAggregateInputType = {
    price?: true
    prize?: true
    odds?: true
  }

  export type PremiumTippsSumAggregateInputType = {
    price?: true
    prize?: true
    odds?: true
  }

  export type PremiumTippsMinAggregateInputType = {
    id?: true
    slug?: true
    title?: true
    content?: true
    deadline?: true
    imageurl?: true
    price?: true
    prize?: true
    odds?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PremiumTippsMaxAggregateInputType = {
    id?: true
    slug?: true
    title?: true
    content?: true
    deadline?: true
    imageurl?: true
    price?: true
    prize?: true
    odds?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PremiumTippsCountAggregateInputType = {
    id?: true
    slug?: true
    title?: true
    content?: true
    deadline?: true
    imageurl?: true
    price?: true
    prize?: true
    odds?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PremiumTippsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PremiumTipps to aggregate.
     */
    where?: PremiumTippsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PremiumTipps to fetch.
     */
    orderBy?: PremiumTippsOrderByWithRelationInput | PremiumTippsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PremiumTippsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PremiumTipps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PremiumTipps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PremiumTipps
    **/
    _count?: true | PremiumTippsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PremiumTippsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PremiumTippsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PremiumTippsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PremiumTippsMaxAggregateInputType
  }

  export type GetPremiumTippsAggregateType<T extends PremiumTippsAggregateArgs> = {
        [P in keyof T & keyof AggregatePremiumTipps]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePremiumTipps[P]>
      : GetScalarType<T[P], AggregatePremiumTipps[P]>
  }




  export type PremiumTippsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PremiumTippsWhereInput
    orderBy?: PremiumTippsOrderByWithAggregationInput | PremiumTippsOrderByWithAggregationInput[]
    by: PremiumTippsScalarFieldEnum[] | PremiumTippsScalarFieldEnum
    having?: PremiumTippsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PremiumTippsCountAggregateInputType | true
    _avg?: PremiumTippsAvgAggregateInputType
    _sum?: PremiumTippsSumAggregateInputType
    _min?: PremiumTippsMinAggregateInputType
    _max?: PremiumTippsMaxAggregateInputType
  }

  export type PremiumTippsGroupByOutputType = {
    id: string
    slug: string
    title: string
    content: string
    deadline: Date
    imageurl: string | null
    price: number
    prize: number
    odds: number
    createdAt: Date
    updatedAt: Date
    _count: PremiumTippsCountAggregateOutputType | null
    _avg: PremiumTippsAvgAggregateOutputType | null
    _sum: PremiumTippsSumAggregateOutputType | null
    _min: PremiumTippsMinAggregateOutputType | null
    _max: PremiumTippsMaxAggregateOutputType | null
  }

  type GetPremiumTippsGroupByPayload<T extends PremiumTippsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PremiumTippsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PremiumTippsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PremiumTippsGroupByOutputType[P]>
            : GetScalarType<T[P], PremiumTippsGroupByOutputType[P]>
        }
      >
    >


  export type PremiumTippsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    deadline?: boolean
    imageurl?: boolean
    price?: boolean
    prize?: boolean
    odds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    comments?: boolean | PremiumTipps$commentsArgs<ExtArgs>
    _count?: boolean | PremiumTippsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["premiumTipps"]>

  export type PremiumTippsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    deadline?: boolean
    imageurl?: boolean
    price?: boolean
    prize?: boolean
    odds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["premiumTipps"]>

  export type PremiumTippsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    deadline?: boolean
    imageurl?: boolean
    price?: boolean
    prize?: boolean
    odds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["premiumTipps"]>

  export type PremiumTippsSelectScalar = {
    id?: boolean
    slug?: boolean
    title?: boolean
    content?: boolean
    deadline?: boolean
    imageurl?: boolean
    price?: boolean
    prize?: boolean
    odds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PremiumTippsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "slug" | "title" | "content" | "deadline" | "imageurl" | "price" | "prize" | "odds" | "createdAt" | "updatedAt", ExtArgs["result"]["premiumTipps"]>
  export type PremiumTippsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comments?: boolean | PremiumTipps$commentsArgs<ExtArgs>
    _count?: boolean | PremiumTippsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PremiumTippsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type PremiumTippsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PremiumTippsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PremiumTipps"
    objects: {
      comments: Prisma.$CommentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      slug: string
      title: string
      content: string
      deadline: Date
      imageurl: string | null
      price: number
      prize: number
      odds: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["premiumTipps"]>
    composites: {}
  }

  type PremiumTippsGetPayload<S extends boolean | null | undefined | PremiumTippsDefaultArgs> = $Result.GetResult<Prisma.$PremiumTippsPayload, S>

  type PremiumTippsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PremiumTippsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PremiumTippsCountAggregateInputType | true
    }

  export interface PremiumTippsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PremiumTipps'], meta: { name: 'PremiumTipps' } }
    /**
     * Find zero or one PremiumTipps that matches the filter.
     * @param {PremiumTippsFindUniqueArgs} args - Arguments to find a PremiumTipps
     * @example
     * // Get one PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PremiumTippsFindUniqueArgs>(args: SelectSubset<T, PremiumTippsFindUniqueArgs<ExtArgs>>): Prisma__PremiumTippsClient<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PremiumTipps that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PremiumTippsFindUniqueOrThrowArgs} args - Arguments to find a PremiumTipps
     * @example
     * // Get one PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PremiumTippsFindUniqueOrThrowArgs>(args: SelectSubset<T, PremiumTippsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PremiumTippsClient<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PremiumTipps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PremiumTippsFindFirstArgs} args - Arguments to find a PremiumTipps
     * @example
     * // Get one PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PremiumTippsFindFirstArgs>(args?: SelectSubset<T, PremiumTippsFindFirstArgs<ExtArgs>>): Prisma__PremiumTippsClient<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PremiumTipps that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PremiumTippsFindFirstOrThrowArgs} args - Arguments to find a PremiumTipps
     * @example
     * // Get one PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PremiumTippsFindFirstOrThrowArgs>(args?: SelectSubset<T, PremiumTippsFindFirstOrThrowArgs<ExtArgs>>): Prisma__PremiumTippsClient<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PremiumTipps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PremiumTippsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.findMany()
     * 
     * // Get first 10 PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const premiumTippsWithIdOnly = await prisma.premiumTipps.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PremiumTippsFindManyArgs>(args?: SelectSubset<T, PremiumTippsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PremiumTipps.
     * @param {PremiumTippsCreateArgs} args - Arguments to create a PremiumTipps.
     * @example
     * // Create one PremiumTipps
     * const PremiumTipps = await prisma.premiumTipps.create({
     *   data: {
     *     // ... data to create a PremiumTipps
     *   }
     * })
     * 
     */
    create<T extends PremiumTippsCreateArgs>(args: SelectSubset<T, PremiumTippsCreateArgs<ExtArgs>>): Prisma__PremiumTippsClient<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PremiumTipps.
     * @param {PremiumTippsCreateManyArgs} args - Arguments to create many PremiumTipps.
     * @example
     * // Create many PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PremiumTippsCreateManyArgs>(args?: SelectSubset<T, PremiumTippsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PremiumTipps and returns the data saved in the database.
     * @param {PremiumTippsCreateManyAndReturnArgs} args - Arguments to create many PremiumTipps.
     * @example
     * // Create many PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PremiumTipps and only return the `id`
     * const premiumTippsWithIdOnly = await prisma.premiumTipps.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PremiumTippsCreateManyAndReturnArgs>(args?: SelectSubset<T, PremiumTippsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PremiumTipps.
     * @param {PremiumTippsDeleteArgs} args - Arguments to delete one PremiumTipps.
     * @example
     * // Delete one PremiumTipps
     * const PremiumTipps = await prisma.premiumTipps.delete({
     *   where: {
     *     // ... filter to delete one PremiumTipps
     *   }
     * })
     * 
     */
    delete<T extends PremiumTippsDeleteArgs>(args: SelectSubset<T, PremiumTippsDeleteArgs<ExtArgs>>): Prisma__PremiumTippsClient<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PremiumTipps.
     * @param {PremiumTippsUpdateArgs} args - Arguments to update one PremiumTipps.
     * @example
     * // Update one PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PremiumTippsUpdateArgs>(args: SelectSubset<T, PremiumTippsUpdateArgs<ExtArgs>>): Prisma__PremiumTippsClient<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PremiumTipps.
     * @param {PremiumTippsDeleteManyArgs} args - Arguments to filter PremiumTipps to delete.
     * @example
     * // Delete a few PremiumTipps
     * const { count } = await prisma.premiumTipps.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PremiumTippsDeleteManyArgs>(args?: SelectSubset<T, PremiumTippsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PremiumTipps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PremiumTippsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PremiumTippsUpdateManyArgs>(args: SelectSubset<T, PremiumTippsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PremiumTipps and returns the data updated in the database.
     * @param {PremiumTippsUpdateManyAndReturnArgs} args - Arguments to update many PremiumTipps.
     * @example
     * // Update many PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PremiumTipps and only return the `id`
     * const premiumTippsWithIdOnly = await prisma.premiumTipps.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PremiumTippsUpdateManyAndReturnArgs>(args: SelectSubset<T, PremiumTippsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PremiumTipps.
     * @param {PremiumTippsUpsertArgs} args - Arguments to update or create a PremiumTipps.
     * @example
     * // Update or create a PremiumTipps
     * const premiumTipps = await prisma.premiumTipps.upsert({
     *   create: {
     *     // ... data to create a PremiumTipps
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PremiumTipps we want to update
     *   }
     * })
     */
    upsert<T extends PremiumTippsUpsertArgs>(args: SelectSubset<T, PremiumTippsUpsertArgs<ExtArgs>>): Prisma__PremiumTippsClient<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PremiumTipps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PremiumTippsCountArgs} args - Arguments to filter PremiumTipps to count.
     * @example
     * // Count the number of PremiumTipps
     * const count = await prisma.premiumTipps.count({
     *   where: {
     *     // ... the filter for the PremiumTipps we want to count
     *   }
     * })
    **/
    count<T extends PremiumTippsCountArgs>(
      args?: Subset<T, PremiumTippsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PremiumTippsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PremiumTipps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PremiumTippsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PremiumTippsAggregateArgs>(args: Subset<T, PremiumTippsAggregateArgs>): Prisma.PrismaPromise<GetPremiumTippsAggregateType<T>>

    /**
     * Group by PremiumTipps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PremiumTippsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PremiumTippsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PremiumTippsGroupByArgs['orderBy'] }
        : { orderBy?: PremiumTippsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PremiumTippsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPremiumTippsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PremiumTipps model
   */
  readonly fields: PremiumTippsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PremiumTipps.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PremiumTippsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    comments<T extends PremiumTipps$commentsArgs<ExtArgs> = {}>(args?: Subset<T, PremiumTipps$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PremiumTipps model
   */
  interface PremiumTippsFieldRefs {
    readonly id: FieldRef<"PremiumTipps", 'String'>
    readonly slug: FieldRef<"PremiumTipps", 'String'>
    readonly title: FieldRef<"PremiumTipps", 'String'>
    readonly content: FieldRef<"PremiumTipps", 'String'>
    readonly deadline: FieldRef<"PremiumTipps", 'DateTime'>
    readonly imageurl: FieldRef<"PremiumTipps", 'String'>
    readonly price: FieldRef<"PremiumTipps", 'Int'>
    readonly prize: FieldRef<"PremiumTipps", 'Int'>
    readonly odds: FieldRef<"PremiumTipps", 'Int'>
    readonly createdAt: FieldRef<"PremiumTipps", 'DateTime'>
    readonly updatedAt: FieldRef<"PremiumTipps", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PremiumTipps findUnique
   */
  export type PremiumTippsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    /**
     * Filter, which PremiumTipps to fetch.
     */
    where: PremiumTippsWhereUniqueInput
  }

  /**
   * PremiumTipps findUniqueOrThrow
   */
  export type PremiumTippsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    /**
     * Filter, which PremiumTipps to fetch.
     */
    where: PremiumTippsWhereUniqueInput
  }

  /**
   * PremiumTipps findFirst
   */
  export type PremiumTippsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    /**
     * Filter, which PremiumTipps to fetch.
     */
    where?: PremiumTippsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PremiumTipps to fetch.
     */
    orderBy?: PremiumTippsOrderByWithRelationInput | PremiumTippsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PremiumTipps.
     */
    cursor?: PremiumTippsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PremiumTipps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PremiumTipps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PremiumTipps.
     */
    distinct?: PremiumTippsScalarFieldEnum | PremiumTippsScalarFieldEnum[]
  }

  /**
   * PremiumTipps findFirstOrThrow
   */
  export type PremiumTippsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    /**
     * Filter, which PremiumTipps to fetch.
     */
    where?: PremiumTippsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PremiumTipps to fetch.
     */
    orderBy?: PremiumTippsOrderByWithRelationInput | PremiumTippsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PremiumTipps.
     */
    cursor?: PremiumTippsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PremiumTipps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PremiumTipps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PremiumTipps.
     */
    distinct?: PremiumTippsScalarFieldEnum | PremiumTippsScalarFieldEnum[]
  }

  /**
   * PremiumTipps findMany
   */
  export type PremiumTippsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    /**
     * Filter, which PremiumTipps to fetch.
     */
    where?: PremiumTippsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PremiumTipps to fetch.
     */
    orderBy?: PremiumTippsOrderByWithRelationInput | PremiumTippsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PremiumTipps.
     */
    cursor?: PremiumTippsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PremiumTipps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PremiumTipps.
     */
    skip?: number
    distinct?: PremiumTippsScalarFieldEnum | PremiumTippsScalarFieldEnum[]
  }

  /**
   * PremiumTipps create
   */
  export type PremiumTippsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    /**
     * The data needed to create a PremiumTipps.
     */
    data: XOR<PremiumTippsCreateInput, PremiumTippsUncheckedCreateInput>
  }

  /**
   * PremiumTipps createMany
   */
  export type PremiumTippsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PremiumTipps.
     */
    data: PremiumTippsCreateManyInput | PremiumTippsCreateManyInput[]
  }

  /**
   * PremiumTipps createManyAndReturn
   */
  export type PremiumTippsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * The data used to create many PremiumTipps.
     */
    data: PremiumTippsCreateManyInput | PremiumTippsCreateManyInput[]
  }

  /**
   * PremiumTipps update
   */
  export type PremiumTippsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    /**
     * The data needed to update a PremiumTipps.
     */
    data: XOR<PremiumTippsUpdateInput, PremiumTippsUncheckedUpdateInput>
    /**
     * Choose, which PremiumTipps to update.
     */
    where: PremiumTippsWhereUniqueInput
  }

  /**
   * PremiumTipps updateMany
   */
  export type PremiumTippsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PremiumTipps.
     */
    data: XOR<PremiumTippsUpdateManyMutationInput, PremiumTippsUncheckedUpdateManyInput>
    /**
     * Filter which PremiumTipps to update
     */
    where?: PremiumTippsWhereInput
    /**
     * Limit how many PremiumTipps to update.
     */
    limit?: number
  }

  /**
   * PremiumTipps updateManyAndReturn
   */
  export type PremiumTippsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * The data used to update PremiumTipps.
     */
    data: XOR<PremiumTippsUpdateManyMutationInput, PremiumTippsUncheckedUpdateManyInput>
    /**
     * Filter which PremiumTipps to update
     */
    where?: PremiumTippsWhereInput
    /**
     * Limit how many PremiumTipps to update.
     */
    limit?: number
  }

  /**
   * PremiumTipps upsert
   */
  export type PremiumTippsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    /**
     * The filter to search for the PremiumTipps to update in case it exists.
     */
    where: PremiumTippsWhereUniqueInput
    /**
     * In case the PremiumTipps found by the `where` argument doesn't exist, create a new PremiumTipps with this data.
     */
    create: XOR<PremiumTippsCreateInput, PremiumTippsUncheckedCreateInput>
    /**
     * In case the PremiumTipps was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PremiumTippsUpdateInput, PremiumTippsUncheckedUpdateInput>
  }

  /**
   * PremiumTipps delete
   */
  export type PremiumTippsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    /**
     * Filter which PremiumTipps to delete.
     */
    where: PremiumTippsWhereUniqueInput
  }

  /**
   * PremiumTipps deleteMany
   */
  export type PremiumTippsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PremiumTipps to delete
     */
    where?: PremiumTippsWhereInput
    /**
     * Limit how many PremiumTipps to delete.
     */
    limit?: number
  }

  /**
   * PremiumTipps.comments
   */
  export type PremiumTipps$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * PremiumTipps without action
   */
  export type PremiumTippsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
  }


  /**
   * Model Comment
   */

  export type AggregateComment = {
    _count: CommentCountAggregateOutputType | null
    _min: CommentMinAggregateOutputType | null
    _max: CommentMaxAggregateOutputType | null
  }

  export type CommentMinAggregateOutputType = {
    id: string | null
    content: string | null
    hidden: boolean | null
    userId: string | null
    postId: string | null
    freeTippId: string | null
    premiumTippId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CommentMaxAggregateOutputType = {
    id: string | null
    content: string | null
    hidden: boolean | null
    userId: string | null
    postId: string | null
    freeTippId: string | null
    premiumTippId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CommentCountAggregateOutputType = {
    id: number
    content: number
    hidden: number
    userId: number
    postId: number
    freeTippId: number
    premiumTippId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CommentMinAggregateInputType = {
    id?: true
    content?: true
    hidden?: true
    userId?: true
    postId?: true
    freeTippId?: true
    premiumTippId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CommentMaxAggregateInputType = {
    id?: true
    content?: true
    hidden?: true
    userId?: true
    postId?: true
    freeTippId?: true
    premiumTippId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CommentCountAggregateInputType = {
    id?: true
    content?: true
    hidden?: true
    userId?: true
    postId?: true
    freeTippId?: true
    premiumTippId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CommentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Comment to aggregate.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Comments
    **/
    _count?: true | CommentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CommentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CommentMaxAggregateInputType
  }

  export type GetCommentAggregateType<T extends CommentAggregateArgs> = {
        [P in keyof T & keyof AggregateComment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateComment[P]>
      : GetScalarType<T[P], AggregateComment[P]>
  }




  export type CommentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithAggregationInput | CommentOrderByWithAggregationInput[]
    by: CommentScalarFieldEnum[] | CommentScalarFieldEnum
    having?: CommentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CommentCountAggregateInputType | true
    _min?: CommentMinAggregateInputType
    _max?: CommentMaxAggregateInputType
  }

  export type CommentGroupByOutputType = {
    id: string
    content: string
    hidden: boolean
    userId: string
    postId: string
    freeTippId: string | null
    premiumTippId: string | null
    createdAt: Date
    updatedAt: Date
    _count: CommentCountAggregateOutputType | null
    _min: CommentMinAggregateOutputType | null
    _max: CommentMaxAggregateOutputType | null
  }

  type GetCommentGroupByPayload<T extends CommentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CommentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CommentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CommentGroupByOutputType[P]>
            : GetScalarType<T[P], CommentGroupByOutputType[P]>
        }
      >
    >


  export type CommentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    hidden?: boolean
    userId?: boolean
    postId?: boolean
    freeTippId?: boolean
    premiumTippId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    post?: boolean | AdminPostsDefaultArgs<ExtArgs>
    freeTipp?: boolean | Comment$freeTippArgs<ExtArgs>
    premiumTipp?: boolean | Comment$premiumTippArgs<ExtArgs>
  }, ExtArgs["result"]["comment"]>

  export type CommentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    hidden?: boolean
    userId?: boolean
    postId?: boolean
    freeTippId?: boolean
    premiumTippId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    post?: boolean | AdminPostsDefaultArgs<ExtArgs>
    freeTipp?: boolean | Comment$freeTippArgs<ExtArgs>
    premiumTipp?: boolean | Comment$premiumTippArgs<ExtArgs>
  }, ExtArgs["result"]["comment"]>

  export type CommentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    hidden?: boolean
    userId?: boolean
    postId?: boolean
    freeTippId?: boolean
    premiumTippId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    post?: boolean | AdminPostsDefaultArgs<ExtArgs>
    freeTipp?: boolean | Comment$freeTippArgs<ExtArgs>
    premiumTipp?: boolean | Comment$premiumTippArgs<ExtArgs>
  }, ExtArgs["result"]["comment"]>

  export type CommentSelectScalar = {
    id?: boolean
    content?: boolean
    hidden?: boolean
    userId?: boolean
    postId?: boolean
    freeTippId?: boolean
    premiumTippId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CommentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "content" | "hidden" | "userId" | "postId" | "freeTippId" | "premiumTippId" | "createdAt" | "updatedAt", ExtArgs["result"]["comment"]>
  export type CommentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    post?: boolean | AdminPostsDefaultArgs<ExtArgs>
    freeTipp?: boolean | Comment$freeTippArgs<ExtArgs>
    premiumTipp?: boolean | Comment$premiumTippArgs<ExtArgs>
  }
  export type CommentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    post?: boolean | AdminPostsDefaultArgs<ExtArgs>
    freeTipp?: boolean | Comment$freeTippArgs<ExtArgs>
    premiumTipp?: boolean | Comment$premiumTippArgs<ExtArgs>
  }
  export type CommentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    post?: boolean | AdminPostsDefaultArgs<ExtArgs>
    freeTipp?: boolean | Comment$freeTippArgs<ExtArgs>
    premiumTipp?: boolean | Comment$premiumTippArgs<ExtArgs>
  }

  export type $CommentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Comment"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      post: Prisma.$AdminPostsPayload<ExtArgs>
      freeTipp: Prisma.$FreeTippsPayload<ExtArgs> | null
      premiumTipp: Prisma.$PremiumTippsPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      content: string
      hidden: boolean
      userId: string
      postId: string
      freeTippId: string | null
      premiumTippId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["comment"]>
    composites: {}
  }

  type CommentGetPayload<S extends boolean | null | undefined | CommentDefaultArgs> = $Result.GetResult<Prisma.$CommentPayload, S>

  type CommentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CommentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CommentCountAggregateInputType | true
    }

  export interface CommentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Comment'], meta: { name: 'Comment' } }
    /**
     * Find zero or one Comment that matches the filter.
     * @param {CommentFindUniqueArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CommentFindUniqueArgs>(args: SelectSubset<T, CommentFindUniqueArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Comment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CommentFindUniqueOrThrowArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CommentFindUniqueOrThrowArgs>(args: SelectSubset<T, CommentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Comment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindFirstArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CommentFindFirstArgs>(args?: SelectSubset<T, CommentFindFirstArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Comment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindFirstOrThrowArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CommentFindFirstOrThrowArgs>(args?: SelectSubset<T, CommentFindFirstOrThrowArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Comments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Comments
     * const comments = await prisma.comment.findMany()
     * 
     * // Get first 10 Comments
     * const comments = await prisma.comment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const commentWithIdOnly = await prisma.comment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CommentFindManyArgs>(args?: SelectSubset<T, CommentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Comment.
     * @param {CommentCreateArgs} args - Arguments to create a Comment.
     * @example
     * // Create one Comment
     * const Comment = await prisma.comment.create({
     *   data: {
     *     // ... data to create a Comment
     *   }
     * })
     * 
     */
    create<T extends CommentCreateArgs>(args: SelectSubset<T, CommentCreateArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Comments.
     * @param {CommentCreateManyArgs} args - Arguments to create many Comments.
     * @example
     * // Create many Comments
     * const comment = await prisma.comment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CommentCreateManyArgs>(args?: SelectSubset<T, CommentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Comments and returns the data saved in the database.
     * @param {CommentCreateManyAndReturnArgs} args - Arguments to create many Comments.
     * @example
     * // Create many Comments
     * const comment = await prisma.comment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Comments and only return the `id`
     * const commentWithIdOnly = await prisma.comment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CommentCreateManyAndReturnArgs>(args?: SelectSubset<T, CommentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Comment.
     * @param {CommentDeleteArgs} args - Arguments to delete one Comment.
     * @example
     * // Delete one Comment
     * const Comment = await prisma.comment.delete({
     *   where: {
     *     // ... filter to delete one Comment
     *   }
     * })
     * 
     */
    delete<T extends CommentDeleteArgs>(args: SelectSubset<T, CommentDeleteArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Comment.
     * @param {CommentUpdateArgs} args - Arguments to update one Comment.
     * @example
     * // Update one Comment
     * const comment = await prisma.comment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CommentUpdateArgs>(args: SelectSubset<T, CommentUpdateArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Comments.
     * @param {CommentDeleteManyArgs} args - Arguments to filter Comments to delete.
     * @example
     * // Delete a few Comments
     * const { count } = await prisma.comment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CommentDeleteManyArgs>(args?: SelectSubset<T, CommentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Comments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Comments
     * const comment = await prisma.comment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CommentUpdateManyArgs>(args: SelectSubset<T, CommentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Comments and returns the data updated in the database.
     * @param {CommentUpdateManyAndReturnArgs} args - Arguments to update many Comments.
     * @example
     * // Update many Comments
     * const comment = await prisma.comment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Comments and only return the `id`
     * const commentWithIdOnly = await prisma.comment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CommentUpdateManyAndReturnArgs>(args: SelectSubset<T, CommentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Comment.
     * @param {CommentUpsertArgs} args - Arguments to update or create a Comment.
     * @example
     * // Update or create a Comment
     * const comment = await prisma.comment.upsert({
     *   create: {
     *     // ... data to create a Comment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Comment we want to update
     *   }
     * })
     */
    upsert<T extends CommentUpsertArgs>(args: SelectSubset<T, CommentUpsertArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Comments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentCountArgs} args - Arguments to filter Comments to count.
     * @example
     * // Count the number of Comments
     * const count = await prisma.comment.count({
     *   where: {
     *     // ... the filter for the Comments we want to count
     *   }
     * })
    **/
    count<T extends CommentCountArgs>(
      args?: Subset<T, CommentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CommentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Comment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CommentAggregateArgs>(args: Subset<T, CommentAggregateArgs>): Prisma.PrismaPromise<GetCommentAggregateType<T>>

    /**
     * Group by Comment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CommentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CommentGroupByArgs['orderBy'] }
        : { orderBy?: CommentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CommentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCommentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Comment model
   */
  readonly fields: CommentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Comment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CommentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    post<T extends AdminPostsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AdminPostsDefaultArgs<ExtArgs>>): Prisma__AdminPostsClient<$Result.GetResult<Prisma.$AdminPostsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    freeTipp<T extends Comment$freeTippArgs<ExtArgs> = {}>(args?: Subset<T, Comment$freeTippArgs<ExtArgs>>): Prisma__FreeTippsClient<$Result.GetResult<Prisma.$FreeTippsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    premiumTipp<T extends Comment$premiumTippArgs<ExtArgs> = {}>(args?: Subset<T, Comment$premiumTippArgs<ExtArgs>>): Prisma__PremiumTippsClient<$Result.GetResult<Prisma.$PremiumTippsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Comment model
   */
  interface CommentFieldRefs {
    readonly id: FieldRef<"Comment", 'String'>
    readonly content: FieldRef<"Comment", 'String'>
    readonly hidden: FieldRef<"Comment", 'Boolean'>
    readonly userId: FieldRef<"Comment", 'String'>
    readonly postId: FieldRef<"Comment", 'String'>
    readonly freeTippId: FieldRef<"Comment", 'String'>
    readonly premiumTippId: FieldRef<"Comment", 'String'>
    readonly createdAt: FieldRef<"Comment", 'DateTime'>
    readonly updatedAt: FieldRef<"Comment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Comment findUnique
   */
  export type CommentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment findUniqueOrThrow
   */
  export type CommentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment findFirst
   */
  export type CommentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Comments.
     */
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment findFirstOrThrow
   */
  export type CommentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Comments.
     */
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment findMany
   */
  export type CommentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comments to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment create
   */
  export type CommentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The data needed to create a Comment.
     */
    data: XOR<CommentCreateInput, CommentUncheckedCreateInput>
  }

  /**
   * Comment createMany
   */
  export type CommentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Comments.
     */
    data: CommentCreateManyInput | CommentCreateManyInput[]
  }

  /**
   * Comment createManyAndReturn
   */
  export type CommentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * The data used to create many Comments.
     */
    data: CommentCreateManyInput | CommentCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Comment update
   */
  export type CommentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The data needed to update a Comment.
     */
    data: XOR<CommentUpdateInput, CommentUncheckedUpdateInput>
    /**
     * Choose, which Comment to update.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment updateMany
   */
  export type CommentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Comments.
     */
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyInput>
    /**
     * Filter which Comments to update
     */
    where?: CommentWhereInput
    /**
     * Limit how many Comments to update.
     */
    limit?: number
  }

  /**
   * Comment updateManyAndReturn
   */
  export type CommentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * The data used to update Comments.
     */
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyInput>
    /**
     * Filter which Comments to update
     */
    where?: CommentWhereInput
    /**
     * Limit how many Comments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Comment upsert
   */
  export type CommentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The filter to search for the Comment to update in case it exists.
     */
    where: CommentWhereUniqueInput
    /**
     * In case the Comment found by the `where` argument doesn't exist, create a new Comment with this data.
     */
    create: XOR<CommentCreateInput, CommentUncheckedCreateInput>
    /**
     * In case the Comment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CommentUpdateInput, CommentUncheckedUpdateInput>
  }

  /**
   * Comment delete
   */
  export type CommentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter which Comment to delete.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment deleteMany
   */
  export type CommentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Comments to delete
     */
    where?: CommentWhereInput
    /**
     * Limit how many Comments to delete.
     */
    limit?: number
  }

  /**
   * Comment.freeTipp
   */
  export type Comment$freeTippArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FreeTipps
     */
    select?: FreeTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FreeTipps
     */
    omit?: FreeTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FreeTippsInclude<ExtArgs> | null
    where?: FreeTippsWhereInput
  }

  /**
   * Comment.premiumTipp
   */
  export type Comment$premiumTippArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PremiumTipps
     */
    select?: PremiumTippsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PremiumTipps
     */
    omit?: PremiumTippsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PremiumTippsInclude<ExtArgs> | null
    where?: PremiumTippsWhereInput
  }

  /**
   * Comment without action
   */
  export type CommentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
  }


  /**
   * Model Subscription
   */

  export type AggregateSubscription = {
    _count: SubscriptionCountAggregateOutputType | null
    _min: SubscriptionMinAggregateOutputType | null
    _max: SubscriptionMaxAggregateOutputType | null
  }

  export type SubscriptionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    validUntil: Date | null
  }

  export type SubscriptionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    validUntil: Date | null
  }

  export type SubscriptionCountAggregateOutputType = {
    id: number
    userId: number
    validUntil: number
    _all: number
  }


  export type SubscriptionMinAggregateInputType = {
    id?: true
    userId?: true
    validUntil?: true
  }

  export type SubscriptionMaxAggregateInputType = {
    id?: true
    userId?: true
    validUntil?: true
  }

  export type SubscriptionCountAggregateInputType = {
    id?: true
    userId?: true
    validUntil?: true
    _all?: true
  }

  export type SubscriptionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscription to aggregate.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Subscriptions
    **/
    _count?: true | SubscriptionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SubscriptionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SubscriptionMaxAggregateInputType
  }

  export type GetSubscriptionAggregateType<T extends SubscriptionAggregateArgs> = {
        [P in keyof T & keyof AggregateSubscription]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubscription[P]>
      : GetScalarType<T[P], AggregateSubscription[P]>
  }




  export type SubscriptionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubscriptionWhereInput
    orderBy?: SubscriptionOrderByWithAggregationInput | SubscriptionOrderByWithAggregationInput[]
    by: SubscriptionScalarFieldEnum[] | SubscriptionScalarFieldEnum
    having?: SubscriptionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SubscriptionCountAggregateInputType | true
    _min?: SubscriptionMinAggregateInputType
    _max?: SubscriptionMaxAggregateInputType
  }

  export type SubscriptionGroupByOutputType = {
    id: string
    userId: string
    validUntil: Date
    _count: SubscriptionCountAggregateOutputType | null
    _min: SubscriptionMinAggregateOutputType | null
    _max: SubscriptionMaxAggregateOutputType | null
  }

  type GetSubscriptionGroupByPayload<T extends SubscriptionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubscriptionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SubscriptionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SubscriptionGroupByOutputType[P]>
            : GetScalarType<T[P], SubscriptionGroupByOutputType[P]>
        }
      >
    >


  export type SubscriptionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    validUntil?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subscription"]>

  export type SubscriptionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    validUntil?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subscription"]>

  export type SubscriptionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    validUntil?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subscription"]>

  export type SubscriptionSelectScalar = {
    id?: boolean
    userId?: boolean
    validUntil?: boolean
  }

  export type SubscriptionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "validUntil", ExtArgs["result"]["subscription"]>
  export type SubscriptionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SubscriptionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SubscriptionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SubscriptionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Subscription"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      validUntil: Date
    }, ExtArgs["result"]["subscription"]>
    composites: {}
  }

  type SubscriptionGetPayload<S extends boolean | null | undefined | SubscriptionDefaultArgs> = $Result.GetResult<Prisma.$SubscriptionPayload, S>

  type SubscriptionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SubscriptionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SubscriptionCountAggregateInputType | true
    }

  export interface SubscriptionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Subscription'], meta: { name: 'Subscription' } }
    /**
     * Find zero or one Subscription that matches the filter.
     * @param {SubscriptionFindUniqueArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubscriptionFindUniqueArgs>(args: SelectSubset<T, SubscriptionFindUniqueArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Subscription that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SubscriptionFindUniqueOrThrowArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubscriptionFindUniqueOrThrowArgs>(args: SelectSubset<T, SubscriptionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subscription that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindFirstArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubscriptionFindFirstArgs>(args?: SelectSubset<T, SubscriptionFindFirstArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subscription that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindFirstOrThrowArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubscriptionFindFirstOrThrowArgs>(args?: SelectSubset<T, SubscriptionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Subscriptions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Subscriptions
     * const subscriptions = await prisma.subscription.findMany()
     * 
     * // Get first 10 Subscriptions
     * const subscriptions = await prisma.subscription.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SubscriptionFindManyArgs>(args?: SelectSubset<T, SubscriptionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Subscription.
     * @param {SubscriptionCreateArgs} args - Arguments to create a Subscription.
     * @example
     * // Create one Subscription
     * const Subscription = await prisma.subscription.create({
     *   data: {
     *     // ... data to create a Subscription
     *   }
     * })
     * 
     */
    create<T extends SubscriptionCreateArgs>(args: SelectSubset<T, SubscriptionCreateArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Subscriptions.
     * @param {SubscriptionCreateManyArgs} args - Arguments to create many Subscriptions.
     * @example
     * // Create many Subscriptions
     * const subscription = await prisma.subscription.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SubscriptionCreateManyArgs>(args?: SelectSubset<T, SubscriptionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Subscriptions and returns the data saved in the database.
     * @param {SubscriptionCreateManyAndReturnArgs} args - Arguments to create many Subscriptions.
     * @example
     * // Create many Subscriptions
     * const subscription = await prisma.subscription.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Subscriptions and only return the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SubscriptionCreateManyAndReturnArgs>(args?: SelectSubset<T, SubscriptionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Subscription.
     * @param {SubscriptionDeleteArgs} args - Arguments to delete one Subscription.
     * @example
     * // Delete one Subscription
     * const Subscription = await prisma.subscription.delete({
     *   where: {
     *     // ... filter to delete one Subscription
     *   }
     * })
     * 
     */
    delete<T extends SubscriptionDeleteArgs>(args: SelectSubset<T, SubscriptionDeleteArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Subscription.
     * @param {SubscriptionUpdateArgs} args - Arguments to update one Subscription.
     * @example
     * // Update one Subscription
     * const subscription = await prisma.subscription.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SubscriptionUpdateArgs>(args: SelectSubset<T, SubscriptionUpdateArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Subscriptions.
     * @param {SubscriptionDeleteManyArgs} args - Arguments to filter Subscriptions to delete.
     * @example
     * // Delete a few Subscriptions
     * const { count } = await prisma.subscription.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SubscriptionDeleteManyArgs>(args?: SelectSubset<T, SubscriptionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Subscriptions
     * const subscription = await prisma.subscription.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SubscriptionUpdateManyArgs>(args: SelectSubset<T, SubscriptionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subscriptions and returns the data updated in the database.
     * @param {SubscriptionUpdateManyAndReturnArgs} args - Arguments to update many Subscriptions.
     * @example
     * // Update many Subscriptions
     * const subscription = await prisma.subscription.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Subscriptions and only return the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SubscriptionUpdateManyAndReturnArgs>(args: SelectSubset<T, SubscriptionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Subscription.
     * @param {SubscriptionUpsertArgs} args - Arguments to update or create a Subscription.
     * @example
     * // Update or create a Subscription
     * const subscription = await prisma.subscription.upsert({
     *   create: {
     *     // ... data to create a Subscription
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Subscription we want to update
     *   }
     * })
     */
    upsert<T extends SubscriptionUpsertArgs>(args: SelectSubset<T, SubscriptionUpsertArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Subscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionCountArgs} args - Arguments to filter Subscriptions to count.
     * @example
     * // Count the number of Subscriptions
     * const count = await prisma.subscription.count({
     *   where: {
     *     // ... the filter for the Subscriptions we want to count
     *   }
     * })
    **/
    count<T extends SubscriptionCountArgs>(
      args?: Subset<T, SubscriptionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SubscriptionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Subscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SubscriptionAggregateArgs>(args: Subset<T, SubscriptionAggregateArgs>): Prisma.PrismaPromise<GetSubscriptionAggregateType<T>>

    /**
     * Group by Subscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SubscriptionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubscriptionGroupByArgs['orderBy'] }
        : { orderBy?: SubscriptionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SubscriptionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubscriptionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Subscription model
   */
  readonly fields: SubscriptionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Subscription.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubscriptionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Subscription model
   */
  interface SubscriptionFieldRefs {
    readonly id: FieldRef<"Subscription", 'String'>
    readonly userId: FieldRef<"Subscription", 'String'>
    readonly validUntil: FieldRef<"Subscription", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Subscription findUnique
   */
  export type SubscriptionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription findUniqueOrThrow
   */
  export type SubscriptionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription findFirst
   */
  export type SubscriptionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subscriptions.
     */
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * Subscription findFirstOrThrow
   */
  export type SubscriptionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subscriptions.
     */
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * Subscription findMany
   */
  export type SubscriptionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscriptions to fetch.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * Subscription create
   */
  export type SubscriptionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * The data needed to create a Subscription.
     */
    data: XOR<SubscriptionCreateInput, SubscriptionUncheckedCreateInput>
  }

  /**
   * Subscription createMany
   */
  export type SubscriptionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Subscriptions.
     */
    data: SubscriptionCreateManyInput | SubscriptionCreateManyInput[]
  }

  /**
   * Subscription createManyAndReturn
   */
  export type SubscriptionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * The data used to create many Subscriptions.
     */
    data: SubscriptionCreateManyInput | SubscriptionCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Subscription update
   */
  export type SubscriptionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * The data needed to update a Subscription.
     */
    data: XOR<SubscriptionUpdateInput, SubscriptionUncheckedUpdateInput>
    /**
     * Choose, which Subscription to update.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription updateMany
   */
  export type SubscriptionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Subscriptions.
     */
    data: XOR<SubscriptionUpdateManyMutationInput, SubscriptionUncheckedUpdateManyInput>
    /**
     * Filter which Subscriptions to update
     */
    where?: SubscriptionWhereInput
    /**
     * Limit how many Subscriptions to update.
     */
    limit?: number
  }

  /**
   * Subscription updateManyAndReturn
   */
  export type SubscriptionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * The data used to update Subscriptions.
     */
    data: XOR<SubscriptionUpdateManyMutationInput, SubscriptionUncheckedUpdateManyInput>
    /**
     * Filter which Subscriptions to update
     */
    where?: SubscriptionWhereInput
    /**
     * Limit how many Subscriptions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Subscription upsert
   */
  export type SubscriptionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * The filter to search for the Subscription to update in case it exists.
     */
    where: SubscriptionWhereUniqueInput
    /**
     * In case the Subscription found by the `where` argument doesn't exist, create a new Subscription with this data.
     */
    create: XOR<SubscriptionCreateInput, SubscriptionUncheckedCreateInput>
    /**
     * In case the Subscription was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubscriptionUpdateInput, SubscriptionUncheckedUpdateInput>
  }

  /**
   * Subscription delete
   */
  export type SubscriptionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter which Subscription to delete.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription deleteMany
   */
  export type SubscriptionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscriptions to delete
     */
    where?: SubscriptionWhereInput
    /**
     * Limit how many Subscriptions to delete.
     */
    limit?: number
  }

  /**
   * Subscription without action
   */
  export type SubscriptionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
  }


  /**
   * Model freeTipsStatistic
   */

  export type AggregateFreeTipsStatistic = {
    _count: FreeTipsStatisticCountAggregateOutputType | null
    _avg: FreeTipsStatisticAvgAggregateOutputType | null
    _sum: FreeTipsStatisticSumAggregateOutputType | null
    _min: FreeTipsStatisticMinAggregateOutputType | null
    _max: FreeTipsStatisticMaxAggregateOutputType | null
  }

  export type FreeTipsStatisticAvgAggregateOutputType = {
    numberOfTipps: number | null
    goodTippNumber: number | null
    badTippNumber: number | null
    AllBet: number | null
    WinMoney: number | null
    LostMoney: number | null
  }

  export type FreeTipsStatisticSumAggregateOutputType = {
    numberOfTipps: number | null
    goodTippNumber: number | null
    badTippNumber: number | null
    AllBet: number | null
    WinMoney: number | null
    LostMoney: number | null
  }

  export type FreeTipsStatisticMinAggregateOutputType = {
    id: string | null
    numberOfTipps: number | null
    goodTippNumber: number | null
    badTippNumber: number | null
    AllBet: number | null
    WinMoney: number | null
    LostMoney: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FreeTipsStatisticMaxAggregateOutputType = {
    id: string | null
    numberOfTipps: number | null
    goodTippNumber: number | null
    badTippNumber: number | null
    AllBet: number | null
    WinMoney: number | null
    LostMoney: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type FreeTipsStatisticCountAggregateOutputType = {
    id: number
    numberOfTipps: number
    goodTippNumber: number
    badTippNumber: number
    AllBet: number
    WinMoney: number
    LostMoney: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type FreeTipsStatisticAvgAggregateInputType = {
    numberOfTipps?: true
    goodTippNumber?: true
    badTippNumber?: true
    AllBet?: true
    WinMoney?: true
    LostMoney?: true
  }

  export type FreeTipsStatisticSumAggregateInputType = {
    numberOfTipps?: true
    goodTippNumber?: true
    badTippNumber?: true
    AllBet?: true
    WinMoney?: true
    LostMoney?: true
  }

  export type FreeTipsStatisticMinAggregateInputType = {
    id?: true
    numberOfTipps?: true
    goodTippNumber?: true
    badTippNumber?: true
    AllBet?: true
    WinMoney?: true
    LostMoney?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FreeTipsStatisticMaxAggregateInputType = {
    id?: true
    numberOfTipps?: true
    goodTippNumber?: true
    badTippNumber?: true
    AllBet?: true
    WinMoney?: true
    LostMoney?: true
    createdAt?: true
    updatedAt?: true
  }

  export type FreeTipsStatisticCountAggregateInputType = {
    id?: true
    numberOfTipps?: true
    goodTippNumber?: true
    badTippNumber?: true
    AllBet?: true
    WinMoney?: true
    LostMoney?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type FreeTipsStatisticAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which freeTipsStatistic to aggregate.
     */
    where?: freeTipsStatisticWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of freeTipsStatistics to fetch.
     */
    orderBy?: freeTipsStatisticOrderByWithRelationInput | freeTipsStatisticOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: freeTipsStatisticWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` freeTipsStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` freeTipsStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned freeTipsStatistics
    **/
    _count?: true | FreeTipsStatisticCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FreeTipsStatisticAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FreeTipsStatisticSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FreeTipsStatisticMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FreeTipsStatisticMaxAggregateInputType
  }

  export type GetFreeTipsStatisticAggregateType<T extends FreeTipsStatisticAggregateArgs> = {
        [P in keyof T & keyof AggregateFreeTipsStatistic]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFreeTipsStatistic[P]>
      : GetScalarType<T[P], AggregateFreeTipsStatistic[P]>
  }




  export type freeTipsStatisticGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: freeTipsStatisticWhereInput
    orderBy?: freeTipsStatisticOrderByWithAggregationInput | freeTipsStatisticOrderByWithAggregationInput[]
    by: FreeTipsStatisticScalarFieldEnum[] | FreeTipsStatisticScalarFieldEnum
    having?: freeTipsStatisticScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FreeTipsStatisticCountAggregateInputType | true
    _avg?: FreeTipsStatisticAvgAggregateInputType
    _sum?: FreeTipsStatisticSumAggregateInputType
    _min?: FreeTipsStatisticMinAggregateInputType
    _max?: FreeTipsStatisticMaxAggregateInputType
  }

  export type FreeTipsStatisticGroupByOutputType = {
    id: string
    numberOfTipps: number
    goodTippNumber: number
    badTippNumber: number
    AllBet: number
    WinMoney: number
    LostMoney: number
    createdAt: Date
    updatedAt: Date
    _count: FreeTipsStatisticCountAggregateOutputType | null
    _avg: FreeTipsStatisticAvgAggregateOutputType | null
    _sum: FreeTipsStatisticSumAggregateOutputType | null
    _min: FreeTipsStatisticMinAggregateOutputType | null
    _max: FreeTipsStatisticMaxAggregateOutputType | null
  }

  type GetFreeTipsStatisticGroupByPayload<T extends freeTipsStatisticGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FreeTipsStatisticGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FreeTipsStatisticGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FreeTipsStatisticGroupByOutputType[P]>
            : GetScalarType<T[P], FreeTipsStatisticGroupByOutputType[P]>
        }
      >
    >


  export type freeTipsStatisticSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    numberOfTipps?: boolean
    goodTippNumber?: boolean
    badTippNumber?: boolean
    AllBet?: boolean
    WinMoney?: boolean
    LostMoney?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["freeTipsStatistic"]>

  export type freeTipsStatisticSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    numberOfTipps?: boolean
    goodTippNumber?: boolean
    badTippNumber?: boolean
    AllBet?: boolean
    WinMoney?: boolean
    LostMoney?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["freeTipsStatistic"]>

  export type freeTipsStatisticSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    numberOfTipps?: boolean
    goodTippNumber?: boolean
    badTippNumber?: boolean
    AllBet?: boolean
    WinMoney?: boolean
    LostMoney?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["freeTipsStatistic"]>

  export type freeTipsStatisticSelectScalar = {
    id?: boolean
    numberOfTipps?: boolean
    goodTippNumber?: boolean
    badTippNumber?: boolean
    AllBet?: boolean
    WinMoney?: boolean
    LostMoney?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type freeTipsStatisticOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "numberOfTipps" | "goodTippNumber" | "badTippNumber" | "AllBet" | "WinMoney" | "LostMoney" | "createdAt" | "updatedAt", ExtArgs["result"]["freeTipsStatistic"]>

  export type $freeTipsStatisticPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "freeTipsStatistic"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      numberOfTipps: number
      goodTippNumber: number
      badTippNumber: number
      AllBet: number
      WinMoney: number
      LostMoney: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["freeTipsStatistic"]>
    composites: {}
  }

  type freeTipsStatisticGetPayload<S extends boolean | null | undefined | freeTipsStatisticDefaultArgs> = $Result.GetResult<Prisma.$freeTipsStatisticPayload, S>

  type freeTipsStatisticCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<freeTipsStatisticFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FreeTipsStatisticCountAggregateInputType | true
    }

  export interface freeTipsStatisticDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['freeTipsStatistic'], meta: { name: 'freeTipsStatistic' } }
    /**
     * Find zero or one FreeTipsStatistic that matches the filter.
     * @param {freeTipsStatisticFindUniqueArgs} args - Arguments to find a FreeTipsStatistic
     * @example
     * // Get one FreeTipsStatistic
     * const freeTipsStatistic = await prisma.freeTipsStatistic.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends freeTipsStatisticFindUniqueArgs>(args: SelectSubset<T, freeTipsStatisticFindUniqueArgs<ExtArgs>>): Prisma__freeTipsStatisticClient<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one FreeTipsStatistic that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {freeTipsStatisticFindUniqueOrThrowArgs} args - Arguments to find a FreeTipsStatistic
     * @example
     * // Get one FreeTipsStatistic
     * const freeTipsStatistic = await prisma.freeTipsStatistic.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends freeTipsStatisticFindUniqueOrThrowArgs>(args: SelectSubset<T, freeTipsStatisticFindUniqueOrThrowArgs<ExtArgs>>): Prisma__freeTipsStatisticClient<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FreeTipsStatistic that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {freeTipsStatisticFindFirstArgs} args - Arguments to find a FreeTipsStatistic
     * @example
     * // Get one FreeTipsStatistic
     * const freeTipsStatistic = await prisma.freeTipsStatistic.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends freeTipsStatisticFindFirstArgs>(args?: SelectSubset<T, freeTipsStatisticFindFirstArgs<ExtArgs>>): Prisma__freeTipsStatisticClient<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FreeTipsStatistic that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {freeTipsStatisticFindFirstOrThrowArgs} args - Arguments to find a FreeTipsStatistic
     * @example
     * // Get one FreeTipsStatistic
     * const freeTipsStatistic = await prisma.freeTipsStatistic.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends freeTipsStatisticFindFirstOrThrowArgs>(args?: SelectSubset<T, freeTipsStatisticFindFirstOrThrowArgs<ExtArgs>>): Prisma__freeTipsStatisticClient<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more FreeTipsStatistics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {freeTipsStatisticFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FreeTipsStatistics
     * const freeTipsStatistics = await prisma.freeTipsStatistic.findMany()
     * 
     * // Get first 10 FreeTipsStatistics
     * const freeTipsStatistics = await prisma.freeTipsStatistic.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const freeTipsStatisticWithIdOnly = await prisma.freeTipsStatistic.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends freeTipsStatisticFindManyArgs>(args?: SelectSubset<T, freeTipsStatisticFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a FreeTipsStatistic.
     * @param {freeTipsStatisticCreateArgs} args - Arguments to create a FreeTipsStatistic.
     * @example
     * // Create one FreeTipsStatistic
     * const FreeTipsStatistic = await prisma.freeTipsStatistic.create({
     *   data: {
     *     // ... data to create a FreeTipsStatistic
     *   }
     * })
     * 
     */
    create<T extends freeTipsStatisticCreateArgs>(args: SelectSubset<T, freeTipsStatisticCreateArgs<ExtArgs>>): Prisma__freeTipsStatisticClient<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many FreeTipsStatistics.
     * @param {freeTipsStatisticCreateManyArgs} args - Arguments to create many FreeTipsStatistics.
     * @example
     * // Create many FreeTipsStatistics
     * const freeTipsStatistic = await prisma.freeTipsStatistic.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends freeTipsStatisticCreateManyArgs>(args?: SelectSubset<T, freeTipsStatisticCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FreeTipsStatistics and returns the data saved in the database.
     * @param {freeTipsStatisticCreateManyAndReturnArgs} args - Arguments to create many FreeTipsStatistics.
     * @example
     * // Create many FreeTipsStatistics
     * const freeTipsStatistic = await prisma.freeTipsStatistic.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FreeTipsStatistics and only return the `id`
     * const freeTipsStatisticWithIdOnly = await prisma.freeTipsStatistic.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends freeTipsStatisticCreateManyAndReturnArgs>(args?: SelectSubset<T, freeTipsStatisticCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a FreeTipsStatistic.
     * @param {freeTipsStatisticDeleteArgs} args - Arguments to delete one FreeTipsStatistic.
     * @example
     * // Delete one FreeTipsStatistic
     * const FreeTipsStatistic = await prisma.freeTipsStatistic.delete({
     *   where: {
     *     // ... filter to delete one FreeTipsStatistic
     *   }
     * })
     * 
     */
    delete<T extends freeTipsStatisticDeleteArgs>(args: SelectSubset<T, freeTipsStatisticDeleteArgs<ExtArgs>>): Prisma__freeTipsStatisticClient<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one FreeTipsStatistic.
     * @param {freeTipsStatisticUpdateArgs} args - Arguments to update one FreeTipsStatistic.
     * @example
     * // Update one FreeTipsStatistic
     * const freeTipsStatistic = await prisma.freeTipsStatistic.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends freeTipsStatisticUpdateArgs>(args: SelectSubset<T, freeTipsStatisticUpdateArgs<ExtArgs>>): Prisma__freeTipsStatisticClient<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more FreeTipsStatistics.
     * @param {freeTipsStatisticDeleteManyArgs} args - Arguments to filter FreeTipsStatistics to delete.
     * @example
     * // Delete a few FreeTipsStatistics
     * const { count } = await prisma.freeTipsStatistic.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends freeTipsStatisticDeleteManyArgs>(args?: SelectSubset<T, freeTipsStatisticDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FreeTipsStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {freeTipsStatisticUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FreeTipsStatistics
     * const freeTipsStatistic = await prisma.freeTipsStatistic.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends freeTipsStatisticUpdateManyArgs>(args: SelectSubset<T, freeTipsStatisticUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FreeTipsStatistics and returns the data updated in the database.
     * @param {freeTipsStatisticUpdateManyAndReturnArgs} args - Arguments to update many FreeTipsStatistics.
     * @example
     * // Update many FreeTipsStatistics
     * const freeTipsStatistic = await prisma.freeTipsStatistic.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more FreeTipsStatistics and only return the `id`
     * const freeTipsStatisticWithIdOnly = await prisma.freeTipsStatistic.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends freeTipsStatisticUpdateManyAndReturnArgs>(args: SelectSubset<T, freeTipsStatisticUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one FreeTipsStatistic.
     * @param {freeTipsStatisticUpsertArgs} args - Arguments to update or create a FreeTipsStatistic.
     * @example
     * // Update or create a FreeTipsStatistic
     * const freeTipsStatistic = await prisma.freeTipsStatistic.upsert({
     *   create: {
     *     // ... data to create a FreeTipsStatistic
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FreeTipsStatistic we want to update
     *   }
     * })
     */
    upsert<T extends freeTipsStatisticUpsertArgs>(args: SelectSubset<T, freeTipsStatisticUpsertArgs<ExtArgs>>): Prisma__freeTipsStatisticClient<$Result.GetResult<Prisma.$freeTipsStatisticPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of FreeTipsStatistics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {freeTipsStatisticCountArgs} args - Arguments to filter FreeTipsStatistics to count.
     * @example
     * // Count the number of FreeTipsStatistics
     * const count = await prisma.freeTipsStatistic.count({
     *   where: {
     *     // ... the filter for the FreeTipsStatistics we want to count
     *   }
     * })
    **/
    count<T extends freeTipsStatisticCountArgs>(
      args?: Subset<T, freeTipsStatisticCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FreeTipsStatisticCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FreeTipsStatistic.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FreeTipsStatisticAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FreeTipsStatisticAggregateArgs>(args: Subset<T, FreeTipsStatisticAggregateArgs>): Prisma.PrismaPromise<GetFreeTipsStatisticAggregateType<T>>

    /**
     * Group by FreeTipsStatistic.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {freeTipsStatisticGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends freeTipsStatisticGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: freeTipsStatisticGroupByArgs['orderBy'] }
        : { orderBy?: freeTipsStatisticGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, freeTipsStatisticGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFreeTipsStatisticGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the freeTipsStatistic model
   */
  readonly fields: freeTipsStatisticFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for freeTipsStatistic.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__freeTipsStatisticClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the freeTipsStatistic model
   */
  interface freeTipsStatisticFieldRefs {
    readonly id: FieldRef<"freeTipsStatistic", 'String'>
    readonly numberOfTipps: FieldRef<"freeTipsStatistic", 'Int'>
    readonly goodTippNumber: FieldRef<"freeTipsStatistic", 'Int'>
    readonly badTippNumber: FieldRef<"freeTipsStatistic", 'Int'>
    readonly AllBet: FieldRef<"freeTipsStatistic", 'Int'>
    readonly WinMoney: FieldRef<"freeTipsStatistic", 'Int'>
    readonly LostMoney: FieldRef<"freeTipsStatistic", 'Int'>
    readonly createdAt: FieldRef<"freeTipsStatistic", 'DateTime'>
    readonly updatedAt: FieldRef<"freeTipsStatistic", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * freeTipsStatistic findUnique
   */
  export type freeTipsStatisticFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * Filter, which freeTipsStatistic to fetch.
     */
    where: freeTipsStatisticWhereUniqueInput
  }

  /**
   * freeTipsStatistic findUniqueOrThrow
   */
  export type freeTipsStatisticFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * Filter, which freeTipsStatistic to fetch.
     */
    where: freeTipsStatisticWhereUniqueInput
  }

  /**
   * freeTipsStatistic findFirst
   */
  export type freeTipsStatisticFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * Filter, which freeTipsStatistic to fetch.
     */
    where?: freeTipsStatisticWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of freeTipsStatistics to fetch.
     */
    orderBy?: freeTipsStatisticOrderByWithRelationInput | freeTipsStatisticOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for freeTipsStatistics.
     */
    cursor?: freeTipsStatisticWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` freeTipsStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` freeTipsStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of freeTipsStatistics.
     */
    distinct?: FreeTipsStatisticScalarFieldEnum | FreeTipsStatisticScalarFieldEnum[]
  }

  /**
   * freeTipsStatistic findFirstOrThrow
   */
  export type freeTipsStatisticFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * Filter, which freeTipsStatistic to fetch.
     */
    where?: freeTipsStatisticWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of freeTipsStatistics to fetch.
     */
    orderBy?: freeTipsStatisticOrderByWithRelationInput | freeTipsStatisticOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for freeTipsStatistics.
     */
    cursor?: freeTipsStatisticWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` freeTipsStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` freeTipsStatistics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of freeTipsStatistics.
     */
    distinct?: FreeTipsStatisticScalarFieldEnum | FreeTipsStatisticScalarFieldEnum[]
  }

  /**
   * freeTipsStatistic findMany
   */
  export type freeTipsStatisticFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * Filter, which freeTipsStatistics to fetch.
     */
    where?: freeTipsStatisticWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of freeTipsStatistics to fetch.
     */
    orderBy?: freeTipsStatisticOrderByWithRelationInput | freeTipsStatisticOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing freeTipsStatistics.
     */
    cursor?: freeTipsStatisticWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` freeTipsStatistics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` freeTipsStatistics.
     */
    skip?: number
    distinct?: FreeTipsStatisticScalarFieldEnum | FreeTipsStatisticScalarFieldEnum[]
  }

  /**
   * freeTipsStatistic create
   */
  export type freeTipsStatisticCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * The data needed to create a freeTipsStatistic.
     */
    data: XOR<freeTipsStatisticCreateInput, freeTipsStatisticUncheckedCreateInput>
  }

  /**
   * freeTipsStatistic createMany
   */
  export type freeTipsStatisticCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many freeTipsStatistics.
     */
    data: freeTipsStatisticCreateManyInput | freeTipsStatisticCreateManyInput[]
  }

  /**
   * freeTipsStatistic createManyAndReturn
   */
  export type freeTipsStatisticCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * The data used to create many freeTipsStatistics.
     */
    data: freeTipsStatisticCreateManyInput | freeTipsStatisticCreateManyInput[]
  }

  /**
   * freeTipsStatistic update
   */
  export type freeTipsStatisticUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * The data needed to update a freeTipsStatistic.
     */
    data: XOR<freeTipsStatisticUpdateInput, freeTipsStatisticUncheckedUpdateInput>
    /**
     * Choose, which freeTipsStatistic to update.
     */
    where: freeTipsStatisticWhereUniqueInput
  }

  /**
   * freeTipsStatistic updateMany
   */
  export type freeTipsStatisticUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update freeTipsStatistics.
     */
    data: XOR<freeTipsStatisticUpdateManyMutationInput, freeTipsStatisticUncheckedUpdateManyInput>
    /**
     * Filter which freeTipsStatistics to update
     */
    where?: freeTipsStatisticWhereInput
    /**
     * Limit how many freeTipsStatistics to update.
     */
    limit?: number
  }

  /**
   * freeTipsStatistic updateManyAndReturn
   */
  export type freeTipsStatisticUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * The data used to update freeTipsStatistics.
     */
    data: XOR<freeTipsStatisticUpdateManyMutationInput, freeTipsStatisticUncheckedUpdateManyInput>
    /**
     * Filter which freeTipsStatistics to update
     */
    where?: freeTipsStatisticWhereInput
    /**
     * Limit how many freeTipsStatistics to update.
     */
    limit?: number
  }

  /**
   * freeTipsStatistic upsert
   */
  export type freeTipsStatisticUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * The filter to search for the freeTipsStatistic to update in case it exists.
     */
    where: freeTipsStatisticWhereUniqueInput
    /**
     * In case the freeTipsStatistic found by the `where` argument doesn't exist, create a new freeTipsStatistic with this data.
     */
    create: XOR<freeTipsStatisticCreateInput, freeTipsStatisticUncheckedCreateInput>
    /**
     * In case the freeTipsStatistic was found with the provided `where` argument, update it with this data.
     */
    update: XOR<freeTipsStatisticUpdateInput, freeTipsStatisticUncheckedUpdateInput>
  }

  /**
   * freeTipsStatistic delete
   */
  export type freeTipsStatisticDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
    /**
     * Filter which freeTipsStatistic to delete.
     */
    where: freeTipsStatisticWhereUniqueInput
  }

  /**
   * freeTipsStatistic deleteMany
   */
  export type freeTipsStatisticDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which freeTipsStatistics to delete
     */
    where?: freeTipsStatisticWhereInput
    /**
     * Limit how many freeTipsStatistics to delete.
     */
    limit?: number
  }

  /**
   * freeTipsStatistic without action
   */
  export type freeTipsStatisticDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the freeTipsStatistic
     */
    select?: freeTipsStatisticSelect<ExtArgs> | null
    /**
     * Omit specific fields from the freeTipsStatistic
     */
    omit?: freeTipsStatisticOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    username: 'username',
    email: 'email',
    password: 'password',
    avatar: 'avatar',
    isAdmin: 'isAdmin',
    isPaid: 'isPaid',
    isBanned: 'isBanned'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const AdminPostsScalarFieldEnum: {
    id: 'id',
    slug: 'slug',
    title: 'title',
    content: 'content',
    imageurl: 'imageurl',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AdminPostsScalarFieldEnum = (typeof AdminPostsScalarFieldEnum)[keyof typeof AdminPostsScalarFieldEnum]


  export const FreeTippsScalarFieldEnum: {
    id: 'id',
    slug: 'slug',
    title: 'title',
    content: 'content',
    imageurl: 'imageurl',
    deadline: 'deadline',
    price: 'price',
    prize: 'prize',
    odds: 'odds',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type FreeTippsScalarFieldEnum = (typeof FreeTippsScalarFieldEnum)[keyof typeof FreeTippsScalarFieldEnum]


  export const PremiumTippsScalarFieldEnum: {
    id: 'id',
    slug: 'slug',
    title: 'title',
    content: 'content',
    deadline: 'deadline',
    imageurl: 'imageurl',
    price: 'price',
    prize: 'prize',
    odds: 'odds',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PremiumTippsScalarFieldEnum = (typeof PremiumTippsScalarFieldEnum)[keyof typeof PremiumTippsScalarFieldEnum]


  export const CommentScalarFieldEnum: {
    id: 'id',
    content: 'content',
    hidden: 'hidden',
    userId: 'userId',
    postId: 'postId',
    freeTippId: 'freeTippId',
    premiumTippId: 'premiumTippId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CommentScalarFieldEnum = (typeof CommentScalarFieldEnum)[keyof typeof CommentScalarFieldEnum]


  export const SubscriptionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    validUntil: 'validUntil'
  };

  export type SubscriptionScalarFieldEnum = (typeof SubscriptionScalarFieldEnum)[keyof typeof SubscriptionScalarFieldEnum]


  export const FreeTipsStatisticScalarFieldEnum: {
    id: 'id',
    numberOfTipps: 'numberOfTipps',
    goodTippNumber: 'goodTippNumber',
    badTippNumber: 'badTippNumber',
    AllBet: 'AllBet',
    WinMoney: 'WinMoney',
    LostMoney: 'LostMoney',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type FreeTipsStatisticScalarFieldEnum = (typeof FreeTipsStatisticScalarFieldEnum)[keyof typeof FreeTipsStatisticScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    username?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    avatar?: StringNullableFilter<"User"> | string | null
    isAdmin?: BoolFilter<"User"> | boolean
    isPaid?: BoolFilter<"User"> | boolean
    isBanned?: BoolFilter<"User"> | boolean
    comments?: CommentListRelationFilter
    subscription?: XOR<SubscriptionNullableScalarRelationFilter, SubscriptionWhereInput> | null
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    password?: SortOrder
    avatar?: SortOrderInput | SortOrder
    isAdmin?: SortOrder
    isPaid?: SortOrder
    isBanned?: SortOrder
    comments?: CommentOrderByRelationAggregateInput
    subscription?: SubscriptionOrderByWithRelationInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    username?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    password?: StringFilter<"User"> | string
    avatar?: StringNullableFilter<"User"> | string | null
    isAdmin?: BoolFilter<"User"> | boolean
    isPaid?: BoolFilter<"User"> | boolean
    isBanned?: BoolFilter<"User"> | boolean
    comments?: CommentListRelationFilter
    subscription?: XOR<SubscriptionNullableScalarRelationFilter, SubscriptionWhereInput> | null
  }, "id" | "username" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    password?: SortOrder
    avatar?: SortOrderInput | SortOrder
    isAdmin?: SortOrder
    isPaid?: SortOrder
    isBanned?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    username?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    avatar?: StringNullableWithAggregatesFilter<"User"> | string | null
    isAdmin?: BoolWithAggregatesFilter<"User"> | boolean
    isPaid?: BoolWithAggregatesFilter<"User"> | boolean
    isBanned?: BoolWithAggregatesFilter<"User"> | boolean
  }

  export type AdminPostsWhereInput = {
    AND?: AdminPostsWhereInput | AdminPostsWhereInput[]
    OR?: AdminPostsWhereInput[]
    NOT?: AdminPostsWhereInput | AdminPostsWhereInput[]
    id?: StringFilter<"AdminPosts"> | string
    slug?: StringFilter<"AdminPosts"> | string
    title?: StringFilter<"AdminPosts"> | string
    content?: StringFilter<"AdminPosts"> | string
    imageurl?: StringFilter<"AdminPosts"> | string
    createdAt?: DateTimeFilter<"AdminPosts"> | Date | string
    updatedAt?: DateTimeFilter<"AdminPosts"> | Date | string
    comments?: CommentListRelationFilter
  }

  export type AdminPostsOrderByWithRelationInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    comments?: CommentOrderByRelationAggregateInput
  }

  export type AdminPostsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: AdminPostsWhereInput | AdminPostsWhereInput[]
    OR?: AdminPostsWhereInput[]
    NOT?: AdminPostsWhereInput | AdminPostsWhereInput[]
    title?: StringFilter<"AdminPosts"> | string
    content?: StringFilter<"AdminPosts"> | string
    imageurl?: StringFilter<"AdminPosts"> | string
    createdAt?: DateTimeFilter<"AdminPosts"> | Date | string
    updatedAt?: DateTimeFilter<"AdminPosts"> | Date | string
    comments?: CommentListRelationFilter
  }, "id" | "slug">

  export type AdminPostsOrderByWithAggregationInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AdminPostsCountOrderByAggregateInput
    _max?: AdminPostsMaxOrderByAggregateInput
    _min?: AdminPostsMinOrderByAggregateInput
  }

  export type AdminPostsScalarWhereWithAggregatesInput = {
    AND?: AdminPostsScalarWhereWithAggregatesInput | AdminPostsScalarWhereWithAggregatesInput[]
    OR?: AdminPostsScalarWhereWithAggregatesInput[]
    NOT?: AdminPostsScalarWhereWithAggregatesInput | AdminPostsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AdminPosts"> | string
    slug?: StringWithAggregatesFilter<"AdminPosts"> | string
    title?: StringWithAggregatesFilter<"AdminPosts"> | string
    content?: StringWithAggregatesFilter<"AdminPosts"> | string
    imageurl?: StringWithAggregatesFilter<"AdminPosts"> | string
    createdAt?: DateTimeWithAggregatesFilter<"AdminPosts"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AdminPosts"> | Date | string
  }

  export type FreeTippsWhereInput = {
    AND?: FreeTippsWhereInput | FreeTippsWhereInput[]
    OR?: FreeTippsWhereInput[]
    NOT?: FreeTippsWhereInput | FreeTippsWhereInput[]
    id?: StringFilter<"FreeTipps"> | string
    slug?: StringFilter<"FreeTipps"> | string
    title?: StringFilter<"FreeTipps"> | string
    content?: StringFilter<"FreeTipps"> | string
    imageurl?: StringNullableFilter<"FreeTipps"> | string | null
    deadline?: DateTimeFilter<"FreeTipps"> | Date | string
    price?: IntFilter<"FreeTipps"> | number
    prize?: IntFilter<"FreeTipps"> | number
    odds?: IntFilter<"FreeTipps"> | number
    createdAt?: DateTimeFilter<"FreeTipps"> | Date | string
    updatedAt?: DateTimeFilter<"FreeTipps"> | Date | string
    comments?: CommentListRelationFilter
  }

  export type FreeTippsOrderByWithRelationInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrderInput | SortOrder
    deadline?: SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    comments?: CommentOrderByRelationAggregateInput
  }

  export type FreeTippsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: FreeTippsWhereInput | FreeTippsWhereInput[]
    OR?: FreeTippsWhereInput[]
    NOT?: FreeTippsWhereInput | FreeTippsWhereInput[]
    title?: StringFilter<"FreeTipps"> | string
    content?: StringFilter<"FreeTipps"> | string
    imageurl?: StringNullableFilter<"FreeTipps"> | string | null
    deadline?: DateTimeFilter<"FreeTipps"> | Date | string
    price?: IntFilter<"FreeTipps"> | number
    prize?: IntFilter<"FreeTipps"> | number
    odds?: IntFilter<"FreeTipps"> | number
    createdAt?: DateTimeFilter<"FreeTipps"> | Date | string
    updatedAt?: DateTimeFilter<"FreeTipps"> | Date | string
    comments?: CommentListRelationFilter
  }, "id" | "slug">

  export type FreeTippsOrderByWithAggregationInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrderInput | SortOrder
    deadline?: SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: FreeTippsCountOrderByAggregateInput
    _avg?: FreeTippsAvgOrderByAggregateInput
    _max?: FreeTippsMaxOrderByAggregateInput
    _min?: FreeTippsMinOrderByAggregateInput
    _sum?: FreeTippsSumOrderByAggregateInput
  }

  export type FreeTippsScalarWhereWithAggregatesInput = {
    AND?: FreeTippsScalarWhereWithAggregatesInput | FreeTippsScalarWhereWithAggregatesInput[]
    OR?: FreeTippsScalarWhereWithAggregatesInput[]
    NOT?: FreeTippsScalarWhereWithAggregatesInput | FreeTippsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"FreeTipps"> | string
    slug?: StringWithAggregatesFilter<"FreeTipps"> | string
    title?: StringWithAggregatesFilter<"FreeTipps"> | string
    content?: StringWithAggregatesFilter<"FreeTipps"> | string
    imageurl?: StringNullableWithAggregatesFilter<"FreeTipps"> | string | null
    deadline?: DateTimeWithAggregatesFilter<"FreeTipps"> | Date | string
    price?: IntWithAggregatesFilter<"FreeTipps"> | number
    prize?: IntWithAggregatesFilter<"FreeTipps"> | number
    odds?: IntWithAggregatesFilter<"FreeTipps"> | number
    createdAt?: DateTimeWithAggregatesFilter<"FreeTipps"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"FreeTipps"> | Date | string
  }

  export type PremiumTippsWhereInput = {
    AND?: PremiumTippsWhereInput | PremiumTippsWhereInput[]
    OR?: PremiumTippsWhereInput[]
    NOT?: PremiumTippsWhereInput | PremiumTippsWhereInput[]
    id?: StringFilter<"PremiumTipps"> | string
    slug?: StringFilter<"PremiumTipps"> | string
    title?: StringFilter<"PremiumTipps"> | string
    content?: StringFilter<"PremiumTipps"> | string
    deadline?: DateTimeFilter<"PremiumTipps"> | Date | string
    imageurl?: StringNullableFilter<"PremiumTipps"> | string | null
    price?: IntFilter<"PremiumTipps"> | number
    prize?: IntFilter<"PremiumTipps"> | number
    odds?: IntFilter<"PremiumTipps"> | number
    createdAt?: DateTimeFilter<"PremiumTipps"> | Date | string
    updatedAt?: DateTimeFilter<"PremiumTipps"> | Date | string
    comments?: CommentListRelationFilter
  }

  export type PremiumTippsOrderByWithRelationInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    deadline?: SortOrder
    imageurl?: SortOrderInput | SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    comments?: CommentOrderByRelationAggregateInput
  }

  export type PremiumTippsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: PremiumTippsWhereInput | PremiumTippsWhereInput[]
    OR?: PremiumTippsWhereInput[]
    NOT?: PremiumTippsWhereInput | PremiumTippsWhereInput[]
    title?: StringFilter<"PremiumTipps"> | string
    content?: StringFilter<"PremiumTipps"> | string
    deadline?: DateTimeFilter<"PremiumTipps"> | Date | string
    imageurl?: StringNullableFilter<"PremiumTipps"> | string | null
    price?: IntFilter<"PremiumTipps"> | number
    prize?: IntFilter<"PremiumTipps"> | number
    odds?: IntFilter<"PremiumTipps"> | number
    createdAt?: DateTimeFilter<"PremiumTipps"> | Date | string
    updatedAt?: DateTimeFilter<"PremiumTipps"> | Date | string
    comments?: CommentListRelationFilter
  }, "id" | "slug">

  export type PremiumTippsOrderByWithAggregationInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    deadline?: SortOrder
    imageurl?: SortOrderInput | SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PremiumTippsCountOrderByAggregateInput
    _avg?: PremiumTippsAvgOrderByAggregateInput
    _max?: PremiumTippsMaxOrderByAggregateInput
    _min?: PremiumTippsMinOrderByAggregateInput
    _sum?: PremiumTippsSumOrderByAggregateInput
  }

  export type PremiumTippsScalarWhereWithAggregatesInput = {
    AND?: PremiumTippsScalarWhereWithAggregatesInput | PremiumTippsScalarWhereWithAggregatesInput[]
    OR?: PremiumTippsScalarWhereWithAggregatesInput[]
    NOT?: PremiumTippsScalarWhereWithAggregatesInput | PremiumTippsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PremiumTipps"> | string
    slug?: StringWithAggregatesFilter<"PremiumTipps"> | string
    title?: StringWithAggregatesFilter<"PremiumTipps"> | string
    content?: StringWithAggregatesFilter<"PremiumTipps"> | string
    deadline?: DateTimeWithAggregatesFilter<"PremiumTipps"> | Date | string
    imageurl?: StringNullableWithAggregatesFilter<"PremiumTipps"> | string | null
    price?: IntWithAggregatesFilter<"PremiumTipps"> | number
    prize?: IntWithAggregatesFilter<"PremiumTipps"> | number
    odds?: IntWithAggregatesFilter<"PremiumTipps"> | number
    createdAt?: DateTimeWithAggregatesFilter<"PremiumTipps"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PremiumTipps"> | Date | string
  }

  export type CommentWhereInput = {
    AND?: CommentWhereInput | CommentWhereInput[]
    OR?: CommentWhereInput[]
    NOT?: CommentWhereInput | CommentWhereInput[]
    id?: StringFilter<"Comment"> | string
    content?: StringFilter<"Comment"> | string
    hidden?: BoolFilter<"Comment"> | boolean
    userId?: StringFilter<"Comment"> | string
    postId?: StringFilter<"Comment"> | string
    freeTippId?: StringNullableFilter<"Comment"> | string | null
    premiumTippId?: StringNullableFilter<"Comment"> | string | null
    createdAt?: DateTimeFilter<"Comment"> | Date | string
    updatedAt?: DateTimeFilter<"Comment"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    post?: XOR<AdminPostsScalarRelationFilter, AdminPostsWhereInput>
    freeTipp?: XOR<FreeTippsNullableScalarRelationFilter, FreeTippsWhereInput> | null
    premiumTipp?: XOR<PremiumTippsNullableScalarRelationFilter, PremiumTippsWhereInput> | null
  }

  export type CommentOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    hidden?: SortOrder
    userId?: SortOrder
    postId?: SortOrder
    freeTippId?: SortOrderInput | SortOrder
    premiumTippId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    post?: AdminPostsOrderByWithRelationInput
    freeTipp?: FreeTippsOrderByWithRelationInput
    premiumTipp?: PremiumTippsOrderByWithRelationInput
  }

  export type CommentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CommentWhereInput | CommentWhereInput[]
    OR?: CommentWhereInput[]
    NOT?: CommentWhereInput | CommentWhereInput[]
    content?: StringFilter<"Comment"> | string
    hidden?: BoolFilter<"Comment"> | boolean
    userId?: StringFilter<"Comment"> | string
    postId?: StringFilter<"Comment"> | string
    freeTippId?: StringNullableFilter<"Comment"> | string | null
    premiumTippId?: StringNullableFilter<"Comment"> | string | null
    createdAt?: DateTimeFilter<"Comment"> | Date | string
    updatedAt?: DateTimeFilter<"Comment"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    post?: XOR<AdminPostsScalarRelationFilter, AdminPostsWhereInput>
    freeTipp?: XOR<FreeTippsNullableScalarRelationFilter, FreeTippsWhereInput> | null
    premiumTipp?: XOR<PremiumTippsNullableScalarRelationFilter, PremiumTippsWhereInput> | null
  }, "id">

  export type CommentOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    hidden?: SortOrder
    userId?: SortOrder
    postId?: SortOrder
    freeTippId?: SortOrderInput | SortOrder
    premiumTippId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CommentCountOrderByAggregateInput
    _max?: CommentMaxOrderByAggregateInput
    _min?: CommentMinOrderByAggregateInput
  }

  export type CommentScalarWhereWithAggregatesInput = {
    AND?: CommentScalarWhereWithAggregatesInput | CommentScalarWhereWithAggregatesInput[]
    OR?: CommentScalarWhereWithAggregatesInput[]
    NOT?: CommentScalarWhereWithAggregatesInput | CommentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Comment"> | string
    content?: StringWithAggregatesFilter<"Comment"> | string
    hidden?: BoolWithAggregatesFilter<"Comment"> | boolean
    userId?: StringWithAggregatesFilter<"Comment"> | string
    postId?: StringWithAggregatesFilter<"Comment"> | string
    freeTippId?: StringNullableWithAggregatesFilter<"Comment"> | string | null
    premiumTippId?: StringNullableWithAggregatesFilter<"Comment"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Comment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Comment"> | Date | string
  }

  export type SubscriptionWhereInput = {
    AND?: SubscriptionWhereInput | SubscriptionWhereInput[]
    OR?: SubscriptionWhereInput[]
    NOT?: SubscriptionWhereInput | SubscriptionWhereInput[]
    id?: StringFilter<"Subscription"> | string
    userId?: StringFilter<"Subscription"> | string
    validUntil?: DateTimeFilter<"Subscription"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SubscriptionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    validUntil?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SubscriptionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: SubscriptionWhereInput | SubscriptionWhereInput[]
    OR?: SubscriptionWhereInput[]
    NOT?: SubscriptionWhereInput | SubscriptionWhereInput[]
    validUntil?: DateTimeFilter<"Subscription"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type SubscriptionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    validUntil?: SortOrder
    _count?: SubscriptionCountOrderByAggregateInput
    _max?: SubscriptionMaxOrderByAggregateInput
    _min?: SubscriptionMinOrderByAggregateInput
  }

  export type SubscriptionScalarWhereWithAggregatesInput = {
    AND?: SubscriptionScalarWhereWithAggregatesInput | SubscriptionScalarWhereWithAggregatesInput[]
    OR?: SubscriptionScalarWhereWithAggregatesInput[]
    NOT?: SubscriptionScalarWhereWithAggregatesInput | SubscriptionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Subscription"> | string
    userId?: StringWithAggregatesFilter<"Subscription"> | string
    validUntil?: DateTimeWithAggregatesFilter<"Subscription"> | Date | string
  }

  export type freeTipsStatisticWhereInput = {
    AND?: freeTipsStatisticWhereInput | freeTipsStatisticWhereInput[]
    OR?: freeTipsStatisticWhereInput[]
    NOT?: freeTipsStatisticWhereInput | freeTipsStatisticWhereInput[]
    id?: StringFilter<"freeTipsStatistic"> | string
    numberOfTipps?: IntFilter<"freeTipsStatistic"> | number
    goodTippNumber?: IntFilter<"freeTipsStatistic"> | number
    badTippNumber?: IntFilter<"freeTipsStatistic"> | number
    AllBet?: IntFilter<"freeTipsStatistic"> | number
    WinMoney?: IntFilter<"freeTipsStatistic"> | number
    LostMoney?: IntFilter<"freeTipsStatistic"> | number
    createdAt?: DateTimeFilter<"freeTipsStatistic"> | Date | string
    updatedAt?: DateTimeFilter<"freeTipsStatistic"> | Date | string
  }

  export type freeTipsStatisticOrderByWithRelationInput = {
    id?: SortOrder
    numberOfTipps?: SortOrder
    goodTippNumber?: SortOrder
    badTippNumber?: SortOrder
    AllBet?: SortOrder
    WinMoney?: SortOrder
    LostMoney?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type freeTipsStatisticWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: freeTipsStatisticWhereInput | freeTipsStatisticWhereInput[]
    OR?: freeTipsStatisticWhereInput[]
    NOT?: freeTipsStatisticWhereInput | freeTipsStatisticWhereInput[]
    numberOfTipps?: IntFilter<"freeTipsStatistic"> | number
    goodTippNumber?: IntFilter<"freeTipsStatistic"> | number
    badTippNumber?: IntFilter<"freeTipsStatistic"> | number
    AllBet?: IntFilter<"freeTipsStatistic"> | number
    WinMoney?: IntFilter<"freeTipsStatistic"> | number
    LostMoney?: IntFilter<"freeTipsStatistic"> | number
    createdAt?: DateTimeFilter<"freeTipsStatistic"> | Date | string
    updatedAt?: DateTimeFilter<"freeTipsStatistic"> | Date | string
  }, "id">

  export type freeTipsStatisticOrderByWithAggregationInput = {
    id?: SortOrder
    numberOfTipps?: SortOrder
    goodTippNumber?: SortOrder
    badTippNumber?: SortOrder
    AllBet?: SortOrder
    WinMoney?: SortOrder
    LostMoney?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: freeTipsStatisticCountOrderByAggregateInput
    _avg?: freeTipsStatisticAvgOrderByAggregateInput
    _max?: freeTipsStatisticMaxOrderByAggregateInput
    _min?: freeTipsStatisticMinOrderByAggregateInput
    _sum?: freeTipsStatisticSumOrderByAggregateInput
  }

  export type freeTipsStatisticScalarWhereWithAggregatesInput = {
    AND?: freeTipsStatisticScalarWhereWithAggregatesInput | freeTipsStatisticScalarWhereWithAggregatesInput[]
    OR?: freeTipsStatisticScalarWhereWithAggregatesInput[]
    NOT?: freeTipsStatisticScalarWhereWithAggregatesInput | freeTipsStatisticScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"freeTipsStatistic"> | string
    numberOfTipps?: IntWithAggregatesFilter<"freeTipsStatistic"> | number
    goodTippNumber?: IntWithAggregatesFilter<"freeTipsStatistic"> | number
    badTippNumber?: IntWithAggregatesFilter<"freeTipsStatistic"> | number
    AllBet?: IntWithAggregatesFilter<"freeTipsStatistic"> | number
    WinMoney?: IntWithAggregatesFilter<"freeTipsStatistic"> | number
    LostMoney?: IntWithAggregatesFilter<"freeTipsStatistic"> | number
    createdAt?: DateTimeWithAggregatesFilter<"freeTipsStatistic"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"freeTipsStatistic"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    username: string
    email: string
    password: string
    avatar?: string | null
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
    comments?: CommentCreateNestedManyWithoutUserInput
    subscription?: SubscriptionCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    username: string
    email: string
    password: string
    avatar?: string | null
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
    comments?: CommentUncheckedCreateNestedManyWithoutUserInput
    subscription?: SubscriptionUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isPaid?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    comments?: CommentUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isPaid?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    comments?: CommentUncheckedUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    username: string
    email: string
    password: string
    avatar?: string | null
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isPaid?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isPaid?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
  }

  export type AdminPostsCreateInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl: string
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentCreateNestedManyWithoutPostInput
  }

  export type AdminPostsUncheckedCreateInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl: string
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
  }

  export type AdminPostsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUpdateManyWithoutPostNestedInput
  }

  export type AdminPostsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
  }

  export type AdminPostsCreateManyInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AdminPostsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminPostsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FreeTippsCreateInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl?: string | null
    deadline: Date | string
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentCreateNestedManyWithoutFreeTippInput
  }

  export type FreeTippsUncheckedCreateInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl?: string | null
    deadline: Date | string
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutFreeTippInput
  }

  export type FreeTippsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUpdateManyWithoutFreeTippNestedInput
  }

  export type FreeTippsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutFreeTippNestedInput
  }

  export type FreeTippsCreateManyInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl?: string | null
    deadline: Date | string
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FreeTippsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FreeTippsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PremiumTippsCreateInput = {
    id?: string
    slug: string
    title: string
    content: string
    deadline: Date | string
    imageurl?: string | null
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentCreateNestedManyWithoutPremiumTippInput
  }

  export type PremiumTippsUncheckedCreateInput = {
    id?: string
    slug: string
    title: string
    content: string
    deadline: Date | string
    imageurl?: string | null
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutPremiumTippInput
  }

  export type PremiumTippsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUpdateManyWithoutPremiumTippNestedInput
  }

  export type PremiumTippsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutPremiumTippNestedInput
  }

  export type PremiumTippsCreateManyInput = {
    id?: string
    slug: string
    title: string
    content: string
    deadline: Date | string
    imageurl?: string | null
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PremiumTippsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PremiumTippsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentCreateInput = {
    id?: string
    content: string
    hidden?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutCommentsInput
    post: AdminPostsCreateNestedOneWithoutCommentsInput
    freeTipp?: FreeTippsCreateNestedOneWithoutCommentsInput
    premiumTipp?: PremiumTippsCreateNestedOneWithoutCommentsInput
  }

  export type CommentUncheckedCreateInput = {
    id?: string
    content: string
    hidden?: boolean
    userId: string
    postId: string
    freeTippId?: string | null
    premiumTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCommentsNestedInput
    post?: AdminPostsUpdateOneRequiredWithoutCommentsNestedInput
    freeTipp?: FreeTippsUpdateOneWithoutCommentsNestedInput
    premiumTipp?: PremiumTippsUpdateOneWithoutCommentsNestedInput
  }

  export type CommentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    freeTippId?: NullableStringFieldUpdateOperationsInput | string | null
    premiumTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentCreateManyInput = {
    id?: string
    content: string
    hidden?: boolean
    userId: string
    postId: string
    freeTippId?: string | null
    premiumTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    freeTippId?: NullableStringFieldUpdateOperationsInput | string | null
    premiumTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionCreateInput = {
    id?: string
    validUntil: Date | string
    user: UserCreateNestedOneWithoutSubscriptionInput
  }

  export type SubscriptionUncheckedCreateInput = {
    id?: string
    userId: string
    validUntil: Date | string
  }

  export type SubscriptionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    validUntil?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSubscriptionNestedInput
  }

  export type SubscriptionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    validUntil?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionCreateManyInput = {
    id?: string
    userId: string
    validUntil: Date | string
  }

  export type SubscriptionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    validUntil?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    validUntil?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type freeTipsStatisticCreateInput = {
    id?: string
    numberOfTipps?: number
    goodTippNumber?: number
    badTippNumber?: number
    AllBet?: number
    WinMoney?: number
    LostMoney?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type freeTipsStatisticUncheckedCreateInput = {
    id?: string
    numberOfTipps?: number
    goodTippNumber?: number
    badTippNumber?: number
    AllBet?: number
    WinMoney?: number
    LostMoney?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type freeTipsStatisticUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    numberOfTipps?: IntFieldUpdateOperationsInput | number
    goodTippNumber?: IntFieldUpdateOperationsInput | number
    badTippNumber?: IntFieldUpdateOperationsInput | number
    AllBet?: IntFieldUpdateOperationsInput | number
    WinMoney?: IntFieldUpdateOperationsInput | number
    LostMoney?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type freeTipsStatisticUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    numberOfTipps?: IntFieldUpdateOperationsInput | number
    goodTippNumber?: IntFieldUpdateOperationsInput | number
    badTippNumber?: IntFieldUpdateOperationsInput | number
    AllBet?: IntFieldUpdateOperationsInput | number
    WinMoney?: IntFieldUpdateOperationsInput | number
    LostMoney?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type freeTipsStatisticCreateManyInput = {
    id?: string
    numberOfTipps?: number
    goodTippNumber?: number
    badTippNumber?: number
    AllBet?: number
    WinMoney?: number
    LostMoney?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type freeTipsStatisticUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    numberOfTipps?: IntFieldUpdateOperationsInput | number
    goodTippNumber?: IntFieldUpdateOperationsInput | number
    badTippNumber?: IntFieldUpdateOperationsInput | number
    AllBet?: IntFieldUpdateOperationsInput | number
    WinMoney?: IntFieldUpdateOperationsInput | number
    LostMoney?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type freeTipsStatisticUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    numberOfTipps?: IntFieldUpdateOperationsInput | number
    goodTippNumber?: IntFieldUpdateOperationsInput | number
    badTippNumber?: IntFieldUpdateOperationsInput | number
    AllBet?: IntFieldUpdateOperationsInput | number
    WinMoney?: IntFieldUpdateOperationsInput | number
    LostMoney?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type CommentListRelationFilter = {
    every?: CommentWhereInput
    some?: CommentWhereInput
    none?: CommentWhereInput
  }

  export type SubscriptionNullableScalarRelationFilter = {
    is?: SubscriptionWhereInput | null
    isNot?: SubscriptionWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CommentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    password?: SortOrder
    avatar?: SortOrder
    isAdmin?: SortOrder
    isPaid?: SortOrder
    isBanned?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    password?: SortOrder
    avatar?: SortOrder
    isAdmin?: SortOrder
    isPaid?: SortOrder
    isBanned?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    email?: SortOrder
    password?: SortOrder
    avatar?: SortOrder
    isAdmin?: SortOrder
    isPaid?: SortOrder
    isBanned?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type AdminPostsCountOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AdminPostsMaxOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AdminPostsMinOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FreeTippsCountOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrder
    deadline?: SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FreeTippsAvgOrderByAggregateInput = {
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
  }

  export type FreeTippsMaxOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrder
    deadline?: SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FreeTippsMinOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    imageurl?: SortOrder
    deadline?: SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type FreeTippsSumOrderByAggregateInput = {
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type PremiumTippsCountOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    deadline?: SortOrder
    imageurl?: SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PremiumTippsAvgOrderByAggregateInput = {
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
  }

  export type PremiumTippsMaxOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    deadline?: SortOrder
    imageurl?: SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PremiumTippsMinOrderByAggregateInput = {
    id?: SortOrder
    slug?: SortOrder
    title?: SortOrder
    content?: SortOrder
    deadline?: SortOrder
    imageurl?: SortOrder
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PremiumTippsSumOrderByAggregateInput = {
    price?: SortOrder
    prize?: SortOrder
    odds?: SortOrder
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type AdminPostsScalarRelationFilter = {
    is?: AdminPostsWhereInput
    isNot?: AdminPostsWhereInput
  }

  export type FreeTippsNullableScalarRelationFilter = {
    is?: FreeTippsWhereInput | null
    isNot?: FreeTippsWhereInput | null
  }

  export type PremiumTippsNullableScalarRelationFilter = {
    is?: PremiumTippsWhereInput | null
    isNot?: PremiumTippsWhereInput | null
  }

  export type CommentCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    hidden?: SortOrder
    userId?: SortOrder
    postId?: SortOrder
    freeTippId?: SortOrder
    premiumTippId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CommentMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    hidden?: SortOrder
    userId?: SortOrder
    postId?: SortOrder
    freeTippId?: SortOrder
    premiumTippId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CommentMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    hidden?: SortOrder
    userId?: SortOrder
    postId?: SortOrder
    freeTippId?: SortOrder
    premiumTippId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubscriptionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    validUntil?: SortOrder
  }

  export type SubscriptionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    validUntil?: SortOrder
  }

  export type SubscriptionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    validUntil?: SortOrder
  }

  export type freeTipsStatisticCountOrderByAggregateInput = {
    id?: SortOrder
    numberOfTipps?: SortOrder
    goodTippNumber?: SortOrder
    badTippNumber?: SortOrder
    AllBet?: SortOrder
    WinMoney?: SortOrder
    LostMoney?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type freeTipsStatisticAvgOrderByAggregateInput = {
    numberOfTipps?: SortOrder
    goodTippNumber?: SortOrder
    badTippNumber?: SortOrder
    AllBet?: SortOrder
    WinMoney?: SortOrder
    LostMoney?: SortOrder
  }

  export type freeTipsStatisticMaxOrderByAggregateInput = {
    id?: SortOrder
    numberOfTipps?: SortOrder
    goodTippNumber?: SortOrder
    badTippNumber?: SortOrder
    AllBet?: SortOrder
    WinMoney?: SortOrder
    LostMoney?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type freeTipsStatisticMinOrderByAggregateInput = {
    id?: SortOrder
    numberOfTipps?: SortOrder
    goodTippNumber?: SortOrder
    badTippNumber?: SortOrder
    AllBet?: SortOrder
    WinMoney?: SortOrder
    LostMoney?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type freeTipsStatisticSumOrderByAggregateInput = {
    numberOfTipps?: SortOrder
    goodTippNumber?: SortOrder
    badTippNumber?: SortOrder
    AllBet?: SortOrder
    WinMoney?: SortOrder
    LostMoney?: SortOrder
  }

  export type CommentCreateNestedManyWithoutUserInput = {
    create?: XOR<CommentCreateWithoutUserInput, CommentUncheckedCreateWithoutUserInput> | CommentCreateWithoutUserInput[] | CommentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutUserInput | CommentCreateOrConnectWithoutUserInput[]
    createMany?: CommentCreateManyUserInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type SubscriptionCreateNestedOneWithoutUserInput = {
    create?: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    connectOrCreate?: SubscriptionCreateOrConnectWithoutUserInput
    connect?: SubscriptionWhereUniqueInput
  }

  export type CommentUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<CommentCreateWithoutUserInput, CommentUncheckedCreateWithoutUserInput> | CommentCreateWithoutUserInput[] | CommentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutUserInput | CommentCreateOrConnectWithoutUserInput[]
    createMany?: CommentCreateManyUserInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type SubscriptionUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    connectOrCreate?: SubscriptionCreateOrConnectWithoutUserInput
    connect?: SubscriptionWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type CommentUpdateManyWithoutUserNestedInput = {
    create?: XOR<CommentCreateWithoutUserInput, CommentUncheckedCreateWithoutUserInput> | CommentCreateWithoutUserInput[] | CommentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutUserInput | CommentCreateOrConnectWithoutUserInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutUserInput | CommentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CommentCreateManyUserInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutUserInput | CommentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutUserInput | CommentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type SubscriptionUpdateOneWithoutUserNestedInput = {
    create?: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    connectOrCreate?: SubscriptionCreateOrConnectWithoutUserInput
    upsert?: SubscriptionUpsertWithoutUserInput
    disconnect?: SubscriptionWhereInput | boolean
    delete?: SubscriptionWhereInput | boolean
    connect?: SubscriptionWhereUniqueInput
    update?: XOR<XOR<SubscriptionUpdateToOneWithWhereWithoutUserInput, SubscriptionUpdateWithoutUserInput>, SubscriptionUncheckedUpdateWithoutUserInput>
  }

  export type CommentUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<CommentCreateWithoutUserInput, CommentUncheckedCreateWithoutUserInput> | CommentCreateWithoutUserInput[] | CommentUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutUserInput | CommentCreateOrConnectWithoutUserInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutUserInput | CommentUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CommentCreateManyUserInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutUserInput | CommentUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutUserInput | CommentUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type SubscriptionUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    connectOrCreate?: SubscriptionCreateOrConnectWithoutUserInput
    upsert?: SubscriptionUpsertWithoutUserInput
    disconnect?: SubscriptionWhereInput | boolean
    delete?: SubscriptionWhereInput | boolean
    connect?: SubscriptionWhereUniqueInput
    update?: XOR<XOR<SubscriptionUpdateToOneWithWhereWithoutUserInput, SubscriptionUpdateWithoutUserInput>, SubscriptionUncheckedUpdateWithoutUserInput>
  }

  export type CommentCreateNestedManyWithoutPostInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutPostInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CommentUpdateManyWithoutPostNestedInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutPostInput | CommentUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutPostInput | CommentUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutPostInput | CommentUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutPostNestedInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutPostInput | CommentUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutPostInput | CommentUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutPostInput | CommentUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type CommentCreateNestedManyWithoutFreeTippInput = {
    create?: XOR<CommentCreateWithoutFreeTippInput, CommentUncheckedCreateWithoutFreeTippInput> | CommentCreateWithoutFreeTippInput[] | CommentUncheckedCreateWithoutFreeTippInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutFreeTippInput | CommentCreateOrConnectWithoutFreeTippInput[]
    createMany?: CommentCreateManyFreeTippInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutFreeTippInput = {
    create?: XOR<CommentCreateWithoutFreeTippInput, CommentUncheckedCreateWithoutFreeTippInput> | CommentCreateWithoutFreeTippInput[] | CommentUncheckedCreateWithoutFreeTippInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutFreeTippInput | CommentCreateOrConnectWithoutFreeTippInput[]
    createMany?: CommentCreateManyFreeTippInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type CommentUpdateManyWithoutFreeTippNestedInput = {
    create?: XOR<CommentCreateWithoutFreeTippInput, CommentUncheckedCreateWithoutFreeTippInput> | CommentCreateWithoutFreeTippInput[] | CommentUncheckedCreateWithoutFreeTippInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutFreeTippInput | CommentCreateOrConnectWithoutFreeTippInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutFreeTippInput | CommentUpsertWithWhereUniqueWithoutFreeTippInput[]
    createMany?: CommentCreateManyFreeTippInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutFreeTippInput | CommentUpdateWithWhereUniqueWithoutFreeTippInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutFreeTippInput | CommentUpdateManyWithWhereWithoutFreeTippInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutFreeTippNestedInput = {
    create?: XOR<CommentCreateWithoutFreeTippInput, CommentUncheckedCreateWithoutFreeTippInput> | CommentCreateWithoutFreeTippInput[] | CommentUncheckedCreateWithoutFreeTippInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutFreeTippInput | CommentCreateOrConnectWithoutFreeTippInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutFreeTippInput | CommentUpsertWithWhereUniqueWithoutFreeTippInput[]
    createMany?: CommentCreateManyFreeTippInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutFreeTippInput | CommentUpdateWithWhereUniqueWithoutFreeTippInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutFreeTippInput | CommentUpdateManyWithWhereWithoutFreeTippInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type CommentCreateNestedManyWithoutPremiumTippInput = {
    create?: XOR<CommentCreateWithoutPremiumTippInput, CommentUncheckedCreateWithoutPremiumTippInput> | CommentCreateWithoutPremiumTippInput[] | CommentUncheckedCreateWithoutPremiumTippInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPremiumTippInput | CommentCreateOrConnectWithoutPremiumTippInput[]
    createMany?: CommentCreateManyPremiumTippInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutPremiumTippInput = {
    create?: XOR<CommentCreateWithoutPremiumTippInput, CommentUncheckedCreateWithoutPremiumTippInput> | CommentCreateWithoutPremiumTippInput[] | CommentUncheckedCreateWithoutPremiumTippInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPremiumTippInput | CommentCreateOrConnectWithoutPremiumTippInput[]
    createMany?: CommentCreateManyPremiumTippInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type CommentUpdateManyWithoutPremiumTippNestedInput = {
    create?: XOR<CommentCreateWithoutPremiumTippInput, CommentUncheckedCreateWithoutPremiumTippInput> | CommentCreateWithoutPremiumTippInput[] | CommentUncheckedCreateWithoutPremiumTippInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPremiumTippInput | CommentCreateOrConnectWithoutPremiumTippInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutPremiumTippInput | CommentUpsertWithWhereUniqueWithoutPremiumTippInput[]
    createMany?: CommentCreateManyPremiumTippInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutPremiumTippInput | CommentUpdateWithWhereUniqueWithoutPremiumTippInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutPremiumTippInput | CommentUpdateManyWithWhereWithoutPremiumTippInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutPremiumTippNestedInput = {
    create?: XOR<CommentCreateWithoutPremiumTippInput, CommentUncheckedCreateWithoutPremiumTippInput> | CommentCreateWithoutPremiumTippInput[] | CommentUncheckedCreateWithoutPremiumTippInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPremiumTippInput | CommentCreateOrConnectWithoutPremiumTippInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutPremiumTippInput | CommentUpsertWithWhereUniqueWithoutPremiumTippInput[]
    createMany?: CommentCreateManyPremiumTippInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutPremiumTippInput | CommentUpdateWithWhereUniqueWithoutPremiumTippInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutPremiumTippInput | CommentUpdateManyWithWhereWithoutPremiumTippInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutCommentsInput = {
    create?: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCommentsInput
    connect?: UserWhereUniqueInput
  }

  export type AdminPostsCreateNestedOneWithoutCommentsInput = {
    create?: XOR<AdminPostsCreateWithoutCommentsInput, AdminPostsUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: AdminPostsCreateOrConnectWithoutCommentsInput
    connect?: AdminPostsWhereUniqueInput
  }

  export type FreeTippsCreateNestedOneWithoutCommentsInput = {
    create?: XOR<FreeTippsCreateWithoutCommentsInput, FreeTippsUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: FreeTippsCreateOrConnectWithoutCommentsInput
    connect?: FreeTippsWhereUniqueInput
  }

  export type PremiumTippsCreateNestedOneWithoutCommentsInput = {
    create?: XOR<PremiumTippsCreateWithoutCommentsInput, PremiumTippsUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: PremiumTippsCreateOrConnectWithoutCommentsInput
    connect?: PremiumTippsWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCommentsInput
    upsert?: UserUpsertWithoutCommentsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCommentsInput, UserUpdateWithoutCommentsInput>, UserUncheckedUpdateWithoutCommentsInput>
  }

  export type AdminPostsUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<AdminPostsCreateWithoutCommentsInput, AdminPostsUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: AdminPostsCreateOrConnectWithoutCommentsInput
    upsert?: AdminPostsUpsertWithoutCommentsInput
    connect?: AdminPostsWhereUniqueInput
    update?: XOR<XOR<AdminPostsUpdateToOneWithWhereWithoutCommentsInput, AdminPostsUpdateWithoutCommentsInput>, AdminPostsUncheckedUpdateWithoutCommentsInput>
  }

  export type FreeTippsUpdateOneWithoutCommentsNestedInput = {
    create?: XOR<FreeTippsCreateWithoutCommentsInput, FreeTippsUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: FreeTippsCreateOrConnectWithoutCommentsInput
    upsert?: FreeTippsUpsertWithoutCommentsInput
    disconnect?: FreeTippsWhereInput | boolean
    delete?: FreeTippsWhereInput | boolean
    connect?: FreeTippsWhereUniqueInput
    update?: XOR<XOR<FreeTippsUpdateToOneWithWhereWithoutCommentsInput, FreeTippsUpdateWithoutCommentsInput>, FreeTippsUncheckedUpdateWithoutCommentsInput>
  }

  export type PremiumTippsUpdateOneWithoutCommentsNestedInput = {
    create?: XOR<PremiumTippsCreateWithoutCommentsInput, PremiumTippsUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: PremiumTippsCreateOrConnectWithoutCommentsInput
    upsert?: PremiumTippsUpsertWithoutCommentsInput
    disconnect?: PremiumTippsWhereInput | boolean
    delete?: PremiumTippsWhereInput | boolean
    connect?: PremiumTippsWhereUniqueInput
    update?: XOR<XOR<PremiumTippsUpdateToOneWithWhereWithoutCommentsInput, PremiumTippsUpdateWithoutCommentsInput>, PremiumTippsUncheckedUpdateWithoutCommentsInput>
  }

  export type UserCreateNestedOneWithoutSubscriptionInput = {
    create?: XOR<UserCreateWithoutSubscriptionInput, UserUncheckedCreateWithoutSubscriptionInput>
    connectOrCreate?: UserCreateOrConnectWithoutSubscriptionInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSubscriptionNestedInput = {
    create?: XOR<UserCreateWithoutSubscriptionInput, UserUncheckedCreateWithoutSubscriptionInput>
    connectOrCreate?: UserCreateOrConnectWithoutSubscriptionInput
    upsert?: UserUpsertWithoutSubscriptionInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSubscriptionInput, UserUpdateWithoutSubscriptionInput>, UserUncheckedUpdateWithoutSubscriptionInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type CommentCreateWithoutUserInput = {
    id?: string
    content: string
    hidden?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    post: AdminPostsCreateNestedOneWithoutCommentsInput
    freeTipp?: FreeTippsCreateNestedOneWithoutCommentsInput
    premiumTipp?: PremiumTippsCreateNestedOneWithoutCommentsInput
  }

  export type CommentUncheckedCreateWithoutUserInput = {
    id?: string
    content: string
    hidden?: boolean
    postId: string
    freeTippId?: string | null
    premiumTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentCreateOrConnectWithoutUserInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutUserInput, CommentUncheckedCreateWithoutUserInput>
  }

  export type CommentCreateManyUserInputEnvelope = {
    data: CommentCreateManyUserInput | CommentCreateManyUserInput[]
  }

  export type SubscriptionCreateWithoutUserInput = {
    id?: string
    validUntil: Date | string
  }

  export type SubscriptionUncheckedCreateWithoutUserInput = {
    id?: string
    validUntil: Date | string
  }

  export type SubscriptionCreateOrConnectWithoutUserInput = {
    where: SubscriptionWhereUniqueInput
    create: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
  }

  export type CommentUpsertWithWhereUniqueWithoutUserInput = {
    where: CommentWhereUniqueInput
    update: XOR<CommentUpdateWithoutUserInput, CommentUncheckedUpdateWithoutUserInput>
    create: XOR<CommentCreateWithoutUserInput, CommentUncheckedCreateWithoutUserInput>
  }

  export type CommentUpdateWithWhereUniqueWithoutUserInput = {
    where: CommentWhereUniqueInput
    data: XOR<CommentUpdateWithoutUserInput, CommentUncheckedUpdateWithoutUserInput>
  }

  export type CommentUpdateManyWithWhereWithoutUserInput = {
    where: CommentScalarWhereInput
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyWithoutUserInput>
  }

  export type CommentScalarWhereInput = {
    AND?: CommentScalarWhereInput | CommentScalarWhereInput[]
    OR?: CommentScalarWhereInput[]
    NOT?: CommentScalarWhereInput | CommentScalarWhereInput[]
    id?: StringFilter<"Comment"> | string
    content?: StringFilter<"Comment"> | string
    hidden?: BoolFilter<"Comment"> | boolean
    userId?: StringFilter<"Comment"> | string
    postId?: StringFilter<"Comment"> | string
    freeTippId?: StringNullableFilter<"Comment"> | string | null
    premiumTippId?: StringNullableFilter<"Comment"> | string | null
    createdAt?: DateTimeFilter<"Comment"> | Date | string
    updatedAt?: DateTimeFilter<"Comment"> | Date | string
  }

  export type SubscriptionUpsertWithoutUserInput = {
    update: XOR<SubscriptionUpdateWithoutUserInput, SubscriptionUncheckedUpdateWithoutUserInput>
    create: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    where?: SubscriptionWhereInput
  }

  export type SubscriptionUpdateToOneWithWhereWithoutUserInput = {
    where?: SubscriptionWhereInput
    data: XOR<SubscriptionUpdateWithoutUserInput, SubscriptionUncheckedUpdateWithoutUserInput>
  }

  export type SubscriptionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    validUntil?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    validUntil?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentCreateWithoutPostInput = {
    id?: string
    content: string
    hidden?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutCommentsInput
    freeTipp?: FreeTippsCreateNestedOneWithoutCommentsInput
    premiumTipp?: PremiumTippsCreateNestedOneWithoutCommentsInput
  }

  export type CommentUncheckedCreateWithoutPostInput = {
    id?: string
    content: string
    hidden?: boolean
    userId: string
    freeTippId?: string | null
    premiumTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentCreateOrConnectWithoutPostInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput>
  }

  export type CommentCreateManyPostInputEnvelope = {
    data: CommentCreateManyPostInput | CommentCreateManyPostInput[]
  }

  export type CommentUpsertWithWhereUniqueWithoutPostInput = {
    where: CommentWhereUniqueInput
    update: XOR<CommentUpdateWithoutPostInput, CommentUncheckedUpdateWithoutPostInput>
    create: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput>
  }

  export type CommentUpdateWithWhereUniqueWithoutPostInput = {
    where: CommentWhereUniqueInput
    data: XOR<CommentUpdateWithoutPostInput, CommentUncheckedUpdateWithoutPostInput>
  }

  export type CommentUpdateManyWithWhereWithoutPostInput = {
    where: CommentScalarWhereInput
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyWithoutPostInput>
  }

  export type CommentCreateWithoutFreeTippInput = {
    id?: string
    content: string
    hidden?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutCommentsInput
    post: AdminPostsCreateNestedOneWithoutCommentsInput
    premiumTipp?: PremiumTippsCreateNestedOneWithoutCommentsInput
  }

  export type CommentUncheckedCreateWithoutFreeTippInput = {
    id?: string
    content: string
    hidden?: boolean
    userId: string
    postId: string
    premiumTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentCreateOrConnectWithoutFreeTippInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutFreeTippInput, CommentUncheckedCreateWithoutFreeTippInput>
  }

  export type CommentCreateManyFreeTippInputEnvelope = {
    data: CommentCreateManyFreeTippInput | CommentCreateManyFreeTippInput[]
  }

  export type CommentUpsertWithWhereUniqueWithoutFreeTippInput = {
    where: CommentWhereUniqueInput
    update: XOR<CommentUpdateWithoutFreeTippInput, CommentUncheckedUpdateWithoutFreeTippInput>
    create: XOR<CommentCreateWithoutFreeTippInput, CommentUncheckedCreateWithoutFreeTippInput>
  }

  export type CommentUpdateWithWhereUniqueWithoutFreeTippInput = {
    where: CommentWhereUniqueInput
    data: XOR<CommentUpdateWithoutFreeTippInput, CommentUncheckedUpdateWithoutFreeTippInput>
  }

  export type CommentUpdateManyWithWhereWithoutFreeTippInput = {
    where: CommentScalarWhereInput
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyWithoutFreeTippInput>
  }

  export type CommentCreateWithoutPremiumTippInput = {
    id?: string
    content: string
    hidden?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutCommentsInput
    post: AdminPostsCreateNestedOneWithoutCommentsInput
    freeTipp?: FreeTippsCreateNestedOneWithoutCommentsInput
  }

  export type CommentUncheckedCreateWithoutPremiumTippInput = {
    id?: string
    content: string
    hidden?: boolean
    userId: string
    postId: string
    freeTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentCreateOrConnectWithoutPremiumTippInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutPremiumTippInput, CommentUncheckedCreateWithoutPremiumTippInput>
  }

  export type CommentCreateManyPremiumTippInputEnvelope = {
    data: CommentCreateManyPremiumTippInput | CommentCreateManyPremiumTippInput[]
  }

  export type CommentUpsertWithWhereUniqueWithoutPremiumTippInput = {
    where: CommentWhereUniqueInput
    update: XOR<CommentUpdateWithoutPremiumTippInput, CommentUncheckedUpdateWithoutPremiumTippInput>
    create: XOR<CommentCreateWithoutPremiumTippInput, CommentUncheckedCreateWithoutPremiumTippInput>
  }

  export type CommentUpdateWithWhereUniqueWithoutPremiumTippInput = {
    where: CommentWhereUniqueInput
    data: XOR<CommentUpdateWithoutPremiumTippInput, CommentUncheckedUpdateWithoutPremiumTippInput>
  }

  export type CommentUpdateManyWithWhereWithoutPremiumTippInput = {
    where: CommentScalarWhereInput
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyWithoutPremiumTippInput>
  }

  export type UserCreateWithoutCommentsInput = {
    id?: string
    username: string
    email: string
    password: string
    avatar?: string | null
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
    subscription?: SubscriptionCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCommentsInput = {
    id?: string
    username: string
    email: string
    password: string
    avatar?: string | null
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
    subscription?: SubscriptionUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCommentsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
  }

  export type AdminPostsCreateWithoutCommentsInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AdminPostsUncheckedCreateWithoutCommentsInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AdminPostsCreateOrConnectWithoutCommentsInput = {
    where: AdminPostsWhereUniqueInput
    create: XOR<AdminPostsCreateWithoutCommentsInput, AdminPostsUncheckedCreateWithoutCommentsInput>
  }

  export type FreeTippsCreateWithoutCommentsInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl?: string | null
    deadline: Date | string
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FreeTippsUncheckedCreateWithoutCommentsInput = {
    id?: string
    slug: string
    title: string
    content: string
    imageurl?: string | null
    deadline: Date | string
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type FreeTippsCreateOrConnectWithoutCommentsInput = {
    where: FreeTippsWhereUniqueInput
    create: XOR<FreeTippsCreateWithoutCommentsInput, FreeTippsUncheckedCreateWithoutCommentsInput>
  }

  export type PremiumTippsCreateWithoutCommentsInput = {
    id?: string
    slug: string
    title: string
    content: string
    deadline: Date | string
    imageurl?: string | null
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PremiumTippsUncheckedCreateWithoutCommentsInput = {
    id?: string
    slug: string
    title: string
    content: string
    deadline: Date | string
    imageurl?: string | null
    price?: number
    prize?: number
    odds?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PremiumTippsCreateOrConnectWithoutCommentsInput = {
    where: PremiumTippsWhereUniqueInput
    create: XOR<PremiumTippsCreateWithoutCommentsInput, PremiumTippsUncheckedCreateWithoutCommentsInput>
  }

  export type UserUpsertWithoutCommentsInput = {
    update: XOR<UserUpdateWithoutCommentsInput, UserUncheckedUpdateWithoutCommentsInput>
    create: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCommentsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCommentsInput, UserUncheckedUpdateWithoutCommentsInput>
  }

  export type UserUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isPaid?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    subscription?: SubscriptionUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isPaid?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    subscription?: SubscriptionUncheckedUpdateOneWithoutUserNestedInput
  }

  export type AdminPostsUpsertWithoutCommentsInput = {
    update: XOR<AdminPostsUpdateWithoutCommentsInput, AdminPostsUncheckedUpdateWithoutCommentsInput>
    create: XOR<AdminPostsCreateWithoutCommentsInput, AdminPostsUncheckedCreateWithoutCommentsInput>
    where?: AdminPostsWhereInput
  }

  export type AdminPostsUpdateToOneWithWhereWithoutCommentsInput = {
    where?: AdminPostsWhereInput
    data: XOR<AdminPostsUpdateWithoutCommentsInput, AdminPostsUncheckedUpdateWithoutCommentsInput>
  }

  export type AdminPostsUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminPostsUncheckedUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FreeTippsUpsertWithoutCommentsInput = {
    update: XOR<FreeTippsUpdateWithoutCommentsInput, FreeTippsUncheckedUpdateWithoutCommentsInput>
    create: XOR<FreeTippsCreateWithoutCommentsInput, FreeTippsUncheckedCreateWithoutCommentsInput>
    where?: FreeTippsWhereInput
  }

  export type FreeTippsUpdateToOneWithWhereWithoutCommentsInput = {
    where?: FreeTippsWhereInput
    data: XOR<FreeTippsUpdateWithoutCommentsInput, FreeTippsUncheckedUpdateWithoutCommentsInput>
  }

  export type FreeTippsUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FreeTippsUncheckedUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PremiumTippsUpsertWithoutCommentsInput = {
    update: XOR<PremiumTippsUpdateWithoutCommentsInput, PremiumTippsUncheckedUpdateWithoutCommentsInput>
    create: XOR<PremiumTippsCreateWithoutCommentsInput, PremiumTippsUncheckedCreateWithoutCommentsInput>
    where?: PremiumTippsWhereInput
  }

  export type PremiumTippsUpdateToOneWithWhereWithoutCommentsInput = {
    where?: PremiumTippsWhereInput
    data: XOR<PremiumTippsUpdateWithoutCommentsInput, PremiumTippsUncheckedUpdateWithoutCommentsInput>
  }

  export type PremiumTippsUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PremiumTippsUncheckedUpdateWithoutCommentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    deadline?: DateTimeFieldUpdateOperationsInput | Date | string
    imageurl?: NullableStringFieldUpdateOperationsInput | string | null
    price?: IntFieldUpdateOperationsInput | number
    prize?: IntFieldUpdateOperationsInput | number
    odds?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutSubscriptionInput = {
    id?: string
    username: string
    email: string
    password: string
    avatar?: string | null
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
    comments?: CommentCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSubscriptionInput = {
    id?: string
    username: string
    email: string
    password: string
    avatar?: string | null
    isAdmin?: boolean
    isPaid?: boolean
    isBanned?: boolean
    comments?: CommentUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSubscriptionInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSubscriptionInput, UserUncheckedCreateWithoutSubscriptionInput>
  }

  export type UserUpsertWithoutSubscriptionInput = {
    update: XOR<UserUpdateWithoutSubscriptionInput, UserUncheckedUpdateWithoutSubscriptionInput>
    create: XOR<UserCreateWithoutSubscriptionInput, UserUncheckedCreateWithoutSubscriptionInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSubscriptionInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSubscriptionInput, UserUncheckedUpdateWithoutSubscriptionInput>
  }

  export type UserUpdateWithoutSubscriptionInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isPaid?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    comments?: CommentUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSubscriptionInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    isAdmin?: BoolFieldUpdateOperationsInput | boolean
    isPaid?: BoolFieldUpdateOperationsInput | boolean
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    comments?: CommentUncheckedUpdateManyWithoutUserNestedInput
  }

  export type CommentCreateManyUserInput = {
    id?: string
    content: string
    hidden?: boolean
    postId: string
    freeTippId?: string | null
    premiumTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: AdminPostsUpdateOneRequiredWithoutCommentsNestedInput
    freeTipp?: FreeTippsUpdateOneWithoutCommentsNestedInput
    premiumTipp?: PremiumTippsUpdateOneWithoutCommentsNestedInput
  }

  export type CommentUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    postId?: StringFieldUpdateOperationsInput | string
    freeTippId?: NullableStringFieldUpdateOperationsInput | string | null
    premiumTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    postId?: StringFieldUpdateOperationsInput | string
    freeTippId?: NullableStringFieldUpdateOperationsInput | string | null
    premiumTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentCreateManyPostInput = {
    id?: string
    content: string
    hidden?: boolean
    userId: string
    freeTippId?: string | null
    premiumTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCommentsNestedInput
    freeTipp?: FreeTippsUpdateOneWithoutCommentsNestedInput
    premiumTipp?: PremiumTippsUpdateOneWithoutCommentsNestedInput
  }

  export type CommentUncheckedUpdateWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    freeTippId?: NullableStringFieldUpdateOperationsInput | string | null
    premiumTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUncheckedUpdateManyWithoutPostInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    freeTippId?: NullableStringFieldUpdateOperationsInput | string | null
    premiumTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentCreateManyFreeTippInput = {
    id?: string
    content: string
    hidden?: boolean
    userId: string
    postId: string
    premiumTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentUpdateWithoutFreeTippInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCommentsNestedInput
    post?: AdminPostsUpdateOneRequiredWithoutCommentsNestedInput
    premiumTipp?: PremiumTippsUpdateOneWithoutCommentsNestedInput
  }

  export type CommentUncheckedUpdateWithoutFreeTippInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    premiumTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUncheckedUpdateManyWithoutFreeTippInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    premiumTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentCreateManyPremiumTippInput = {
    id?: string
    content: string
    hidden?: boolean
    userId: string
    postId: string
    freeTippId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentUpdateWithoutPremiumTippInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCommentsNestedInput
    post?: AdminPostsUpdateOneRequiredWithoutCommentsNestedInput
    freeTipp?: FreeTippsUpdateOneWithoutCommentsNestedInput
  }

  export type CommentUncheckedUpdateWithoutPremiumTippInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    freeTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUncheckedUpdateManyWithoutPremiumTippInput = {
    id?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    hidden?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    postId?: StringFieldUpdateOperationsInput | string
    freeTippId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}