// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CarryChainMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct TravelRoute {
        uint256 id;
        address traveler;
        string departureLocation;
        string destinationLocation;
        uint256 departureTime;
        uint256 arrivalTime;
        uint256 availableSpace;
        uint256 pricePerKg;
        bool isActive;
    }

    struct Delivery {
        uint256 id;
        uint256 routeId;
        address traveler;
        address shipper;
        string packageDescription;
        uint256 packageWeight;
        uint256 totalPrice;
        DeliveryStatus status;
        uint256 createdAt;
        bool disputed;
    }

    enum DeliveryStatus {
        Created,
        Accepted,
        PickedUp,
        Delivered,
        Completed,
        Cancelled,
        Disputed
    }

    IERC20 public stablecoin;
    uint256 public platformFeePercent = 5;
    uint256 private constant PERCENT_DENOMINATOR = 100;

    uint256 private routeIdCounter = 1;
    uint256 private deliveryIdCounter = 1;

    mapping(uint256 => TravelRoute) public routes;
    mapping(uint256 => Delivery) public deliveries;
    mapping(address => uint256) public positiveReviews;
    mapping(address => uint256) public totalReviews;

    event RouteCreated(uint256 indexed routeId, address indexed traveler);
    event RouteUpdated(uint256 indexed routeId);
    event RouteDeactivated(uint256 indexed routeId);
    event DeliveryCreated(uint256 indexed deliveryId, uint256 indexed routeId, address indexed shipper);
    event DeliveryStatusChanged(uint256 indexed deliveryId, DeliveryStatus status);
    event DeliveryDisputed(uint256 indexed deliveryId);
    event DeliveryResolved(uint256 indexed deliveryId, bool favorTraveler);
    event ReviewSubmitted(address indexed reviewer, address indexed reviewed, bool positive);

    constructor(address _stablecoin) {
        stablecoin = IERC20(_stablecoin);
    }

    // New view functions
    function routeCount() external view returns (uint256) {
        return routeIdCounter - 1; // Subtract 1 since counter starts at 1 and increments before use
    }

    function deliveryCount() external view returns (uint256) {
        return deliveryIdCounter - 1; // Subtract 1 since counter starts at 1 and increments before use
    }

    function createRoute(
        string calldata departureLocation,
        string calldata destinationLocation,
        uint256 departureTime,
        uint256 arrivalTime,
        uint256 availableSpace,
        uint256 pricePerKg
    ) external returns (uint256) {
        require(departureTime > block.timestamp, "Departure time must be in the future");
        require(arrivalTime > departureTime, "Arrival time must be after departure time");
        require(availableSpace > 0, "Available space must be greater than 0");
        require(pricePerKg > 0, "Price per kg must be greater than 0");

        uint256 routeId = routeIdCounter++;
        
        routes[routeId] = TravelRoute({
            id: routeId,
            traveler: msg.sender,
            departureLocation: departureLocation,
            destinationLocation: destinationLocation,
            departureTime: departureTime,
            arrivalTime: arrivalTime,
            availableSpace: availableSpace,
            pricePerKg: pricePerKg,
            isActive: true
        });
        
        emit RouteCreated(routeId, msg.sender);
        return routeId;
    }

    function updateRoute(
        uint256 routeId,
        string calldata departureLocation,
        string calldata destinationLocation,
        uint256 departureTime,
        uint256 arrivalTime,
        uint256 availableSpace,
        uint256 pricePerKg
    ) external {
        TravelRoute storage route = routes[routeId];
        require(route.traveler == msg.sender, "Not the route owner");
        require(route.isActive, "Route is not active");
        require(route.departureTime > block.timestamp, "Route has already started");
        require(departureTime > block.timestamp, "Departure time must be in the future");
        require(arrivalTime > departureTime, "Arrival time must be after departure time");
        require(availableSpace > 0, "Available space must be greater than 0");
        require(pricePerKg > 0, "Price per kg must be greater than 0");

        route.departureLocation = departureLocation;
        route.destinationLocation = destinationLocation;
        route.departureTime = departureTime;
        route.arrivalTime = arrivalTime;
        route.availableSpace = availableSpace;
        route.pricePerKg = pricePerKg;
        emit RouteUpdated(routeId);
    }

    function deactivateRoute(uint256 routeId) external {
        TravelRoute storage route = routes[routeId];
        require(route.traveler == msg.sender, "Not the route owner");
        require(route.isActive, "Route already inactive");
        route.isActive = false;
        emit RouteDeactivated(routeId);
    }

    function createDelivery(
        uint256 routeId,
        string calldata packageDescription,
        uint256 packageWeight
    ) external nonReentrant returns (uint256) {
        TravelRoute storage route = routes[routeId];
        require(route.isActive, "Route is not active");
        require(route.departureTime > block.timestamp, "Route has already started");
        require(packageWeight > 0, "Package weight must be greater than 0");
        require(packageWeight <= route.availableSpace, "Not enough space available");

        uint256 basePrice = (packageWeight * route.pricePerKg) / 1000;
        uint256 platformFee = (basePrice * platformFeePercent) / PERCENT_DENOMINATOR;
        uint256 totalPrice = basePrice + platformFee;

        stablecoin.safeTransferFrom(msg.sender, address(this), totalPrice);

        uint256 deliveryId = deliveryIdCounter++;
        deliveries[deliveryId] = Delivery({
            id: deliveryId,
            routeId: routeId,
            traveler: route.traveler,
            shipper: msg.sender,
            packageDescription: packageDescription,
            packageWeight: packageWeight,
            totalPrice: totalPrice,
            status: DeliveryStatus.Created,
            createdAt: block.timestamp,
            disputed: false
        });

        route.availableSpace -= packageWeight;
        emit DeliveryCreated(deliveryId, routeId, msg.sender);
        return deliveryId;
    }

    function acceptDelivery(uint256 deliveryId) external {
        Delivery storage delivery = deliveries[deliveryId];
        require(delivery.traveler == msg.sender, "Not the traveler");
        require(delivery.status == DeliveryStatus.Created, "Invalid status");
        delivery.status = DeliveryStatus.Accepted;
        emit DeliveryStatusChanged(deliveryId, DeliveryStatus.Accepted);
    }

    function markAsPickedUp(uint256 deliveryId) external {
        Delivery storage delivery = deliveries[deliveryId];
        require(delivery.traveler == msg.sender, "Not the traveler");
        require(delivery.status == DeliveryStatus.Accepted, "Invalid status");
        delivery.status = DeliveryStatus.PickedUp;
        emit DeliveryStatusChanged(deliveryId, DeliveryStatus.PickedUp);
    }

    function markAsDelivered(uint256 deliveryId) external {
        Delivery storage delivery = deliveries[deliveryId];
        require(delivery.traveler == msg.sender, "Not the traveler");
        require(delivery.status == DeliveryStatus.PickedUp, "Invalid status");
        delivery.status = DeliveryStatus.Delivered;
        emit DeliveryStatusChanged(deliveryId, DeliveryStatus.Delivered);
    }

    function confirmDelivery(uint256 deliveryId) external nonReentrant {
        Delivery storage delivery = deliveries[deliveryId];
        require(delivery.shipper == msg.sender, "Not the shipper");
        require(delivery.status == DeliveryStatus.Delivered, "Invalid status");
        delivery.status = DeliveryStatus.Completed;

        uint256 platformFee = (delivery.totalPrice * platformFeePercent) / PERCENT_DENOMINATOR;
        uint256 travelerPayment = delivery.totalPrice - platformFee;

        stablecoin.safeTransfer(delivery.traveler, travelerPayment);
        stablecoin.safeTransfer(owner(), platformFee);
        emit DeliveryStatusChanged(deliveryId, DeliveryStatus.Completed);
    }

    function disputeDelivery(uint256 deliveryId) external {
        Delivery storage delivery = deliveries[deliveryId];
        require(delivery.shipper == msg.sender || delivery.traveler == msg.sender, "Not involved in delivery");
        require(
            delivery.status == DeliveryStatus.Accepted ||
            delivery.status == DeliveryStatus.PickedUp ||
            delivery.status == DeliveryStatus.Delivered,
            "Cannot dispute in current status"
        );
        require(!delivery.disputed, "Already disputed");
        delivery.disputed = true;
        delivery.status = DeliveryStatus.Disputed;
        emit DeliveryDisputed(deliveryId);
        emit DeliveryStatusChanged(deliveryId, DeliveryStatus.Disputed);
    }

    function resolveDispute(uint256 deliveryId, bool favorTraveler) external onlyOwner nonReentrant {
        Delivery storage delivery = deliveries[deliveryId];
        require(delivery.status == DeliveryStatus.Disputed, "Not disputed");

        if (favorTraveler) {
            uint256 platformFee = (delivery.totalPrice * platformFeePercent) / PERCENT_DENOMINATOR;
            uint256 travelerPayment = delivery.totalPrice - platformFee;
            stablecoin.safeTransfer(delivery.traveler, travelerPayment);
            stablecoin.safeTransfer(owner(), platformFee);
            delivery.status = DeliveryStatus.Completed;
        } else {
            stablecoin.safeTransfer(delivery.shipper, delivery.totalPrice);
            delivery.status = DeliveryStatus.Cancelled;
        }

        delivery.disputed = false;
        emit DeliveryResolved(deliveryId, favorTraveler);
        emit DeliveryStatusChanged(deliveryId, delivery.status);
    }

    function submitReview(address reviewed, bool positive) external {
        require(reviewed != msg.sender, "Cannot review yourself");

        bool isValidReview = false;
        for (uint256 i = 1; i < deliveryIdCounter; i++) {
            Delivery storage delivery = deliveries[i];
            if (delivery.status == DeliveryStatus.Completed) {
                if ((delivery.traveler == msg.sender && delivery.shipper == reviewed) ||
                    (delivery.shipper == msg.sender && delivery.traveler == reviewed)) {
                    isValidReview = true;
                    break;
                }
            }
        }

        require(isValidReview, "No completed deliveries with this user");
        totalReviews[reviewed]++;
        if (positive) {
            positiveReviews[reviewed]++;
        }
        emit ReviewSubmitted(msg.sender, reviewed, positive);
    }

    function getReputationScore(address user) external view returns (uint256) {
        if (totalReviews[user] == 0) {
            return 0;
        }
        return (positiveReviews[user] * 100) / totalReviews[user];
    }

    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 20, "Fee too high");
        platformFeePercent = newFeePercent;
    }

    function updateStablecoin(address newStablecoin) external onlyOwner {
        require(newStablecoin != address(0), "Invalid address");
        stablecoin = IERC20(newStablecoin);
    }

    function getRoute(uint256 routeId) external view returns (TravelRoute memory) {
        return routes[routeId];
    }

    function getDelivery(uint256 deliveryId) external view returns (Delivery memory) {
        return deliveries[deliveryId];
    }
}