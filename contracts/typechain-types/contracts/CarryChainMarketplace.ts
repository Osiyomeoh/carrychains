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

export declare namespace CarryChainMarketplace {
  export type DeliveryStruct = {
    id: BigNumberish;
    routeId: BigNumberish;
    traveler: AddressLike;
    shipper: AddressLike;
    packageDescription: string;
    packageWeight: BigNumberish;
    totalPrice: BigNumberish;
    status: BigNumberish;
    createdAt: BigNumberish;
    disputed: boolean;
  };

  export type DeliveryStructOutput = [
    id: bigint,
    routeId: bigint,
    traveler: string,
    shipper: string,
    packageDescription: string,
    packageWeight: bigint,
    totalPrice: bigint,
    status: bigint,
    createdAt: bigint,
    disputed: boolean
  ] & {
    id: bigint;
    routeId: bigint;
    traveler: string;
    shipper: string;
    packageDescription: string;
    packageWeight: bigint;
    totalPrice: bigint;
    status: bigint;
    createdAt: bigint;
    disputed: boolean;
  };

  export type TravelRouteStruct = {
    id: BigNumberish;
    traveler: AddressLike;
    departureLocation: string;
    destinationLocation: string;
    departureTime: BigNumberish;
    arrivalTime: BigNumberish;
    availableSpace: BigNumberish;
    pricePerKg: BigNumberish;
    isActive: boolean;
  };

  export type TravelRouteStructOutput = [
    id: bigint,
    traveler: string,
    departureLocation: string,
    destinationLocation: string,
    departureTime: bigint,
    arrivalTime: bigint,
    availableSpace: bigint,
    pricePerKg: bigint,
    isActive: boolean
  ] & {
    id: bigint;
    traveler: string;
    departureLocation: string;
    destinationLocation: string;
    departureTime: bigint;
    arrivalTime: bigint;
    availableSpace: bigint;
    pricePerKg: bigint;
    isActive: boolean;
  };
}

