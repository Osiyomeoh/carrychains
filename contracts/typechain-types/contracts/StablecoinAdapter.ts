/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export interface StablecoinAdapterInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "addSupportedToken"
      | "convertAmount"
      | "getExchangeRate"
      | "getSupportedTokens"
      | "isTokenSupported"
      | "owner"
      | "processPayment"
      | "removeSupportedToken"
      | "renounceOwnership"
      | "supportedTokens"
      | "tokenDecimals"
      | "tokenList"
      | "tokenPrices"
      | "transferOwnership"
      | "updateTokenPrice"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "OwnershipTransferred"
      | "PaymentProcessed"
      | "PriceUpdated"
      | "TokenAdded"
      | "TokenRemoved"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "addSupportedToken",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "convertAmount",
    values: [AddressLike, AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getExchangeRate",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getSupportedTokens",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isTokenSupported",
    values: [AddressLike]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "processPayment",
    values: [AddressLike, AddressLike, AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "removeSupportedToken",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "supportedTokens",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "tokenDecimals",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "tokenList",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "tokenPrices",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "updateTokenPrice",
    values: [AddressLike, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "addSupportedToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "convertAmount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getExchangeRate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getSupportedTokens",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isTokenSupported",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "processPayment",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeSupportedToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportedTokens",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tokenDecimals",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "tokenList", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "tokenPrices",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateTokenPrice",
    data: BytesLike
  ): Result;
}

export namespace OwnershipTransferredEvent {
  export type InputTuple = [previousOwner: AddressLike, newOwner: AddressLike];
  export type OutputTuple = [previousOwner: string, newOwner: string];
  export interface OutputObject {
    previousOwner: string;
    newOwner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace PaymentProcessedEvent {
  export type InputTuple = [
    from: AddressLike,
    to: AddressLike,
    token: AddressLike,
    amount: BigNumberish
  ];
  export type OutputTuple = [
    from: string,
    to: string,
    token: string,
    amount: bigint
  ];
  export interface OutputObject {
    from: string;
    to: string;
    token: string;
    amount: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace PriceUpdatedEvent {
  export type InputTuple = [token: AddressLike, price: BigNumberish];
  export type OutputTuple = [token: string, price: bigint];
  export interface OutputObject {
    token: string;
    price: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace TokenAddedEvent {
  export type InputTuple = [token: AddressLike, decimals: BigNumberish];
  export type OutputTuple = [token: string, decimals: bigint];
  export interface OutputObject {
    token: string;
    decimals: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace TokenRemovedEvent {
  export type InputTuple = [token: AddressLike];
  export type OutputTuple = [token: string];
  export interface OutputObject {
    token: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface StablecoinAdapter extends BaseContract {
  connect(runner?: ContractRunner | null): StablecoinAdapter;
  waitForDeployment(): Promise<this>;

  interface: StablecoinAdapterInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  addSupportedToken: TypedContractMethod<
    [token: AddressLike],
    [void],
    "nonpayable"
  >;

  convertAmount: TypedContractMethod<
    [fromToken: AddressLike, toToken: AddressLike, amount: BigNumberish],
    [bigint],
    "view"
  >;

  getExchangeRate: TypedContractMethod<[token: AddressLike], [bigint], "view">;

  getSupportedTokens: TypedContractMethod<[], [string[]], "view">;

  isTokenSupported: TypedContractMethod<
    [token: AddressLike],
    [boolean],
    "view"
  >;

  owner: TypedContractMethod<[], [string], "view">;

  processPayment: TypedContractMethod<
    [
      token: AddressLike,
      from: AddressLike,
      to: AddressLike,
      amount: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  removeSupportedToken: TypedContractMethod<
    [token: AddressLike],
    [void],
    "nonpayable"
  >;

  renounceOwnership: TypedContractMethod<[], [void], "nonpayable">;

  supportedTokens: TypedContractMethod<[arg0: AddressLike], [boolean], "view">;

  tokenDecimals: TypedContractMethod<[arg0: AddressLike], [bigint], "view">;

  tokenList: TypedContractMethod<[arg0: BigNumberish], [string], "view">;

  tokenPrices: TypedContractMethod<[arg0: AddressLike], [bigint], "view">;

  transferOwnership: TypedContractMethod<
    [newOwner: AddressLike],
    [void],
    "nonpayable"
  >;

  updateTokenPrice: TypedContractMethod<
    [token: AddressLike, price: BigNumberish],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "addSupportedToken"
  ): TypedContractMethod<[token: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "convertAmount"
  ): TypedContractMethod<
    [fromToken: AddressLike, toToken: AddressLike, amount: BigNumberish],
    [bigint],
    "view"
  >;
  getFunction(
    nameOrSignature: "getExchangeRate"
  ): TypedContractMethod<[token: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "getSupportedTokens"
  ): TypedContractMethod<[], [string[]], "view">;
  getFunction(
    nameOrSignature: "isTokenSupported"
  ): TypedContractMethod<[token: AddressLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "processPayment"
  ): TypedContractMethod<
    [
      token: AddressLike,
      from: AddressLike,
      to: AddressLike,
      amount: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "removeSupportedToken"
  ): TypedContractMethod<[token: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "renounceOwnership"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "supportedTokens"
  ): TypedContractMethod<[arg0: AddressLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "tokenDecimals"
  ): TypedContractMethod<[arg0: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "tokenList"
  ): TypedContractMethod<[arg0: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "tokenPrices"
  ): TypedContractMethod<[arg0: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "transferOwnership"
  ): TypedContractMethod<[newOwner: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "updateTokenPrice"
  ): TypedContractMethod<
    [token: AddressLike, price: BigNumberish],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "OwnershipTransferred"
  ): TypedContractEvent<
    OwnershipTransferredEvent.InputTuple,
    OwnershipTransferredEvent.OutputTuple,
    OwnershipTransferredEvent.OutputObject
  >;
  getEvent(
    key: "PaymentProcessed"
  ): TypedContractEvent<
    PaymentProcessedEvent.InputTuple,
    PaymentProcessedEvent.OutputTuple,
    PaymentProcessedEvent.OutputObject
  >;
  getEvent(
    key: "PriceUpdated"
  ): TypedContractEvent<
    PriceUpdatedEvent.InputTuple,
    PriceUpdatedEvent.OutputTuple,
    PriceUpdatedEvent.OutputObject
  >;
  getEvent(
    key: "TokenAdded"
  ): TypedContractEvent<
    TokenAddedEvent.InputTuple,
    TokenAddedEvent.OutputTuple,
    TokenAddedEvent.OutputObject
  >;
  getEvent(
    key: "TokenRemoved"
  ): TypedContractEvent<
    TokenRemovedEvent.InputTuple,
    TokenRemovedEvent.OutputTuple,
    TokenRemovedEvent.OutputObject
  >;

  filters: {
    "OwnershipTransferred(address,address)": TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;
    OwnershipTransferred: TypedContractEvent<
      OwnershipTransferredEvent.InputTuple,
      OwnershipTransferredEvent.OutputTuple,
      OwnershipTransferredEvent.OutputObject
    >;

    "PaymentProcessed(address,address,address,uint256)": TypedContractEvent<
      PaymentProcessedEvent.InputTuple,
      PaymentProcessedEvent.OutputTuple,
      PaymentProcessedEvent.OutputObject
    >;
    PaymentProcessed: TypedContractEvent<
      PaymentProcessedEvent.InputTuple,
      PaymentProcessedEvent.OutputTuple,
      PaymentProcessedEvent.OutputObject
    >;

    "PriceUpdated(address,uint256)": TypedContractEvent<
      PriceUpdatedEvent.InputTuple,
      PriceUpdatedEvent.OutputTuple,
      PriceUpdatedEvent.OutputObject
    >;
    PriceUpdated: TypedContractEvent<
      PriceUpdatedEvent.InputTuple,
      PriceUpdatedEvent.OutputTuple,
      PriceUpdatedEvent.OutputObject
    >;

    "TokenAdded(address,uint256)": TypedContractEvent<
      TokenAddedEvent.InputTuple,
      TokenAddedEvent.OutputTuple,
      TokenAddedEvent.OutputObject
    >;
    TokenAdded: TypedContractEvent<
      TokenAddedEvent.InputTuple,
      TokenAddedEvent.OutputTuple,
      TokenAddedEvent.OutputObject
    >;

    "TokenRemoved(address)": TypedContractEvent<
      TokenRemovedEvent.InputTuple,
      TokenRemovedEvent.OutputTuple,
      TokenRemovedEvent.OutputObject
    >;
    TokenRemoved: TypedContractEvent<
      TokenRemovedEvent.InputTuple,
      TokenRemovedEvent.OutputTuple,
      TokenRemovedEvent.OutputObject
    >;
  };
}