export interface CarryChainMarketplaceInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "acceptDelivery"
      | "confirmDelivery"
      | "createDelivery"
      | "createRoute"
      | "deactivateRoute"
      | "deliveries"
      | "deliveryCount"
      | "disputeDelivery"
      | "getDelivery"
      | "getReputationScore"
      | "getRoute"
      | "markAsDelivered"
      | "markAsPickedUp"
      | "owner"
      | "platformFeePercent"
      | "positiveReviews"
      | "renounceOwnership"
      | "resolveDispute"
      | "routeCount"
      | "routes"
      | "stablecoin"
      | "submitReview"
      | "totalReviews"
      | "transferOwnership"
      | "updatePlatformFee"
      | "updateRoute"
      | "updateStablecoin"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "DeliveryCreated"
      | "DeliveryDisputed"
      | "DeliveryResolved"
      | "DeliveryStatusChanged"
      | "OwnershipTransferred"
      | "ReviewSubmitted"
      | "RouteCreated"
      | "RouteDeactivated"
      | "RouteUpdated"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "acceptDelivery",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "confirmDelivery",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "createDelivery",
    values: [BigNumberish, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "createRoute",
    values: [
      string,
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "deactivateRoute",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "deliveries",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "deliveryCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "disputeDelivery",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getDelivery",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getReputationScore",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getRoute",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "markAsDelivered",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "markAsPickedUp",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "platformFeePercent",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "positiveReviews",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "resolveDispute",
    values: [BigNumberish, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "routeCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "routes",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "stablecoin",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "submitReview",
    values: [AddressLike, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "totalReviews",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "updatePlatformFee",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "updateRoute",
    values: [
      BigNumberish,
      string,
      string,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "updateStablecoin",
    values: [AddressLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "acceptDelivery",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "confirmDelivery",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createDelivery",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createRoute",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "deactivateRoute",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deliveries", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "deliveryCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "disputeDelivery",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDelivery",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getReputationScore",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getRoute", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "markAsDelivered",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "markAsPickedUp",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "platformFeePercent",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "positiveReviews",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "resolveDispute",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "routeCount", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "routes", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "stablecoin", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "submitReview",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalReviews",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updatePlatformFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateRoute",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateStablecoin",
    data: BytesLike
  ): Result;
}

export namespace DeliveryCreatedEvent {
  export type InputTuple = [
    deliveryId: BigNumberish,
    routeId: BigNumberish,
    shipper: AddressLike
  ];
  export type OutputTuple = [
    deliveryId: bigint,
    routeId: bigint,
    shipper: string
  ];
  export interface OutputObject {
    deliveryId: bigint;
    routeId: bigint;
    shipper: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DeliveryDisputedEvent {
  export type InputTuple = [deliveryId: BigNumberish];
  export type OutputTuple = [deliveryId: bigint];
  export interface OutputObject {
    deliveryId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DeliveryResolvedEvent {
  export type InputTuple = [deliveryId: BigNumberish, favorTraveler: boolean];
  export type OutputTuple = [deliveryId: bigint, favorTraveler: boolean];
  export interface OutputObject {
    deliveryId: bigint;
    favorTraveler: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DeliveryStatusChangedEvent {
  export type InputTuple = [deliveryId: BigNumberish, status: BigNumberish];
  export type OutputTuple = [deliveryId: bigint, status: bigint];
  export interface OutputObject {
    deliveryId: bigint;
    status: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
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

export namespace ReviewSubmittedEvent {
  export type InputTuple = [
    reviewer: AddressLike,
    reviewed: AddressLike,
    positive: boolean
  ];
  export type OutputTuple = [
    reviewer: string,
    reviewed: string,
    positive: boolean
  ];
  export interface OutputObject {
    reviewer: string;
    reviewed: string;
    positive: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RouteCreatedEvent {
  export type InputTuple = [routeId: BigNumberish, traveler: AddressLike];
  export type OutputTuple = [routeId: bigint, traveler: string];
  export interface OutputObject {
    routeId: bigint;
    traveler: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RouteDeactivatedEvent {
  export type InputTuple = [routeId: BigNumberish];
  export type OutputTuple = [routeId: bigint];
  export interface OutputObject {
    routeId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace RouteUpdatedEvent {
  export type InputTuple = [routeId: BigNumberish];
  export type OutputTuple = [routeId: bigint];
  export interface OutputObject {
    routeId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface CarryChainMarketplace extends BaseContract {
  connect(runner?: ContractRunner | null): CarryChainMarketplace;
  waitForDeployment(): Promise<this>;

  interface: CarryChainMarketplaceInterface;

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

  acceptDelivery: TypedContractMethod<
    [deliveryId: BigNumberish],
    [void],
    "nonpayable"
  >;

  confirmDelivery: TypedContractMethod<
    [deliveryId: BigNumberish],
    [void],
    "nonpayable"
  >;

  createDelivery: TypedContractMethod<
    [
      routeId: BigNumberish,
      packageDescription: string,
      packageWeight: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;

  createRoute: TypedContractMethod<
    [
      departureLocation: string,
      destinationLocation: string,
      departureTime: BigNumberish,
      arrivalTime: BigNumberish,
      availableSpace: BigNumberish,
      pricePerKg: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;

  deactivateRoute: TypedContractMethod<
    [routeId: BigNumberish],
    [void],
    "nonpayable"
  >;

  deliveries: TypedContractMethod<
    [arg0: BigNumberish],
    [
      [
        bigint,
        bigint,
        string,
        string,
        string,
        bigint,
        bigint,
        bigint,
        bigint,
        boolean
      ] & {
        id: bigint;
        routeId: bigint;
        traveler: string;
        shipper: string;
        packageDescription: string;
        packageWeight: bigint;
        totalPrice: bigint;
        status: bigint;
        createdAt: bigint;
        disputed: boolean;
      }
    ],
    "view"
  >;

  deliveryCount: TypedContractMethod<[], [bigint], "view">;

  disputeDelivery: TypedContractMethod<
    [deliveryId: BigNumberish],
    [void],
    "nonpayable"
  >;

  getDelivery: TypedContractMethod<
    [deliveryId: BigNumberish],
    [CarryChainMarketplace.DeliveryStructOutput],
    "view"
  >;

  getReputationScore: TypedContractMethod<
    [user: AddressLike],
    [bigint],
    "view"
  >;

  getRoute: TypedContractMethod<
    [routeId: BigNumberish],
    [CarryChainMarketplace.TravelRouteStructOutput],
    "view"
  >;

  markAsDelivered: TypedContractMethod<
    [deliveryId: BigNumberish],
    [void],
    "nonpayable"
  >;

  markAsPickedUp: TypedContractMethod<
    [deliveryId: BigNumberish],
    [void],
    "nonpayable"
  >;

  owner: TypedContractMethod<[], [string], "view">;

  platformFeePercent: TypedContractMethod<[], [bigint], "view">;

  positiveReviews: TypedContractMethod<[arg0: AddressLike], [bigint], "view">;

  renounceOwnership: TypedContractMethod<[], [void], "nonpayable">;

  resolveDispute: TypedContractMethod<
    [deliveryId: BigNumberish, favorTraveler: boolean],
    [void],
    "nonpayable"
  >;

  routeCount: TypedContractMethod<[], [bigint], "view">;

  routes: TypedContractMethod<
    [arg0: BigNumberish],
    [
      [
        bigint,
        string,
        string,
        string,
        bigint,
        bigint,
        bigint,
        bigint,
        boolean
      ] & {
        id: bigint;
        traveler: string;
        departureLocation: string;
        destinationLocation: string;
        departureTime: bigint;
        arrivalTime: bigint;
        availableSpace: bigint;
        pricePerKg: bigint;
        isActive: boolean;
      }
    ],
    "view"
  >;

  stablecoin: TypedContractMethod<[], [string], "view">;

  submitReview: TypedContractMethod<
    [reviewed: AddressLike, positive: boolean],
    [void],
    "nonpayable"
  >;

  totalReviews: TypedContractMethod<[arg0: AddressLike], [bigint], "view">;

  transferOwnership: TypedContractMethod<
    [newOwner: AddressLike],
    [void],
    "nonpayable"
  >;

  updatePlatformFee: TypedContractMethod<
    [newFeePercent: BigNumberish],
    [void],
    "nonpayable"
  >;

  updateRoute: TypedContractMethod<
    [
      routeId: BigNumberish,
      departureLocation: string,
      destinationLocation: string,
      departureTime: BigNumberish,
      arrivalTime: BigNumberish,
      availableSpace: BigNumberish,
      pricePerKg: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  updateStablecoin: TypedContractMethod<
    [newStablecoin: AddressLike],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "acceptDelivery"
  ): TypedContractMethod<[deliveryId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "confirmDelivery"
  ): TypedContractMethod<[deliveryId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "createDelivery"
  ): TypedContractMethod<
    [
      routeId: BigNumberish,
      packageDescription: string,
      packageWeight: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "createRoute"
  ): TypedContractMethod<
    [
      departureLocation: string,
      destinationLocation: string,
      departureTime: BigNumberish,
      arrivalTime: BigNumberish,
      availableSpace: BigNumberish,
      pricePerKg: BigNumberish
    ],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "deactivateRoute"
  ): TypedContractMethod<[routeId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "deliveries"
  ): TypedContractMethod<
    [arg0: BigNumberish],
    [
      [
        bigint,
        bigint,
        string,
        string,
        string,
        bigint,
        bigint,
        bigint,
        bigint,
        boolean
      ] & {
        id: bigint;
        routeId: bigint;
        traveler: string;
        shipper: string;
        packageDescription: string;
        packageWeight: bigint;
        totalPrice: bigint;
        status: bigint;
        createdAt: bigint;
        disputed: boolean;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "deliveryCount"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "disputeDelivery"
  ): TypedContractMethod<[deliveryId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "getDelivery"
  ): TypedContractMethod<
    [deliveryId: BigNumberish],
    [CarryChainMarketplace.DeliveryStructOutput],
    "view"
  >;
  getFunction(
    nameOrSignature: "getReputationScore"
  ): TypedContractMethod<[user: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "getRoute"
  ): TypedContractMethod<
    [routeId: BigNumberish],
    [CarryChainMarketplace.TravelRouteStructOutput],
    "view"
  >;
  getFunction(
    nameOrSignature: "markAsDelivered"
  ): TypedContractMethod<[deliveryId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "markAsPickedUp"
  ): TypedContractMethod<[deliveryId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "platformFeePercent"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "positiveReviews"
  ): TypedContractMethod<[arg0: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "renounceOwnership"
  ): TypedContractMethod<[], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "resolveDispute"
  ): TypedContractMethod<
    [deliveryId: BigNumberish, favorTraveler: boolean],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "routeCount"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "routes"
  ): TypedContractMethod<
    [arg0: BigNumberish],
    [
      [
        bigint,
        string,
        string,
        string,
        bigint,
        bigint,
        bigint,
        bigint,
        boolean
      ] & {
        id: bigint;
        traveler: string;
        departureLocation: string;
        destinationLocation: string;
        departureTime: bigint;
        arrivalTime: bigint;
        availableSpace: bigint;
        pricePerKg: bigint;
        isActive: boolean;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "stablecoin"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "submitReview"
  ): TypedContractMethod<
    [reviewed: AddressLike, positive: boolean],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "totalReviews"
  ): TypedContractMethod<[arg0: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "transferOwnership"
  ): TypedContractMethod<[newOwner: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "updatePlatformFee"
  ): TypedContractMethod<[newFeePercent: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "updateRoute"
  ): TypedContractMethod<
    [
      routeId: BigNumberish,
      departureLocation: string,
      destinationLocation: string,
      departureTime: BigNumberish,
      arrivalTime: BigNumberish,
      availableSpace: BigNumberish,
      pricePerKg: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "updateStablecoin"
  ): TypedContractMethod<[newStablecoin: AddressLike], [void], "nonpayable">;

  getEvent(
    key: "DeliveryCreated"
  ): TypedContractEvent<
    DeliveryCreatedEvent.InputTuple,
    DeliveryCreatedEvent.OutputTuple,
    DeliveryCreatedEvent.OutputObject
  >;
  getEvent(
    key: "DeliveryDisputed"
  ): TypedContractEvent<
    DeliveryDisputedEvent.InputTuple,
    DeliveryDisputedEvent.OutputTuple,
    DeliveryDisputedEvent.OutputObject
  >;
  getEvent(
    key: "DeliveryResolved"
  ): TypedContractEvent<
    DeliveryResolvedEvent.InputTuple,
    DeliveryResolvedEvent.OutputTuple,
    DeliveryResolvedEvent.OutputObject
  >;
  getEvent(
    key: "DeliveryStatusChanged"
  ): TypedContractEvent<
    DeliveryStatusChangedEvent.InputTuple,
    DeliveryStatusChangedEvent.OutputTuple,
    DeliveryStatusChangedEvent.OutputObject
  >;
  getEvent(
    key: "OwnershipTransferred"
  ): TypedContractEvent<
    OwnershipTransferredEvent.InputTuple,
    OwnershipTransferredEvent.OutputTuple,
    OwnershipTransferredEvent.OutputObject
  >;
  getEvent(
    key: "ReviewSubmitted"
  ): TypedContractEvent<
    ReviewSubmittedEvent.InputTuple,
    ReviewSubmittedEvent.OutputTuple,
    ReviewSubmittedEvent.OutputObject
  >;
  getEvent(
    key: "RouteCreated"
  ): TypedContractEvent<
    RouteCreatedEvent.InputTuple,
    RouteCreatedEvent.OutputTuple,
    RouteCreatedEvent.OutputObject
  >;
  getEvent(
    key: "RouteDeactivated"
  ): TypedContractEvent<
    RouteDeactivatedEvent.InputTuple,
    RouteDeactivatedEvent.OutputTuple,
    RouteDeactivatedEvent.OutputObject
  >;
  getEvent(
    key: "RouteUpdated"
  ): TypedContractEvent<
    RouteUpdatedEvent.InputTuple,
    RouteUpdatedEvent.OutputTuple,
    RouteUpdatedEvent.OutputObject
  >;

  filters: {
    "DeliveryCreated(uint256,uint256,address)": TypedContractEvent<
      DeliveryCreatedEvent.InputTuple,
      DeliveryCreatedEvent.OutputTuple,
      DeliveryCreatedEvent.OutputObject
    >;
    DeliveryCreated: TypedContractEvent<
      DeliveryCreatedEvent.InputTuple,
      DeliveryCreatedEvent.OutputTuple,
      DeliveryCreatedEvent.OutputObject
    >;

    "DeliveryDisputed(uint256)": TypedContractEvent<
      DeliveryDisputedEvent.InputTuple,
      DeliveryDisputedEvent.OutputTuple,
      DeliveryDisputedEvent.OutputObject
    >;
    DeliveryDisputed: TypedContractEvent<
      DeliveryDisputedEvent.InputTuple,
      DeliveryDisputedEvent.OutputTuple,
      DeliveryDisputedEvent.OutputObject
    >;

    "DeliveryResolved(uint256,bool)": TypedContractEvent<
      DeliveryResolvedEvent.InputTuple,
      DeliveryResolvedEvent.OutputTuple,
      DeliveryResolvedEvent.OutputObject
    >;
    DeliveryResolved: TypedContractEvent<
      DeliveryResolvedEvent.InputTuple,
      DeliveryResolvedEvent.OutputTuple,
      DeliveryResolvedEvent.OutputObject
    >;

    "DeliveryStatusChanged(uint256,uint8)": TypedContractEvent<
      DeliveryStatusChangedEvent.InputTuple,
      DeliveryStatusChangedEvent.OutputTuple,
      DeliveryStatusChangedEvent.OutputObject
    >;
    DeliveryStatusChanged: TypedContractEvent<
      DeliveryStatusChangedEvent.InputTuple,
      DeliveryStatusChangedEvent.OutputTuple,
      DeliveryStatusChangedEvent.OutputObject
    >;

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

    "ReviewSubmitted(address,address,bool)": TypedContractEvent<
      ReviewSubmittedEvent.InputTuple,
      ReviewSubmittedEvent.OutputTuple,
      ReviewSubmittedEvent.OutputObject
    >;
    ReviewSubmitted: TypedContractEvent<
      ReviewSubmittedEvent.InputTuple,
      ReviewSubmittedEvent.OutputTuple,
      ReviewSubmittedEvent.OutputObject
    >;

    "RouteCreated(uint256,address)": TypedContractEvent<
      RouteCreatedEvent.InputTuple,
      RouteCreatedEvent.OutputTuple,
      RouteCreatedEvent.OutputObject
    >;
    RouteCreated: TypedContractEvent<
      RouteCreatedEvent.InputTuple,
      RouteCreatedEvent.OutputTuple,
      RouteCreatedEvent.OutputObject
    >;

    "RouteDeactivated(uint256)": TypedContractEvent<
      RouteDeactivatedEvent.InputTuple,
      RouteDeactivatedEvent.OutputTuple,
      RouteDeactivatedEvent.OutputObject
    >;
    RouteDeactivated: TypedContractEvent<
      RouteDeactivatedEvent.InputTuple,
      RouteDeactivatedEvent.OutputTuple,
      RouteDeactivatedEvent.OutputObject
    >;

    "RouteUpdated(uint256)": TypedContractEvent<
      RouteUpdatedEvent.InputTuple,
      RouteUpdatedEvent.OutputTuple,
      RouteUpdatedEvent.OutputObject
    >;
    RouteUpdated: TypedContractEvent<
      RouteUpdatedEvent.InputTuple,
      RouteUpdatedEvent.OutputTuple,
      RouteUpdatedEvent.OutputObject
    >;
  };
}
