import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { useWeb3 } from './Web3Context';
import { ethers } from 'ethers';
import { AppDataContextType, AppState, TravelRoute, Delivery, Verification, UserProfile, DeliveryStatus } from '../types';
import { uploadToPinata } from '../utils/pinata';

// Import from local abis directory
import CarryChainMarketplaceABI from '../abis/CarryChainMarketplace.json';
import DeliveryVerificationABI from '../abis/DeliveryVerification.json';
import StablecoinAdapterABI from '../abis/StablecoinAdapter.json';
import ERC20ABI from '../abis/ERC20.json';

// Contract addresses - updated to new deployments
const MARKETPLACE_ADDRESS = process.env.REACT_APP_MARKETPLACE_ADDRESS || '0x001AaBE36BBA3C25796bB9B19AE21950a4e6B87E';
const VERIFICATION_ADDRESS = process.env.REACT_APP_VERIFICATION_ADDRESS || '0xF6F02d9b305e5353B461223bBFe1FcD1A888DD37';
const STABLECOIN_ADAPTER_ADDRESS = process.env.REACT_APP_STABLECOIN_ADAPTER_ADDRESS || '0x9AbdC4C1d94BD0a581E22Ca9e05f9DcC74Ca6d2e';
// Updated USDC contract address for Base Sepolia testnet
const USDC_ADDRESS = process.env.REACT_APP_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7c';

// Create the context
const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Provider component
const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { provider, signer, account } = useWeb3();

  const [state, setState] = useState<AppState>({
    routes: [],
    myRoutes: [],
    deliveries: [],
    myDeliveries: {
      asShipper: [],
      asTraveler: [],
    },
    verifications: {},
    userProfiles: {},
    loadingProgress: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  // Contract initialization
  const getMarketplaceContract = useCallback((withSigner = false) => {
    if (!provider) throw new Error("Provider not available");
    if (!MARKETPLACE_ADDRESS) throw new Error("Marketplace contract address not configured");
    
    console.log("Initializing marketplace contract with:", {
      address: MARKETPLACE_ADDRESS,
      withSigner,
      provider: provider.constructor.name,
      signer: signer ? signer.constructor.name : 'none'
    });

    // Verify the contract address is valid
    if (!ethers.utils.isAddress(MARKETPLACE_ADDRESS)) {
      throw new Error(`Invalid marketplace contract address: ${MARKETPLACE_ADDRESS}`);
    }

    // Verify we have the ABI
    if (!CarryChainMarketplaceABI || !CarryChainMarketplaceABI.abi) {
      throw new Error("Marketplace ABI not found");
    }

    const contract = new ethers.Contract(
      MARKETPLACE_ADDRESS,
      CarryChainMarketplaceABI.abi,
      withSigner && signer ? signer : provider
    );

    // Verify the contract has the required functions
    if (!contract.deliveryCount || !contract.deliveries) {
      throw new Error("Marketplace contract missing required functions");
    }

    return contract;
  }, [provider, signer]);

  const getVerificationContract = useCallback((withSigner = false) => {
    if (!provider) throw new Error("Provider not available");
    if (!VERIFICATION_ADDRESS) throw new Error("Verification contract address not configured");
    return new ethers.Contract(
      VERIFICATION_ADDRESS,
      DeliveryVerificationABI.abi,
      withSigner && signer ? signer : provider
    );
  }, [provider, signer]);

  const getStablecoinAdapterContract = useCallback((withSigner = false) => {
    if (!provider) throw new Error("Provider not available");
    if (!STABLECOIN_ADAPTER_ADDRESS) throw new Error("Stablecoin adapter contract address not configured");
    return new ethers.Contract(
      STABLECOIN_ADAPTER_ADDRESS,
      StablecoinAdapterABI.abi,
      withSigner && signer ? signer : provider
    );
  }, [provider, signer]);

  const getUSDCContract = useCallback((withSigner = false) => {
    if (!provider) throw new Error("Provider not available");
    if (!USDC_ADDRESS) throw new Error("USDC contract address not configured");
    return new ethers.Contract(
      USDC_ADDRESS,
      ERC20ABI.abi,
      withSigner && signer ? signer : provider
    );
  }, [provider, signer]);

  // Load all routes
  const loadRoutes = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log("loadRoutes: Already loading, skipping");
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      if (!provider) {
        console.error("Provider not available");
        setError("Wallet provider not available. Please connect your wallet or refresh the page.");
        return;
      }

      const marketplace = getMarketplaceContract();
      console.log("Fetching routes from contract:", marketplace.address);

      let routeCount: number = 0;
      try {
        routeCount = await marketplace.routeCount().then((count: ethers.BigNumber) => count.toNumber());
        console.log("Route count fetched:", routeCount);
      } catch (error) {
        console.error("Error fetching route count:", error);
        console.warn("Falling back to hardcoded limit of 10 routes.");
        routeCount = 10;
      }

      if (!routeCount) {
        console.warn("No routes available (routeCount is 0)");
        setState(prev => ({ ...prev, routes: [], myRoutes: [], loadingProgress: null }));
        return;
      }

      console.log(`Total routes to check: ${routeCount}`);
      const batchSize = 5;
      const batches = Math.ceil(routeCount / batchSize);
      const routes: TravelRoute[] = [];

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const startId = batchIndex * batchSize + 1;
        const endId = Math.min((batchIndex + 1) * batchSize, routeCount);
        console.log(`Processing batch ${batchIndex + 1}/${batches}: IDs ${startId}-${endId}`);

        const batchPromises = [];
        for (let i = startId; i <= endId; i++) {
          batchPromises.push(
            (async (id) => {
              try {
                const route = await marketplace.routes(id);
                if (route.traveler !== ethers.constants.AddressZero) {
                  console.log(`Route ${id} found: ${route.departureLocation} to ${route.destinationLocation}`);
                  return {
                    id,
                    traveler: route.traveler,
                    departureLocation: route.departureLocation,
                    destinationLocation: route.destinationLocation,
                    departureTime: route.departureTime.toNumber(),
                    arrivalTime: route.arrivalTime.toNumber(),
                    availableSpace: route.availableSpace.toNumber(),
                    pricePerKg: route.pricePerKg.toString(),
                    isActive: route.isActive,
                  };
                }
                console.log(`Route ID ${id} does not exist`);
                return null;
              } catch (routeError) {
                console.error(`Error fetching route ID ${id}:`, routeError);
                return null;
              }
            })(i)
          );
        }

        const batchResultsPromise = Promise.all(batchPromises);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Batch timeout")), 10000)
        );

        try {
          const batchResults = await Promise.race([batchResultsPromise, timeoutPromise]) as (TravelRoute | null)[];
          routes.push(...batchResults.filter(route => route !== null) as TravelRoute[]);
          setState(prev => ({
            ...prev,
            loadingProgress: {
              current: batchIndex + 1,
              total: batches,
              routesFound: routes.length,
            },
          }));
        } catch (error) {
          console.error(`Batch ${batchIndex + 1} timed out or failed:`, error);
          continue;
        }
      }

      const myRoutes = account ? routes.filter(route => route.traveler.toLowerCase() === account.toLowerCase()) : [];
      console.log(`Successfully loaded ${routes.length} routes, ${myRoutes.length} myRoutes`);
      setState(prev => ({
        ...prev,
        routes,
        myRoutes,
        loadingProgress: null,
      }));
    } catch (error: any) {
      console.error("Error loading routes:", error);
      setError(`Failed to load routes: ${error.message || "Unknown error"}`);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [provider, account, getMarketplaceContract]);

  // Load my routes
  const loadMyRoutes = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log("loadMyRoutes: Already loading, skipping");
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      if (!account) {
        console.log("loadMyRoutes: No account connected");
        setState(prev => ({ ...prev, myRoutes: [] }));
        return;
      }

      if (state.routes.length === 0) {
        console.log("loadMyRoutes: No routes in state, calling loadRoutes");
        await loadRoutes();
      }

      const myRoutes = state.routes.filter(route =>
        route.traveler.toLowerCase() === account.toLowerCase()
      );
      console.log(`Loaded ${myRoutes.length} routes for account ${account}`);
      setState(prev => ({ ...prev, myRoutes }));
    } catch (error) {
      console.error("Error loading my routes:", error);
      setError("Failed to load your routes");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [account, state.routes, loadRoutes]);

  // Load all deliveries
  const loadDeliveries = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log("loadDeliveries: Already loading, skipping");
      return;
    }

    try {
      isLoadingRef.current = true;
      console.log("Starting to load deliveries...");
      const marketplace = getMarketplaceContract();
      console.log("Marketplace contract initialized at:", marketplace.address);

      let deliveryCount: number = 0;
      try {
        console.log("Fetching delivery count...");
        const count = await marketplace.deliveryCount();
        deliveryCount = count.toNumber();
        console.log("Delivery count fetched:", deliveryCount);
      } catch (error) {
        console.error("Error fetching delivery count:", error);
        return;
      }

      if (!deliveryCount) {
        console.log("No deliveries available");
        setState(prev => ({ ...prev, deliveries: [], myDeliveries: { asShipper: [], asTraveler: [] } }));
        return;
      }

      const deliveries: Delivery[] = [];
      
      // Process deliveries in batches
      const batchSize = 5;
      const batches = Math.ceil(deliveryCount / batchSize);
      
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const startId = batchIndex * batchSize + 1;
        const endId = Math.min((batchIndex + 1) * batchSize, deliveryCount);
        console.log(`Processing batch ${batchIndex + 1}/${batches}: IDs ${startId}-${endId}`);

        const batchPromises = [];
        for (let i = startId; i <= endId; i++) {
          batchPromises.push(
            (async (id) => {
              try {
                const delivery = await marketplace.deliveries(id);
                if (delivery.shipper !== ethers.constants.AddressZero) {
                  return {
                    id,
                    routeId: delivery.routeId.toNumber(),
                    traveler: delivery.traveler,
                    shipper: delivery.shipper,
                    packageDescription: delivery.packageDescription,
                    packageWeight: delivery.packageWeight.toNumber(),
                    totalPrice: delivery.totalPrice.toString(),
                    status: delivery.status,
                    createdAt: delivery.createdAt.toNumber(),
                    disputed: delivery.disputed,
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error fetching delivery ID ${id}:`, error);
                return null;
              }
            })(i)
          );
        }

        try {
          const batchResults = await Promise.all(batchPromises);
          const validDeliveries = batchResults.filter(delivery => delivery !== null) as Delivery[];
          deliveries.push(...validDeliveries);
        } catch (error) {
          console.error(`Error processing batch ${batchIndex + 1}:`, error);
          continue;
        }
      }

      // Filter deliveries for the current user
      const myDeliveries = account ? {
        asShipper: deliveries.filter(delivery => 
          delivery.shipper.toLowerCase() === account.toLowerCase()
        ),
        asTraveler: deliveries.filter(delivery => 
          delivery.traveler.toLowerCase() === account.toLowerCase()
        ),
      } : { asShipper: [], asTraveler: [] };

      console.log(`Successfully loaded ${deliveries.length} deliveries`);
      setState(prev => ({
        ...prev,
        deliveries,
        myDeliveries,
      }));
    } catch (error: any) {
      console.error("Error loading deliveries:", error);
      setError(`Failed to load deliveries: ${error.message || "Unknown error"}`);
    } finally {
      isLoadingRef.current = false;
    }
  }, [account, getMarketplaceContract]);

  // Load my deliveries
  const loadMyDeliveries = useCallback(async () => {
    if (!account) {
      console.log("loadMyDeliveries: No account connected");
      setState(prev => ({ ...prev, myDeliveries: { asShipper: [], asTraveler: [] } }));
      return;
    }

    try {
      console.log(`loadMyDeliveries: Loading for account ${account}`);
      await loadDeliveries();
    } catch (error: any) {
      console.error("Error loading my deliveries:", error);
      setError(`Failed to load your deliveries: ${error.message || "Unknown error"}`);
    }
  }, [account, loadDeliveries]);

  // Load verification
  const loadVerification = useCallback(async (deliveryId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const verificationContract = getVerificationContract();
      const verificationData = await verificationContract.getVerification(deliveryId);
      console.log(`Verification for delivery ${deliveryId}:`, verificationData);

      const verification: Verification = {
        deliveryId: verificationData.deliveryId.toNumber(),
        pickupProofCID: verificationData.pickupProofCID,
        pickupTimestamp: verificationData.pickupTimestamp.toNumber(),
        deliveryProofCID: verificationData.deliveryProofCID,
        deliveryTimestamp: verificationData.deliveryTimestamp.toNumber(),
        isVerified: verificationData.isVerified,
        pickupProofURL: verificationData.pickupProofCID
          ? `https://gateway.pinata.cloud/ipfs/${verificationData.pickupProofCID}`
          : '',
        deliveryProofURL: verificationData.deliveryProofCID
          ? `https://gateway.pinata.cloud/ipfs/${verificationData.deliveryProofCID}`
          : '',
      };

      setState(prev => ({
        ...prev,
        verifications: {
          ...prev.verifications,
          [deliveryId]: verification,
        },
      }));

      return verification;
    } catch (error: any) {
      console.error(`Error loading verification for delivery ${deliveryId}:`, error);
      setError(`Failed to load verification: ${error.message || "Unknown error"}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getVerificationContract]);

  // Accept delivery
  const acceptDelivery = useCallback(async (deliveryId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!signer) {
        setError("Wallet not connected");
        return false;
      }

      const marketplace = getMarketplaceContract(true);
      console.log(`Accepting delivery ${deliveryId}...`);
      const tx = await marketplace.acceptDelivery(deliveryId, { gasLimit: 300000 });
      console.log(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log("Delivery accepted successfully!");

      await loadMyDeliveries();
      return true;
    } catch (error: any) {
      console.error("Error accepting delivery:", error);
      setError(`Failed to accept delivery: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signer, getMarketplaceContract, loadMyDeliveries]);

  // Confirm pickup
  const confirmPickup = useCallback(async (deliveryId: number, proofFile: File) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!signer) {
        setError("Wallet not connected");
        return false;
      }

      console.log(`Uploading pickup proof for delivery ${deliveryId}...`);
      const cid = await uploadToPinata(proofFile);
      if (!cid) {
        throw new Error("Failed to get CID from Pinata upload");
      }
      console.log(`Proof uploaded to IPFS with CID: ${cid}`);

      const verificationContract = getVerificationContract(true);
      const verifyTx = await verificationContract.recordPickup(deliveryId, cid, { gasLimit: 300000 });
      console.log(`Verification transaction sent: ${verifyTx.hash}`);
      await verifyTx.wait();
      console.log(`Pickup verification recorded successfully!`);

      const marketplace = getMarketplaceContract(true);
      const statusTx = await marketplace.markAsPickedUp(deliveryId, { gasLimit: 300000 });
      console.log(`Status update transaction sent: ${statusTx.hash}`);
      await statusTx.wait(); // Fixed: Changed 'tx' to 'statusTx'
      console.log("Package marked as picked up!");

      await loadMyDeliveries();
      await loadVerification(deliveryId);
      return true;
    } catch (error: any) {
      console.error("Error confirming pickup:", error);
      setError(`Failed to confirm pickup: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signer, getVerificationContract, getMarketplaceContract, uploadToPinata, loadMyDeliveries, loadVerification]);

  // Confirm delivery
  const confirmDelivery = useCallback(async (deliveryId: number, proofFile: File) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!signer) {
        setError("Wallet not connected");
        return false;
      }

      console.log(`Uploading delivery proof for delivery ${deliveryId}...`);
      const cid = await uploadToPinata(proofFile);
      if (!cid) {
        throw new Error("Failed to get CID from Pinata upload");
      }
      console.log(`Proof uploaded to IPFS with CID: ${cid}`);

      const verificationContract = getVerificationContract(true);
      const verifyTx = await verificationContract.recordDelivery(deliveryId, cid, { gasLimit: 300000 });
      console.log(`Verification transaction sent: ${verifyTx.hash}`);
      await verifyTx.wait();
      console.log(`Delivery verification recorded successfully!`);

      const marketplace = getMarketplaceContract(true);
      const statusTx = await marketplace.markAsDelivered(deliveryId, { gasLimit: 300000 });
      console.log(`Status update transaction sent: ${statusTx.hash}`);
      await statusTx.wait();
      console.log("Package marked as delivered!");

      await loadMyDeliveries();
      await loadVerification(deliveryId);
      return true;
    } catch (error: any) {
      console.error("Error confirming delivery:", error);
      setError(`Failed to confirm delivery: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signer, getVerificationContract, getMarketplaceContract, uploadToPinata, loadMyDeliveries, loadVerification]);

  // Complete delivery
  const completeDelivery = useCallback(async (deliveryId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!signer) {
        setError("Wallet not connected");
        return false;
      }

      const marketplace = getMarketplaceContract(true);
      console.log(`Confirming delivery receipt for delivery ${deliveryId}...`);
      const tx = await marketplace.confirmDelivery(deliveryId, { gasLimit: 300000 });
      console.log(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log("Delivery completed and payment released!");

      await loadMyDeliveries();
      return true;
    } catch (error: any) {
      console.error("Error completing delivery:", error);
      setError(`Failed to complete delivery: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signer, getMarketplaceContract, loadMyDeliveries]);

  // Load user profile
  const loadUserProfile = useCallback(async (address: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (state.userProfiles[address]) {
        console.log(`Profile for ${address} already loaded`);
        return;
      }

      const fallbackProfile: UserProfile = {
        address,
        positiveReviews: 0,
        totalReviews: 0,
        reputationScore: 0,
      };

      try {
        const marketplace = getMarketplaceContract();
        const positiveReviews = await marketplace.positiveReviews(address);
        const totalReviews = await marketplace.totalReviews(address);
        const reputationScore = await marketplace.getReputationScore(address);

        const profile: UserProfile = {
          address,
          positiveReviews: positiveReviews.toNumber(),
          totalReviews: totalReviews.toNumber(),
          reputationScore: reputationScore.toNumber(),
        };
        console.log(`Loaded profile for ${address}:`, profile);

        setState(prev => ({
          ...prev,
          userProfiles: {
            ...prev.userProfiles,
            [address]: profile,
          },
        }));
      } catch (contractError) {
        console.error("Contract error loading profile, using fallback:", contractError);
        setState(prev => ({
          ...prev,
          userProfiles: {
            ...prev.userProfiles,
            [address]: fallbackProfile,
          },
        }));
      }
    } catch (error: any) {
      console.error("Error loading user profile:", error);
      setError(`Failed to load user profile: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [getMarketplaceContract, state.userProfiles]);

  // Create route
  const createRoute = useCallback(async (
    departureLocation: string,
    destinationLocation: string,
    departureTime: number,
    arrivalTime: number,
    availableSpace: number,
    pricePerKg: number
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!account || !signer || !provider) {
        setError("Wallet not connected");
        return false;
      }

      const marketplace = getMarketplaceContract(true);
      const network = await provider.getNetwork();
      if (network.chainId !== 84532) {
        setError("Please switch to Base Sepolia (chain ID 84532) before creating a route.");
        return false;
      }

      console.log("Creating route with parameters:", {
        departureLocation,
        destinationLocation,
        departureTime,
        arrivalTime,
        availableSpace,
        pricePerKg,
      });

      const tx = await marketplace.createRoute(
        departureLocation,
        destinationLocation,
        departureTime,
        arrivalTime,
        availableSpace,
        pricePerKg,
        { gasLimit: 3000000 }
      );
      console.log("Transaction submitted:", tx.hash);
      await tx.wait();
      console.log("Route created successfully!");

      await loadRoutes();
      await loadMyRoutes();
      return true;
    } catch (error: any) {
      console.error("Error creating route:", error);
      setError(`Failed to create route: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, provider, signer, getMarketplaceContract, loadRoutes, loadMyRoutes]);

  // Create delivery
  const createDelivery = useCallback(async (
    routeId: number,
    packageDescription: string,
    packageWeight: number,
    totalCostInUSDC?: number
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!account || !signer || !provider) {
        setError("Wallet not connected");
        return false;
      }

      const marketplace = getMarketplaceContract(true);
      const usdc = getUSDCContract(true);

      const network = await provider.getNetwork();
      if (network.chainId !== 84532) {
        setError("Please switch to Base Sepolia (chain ID 84532) before creating a delivery.");
        return false;
      }

      const route = await marketplace.routes(routeId);
      if (!route || !route.isActive) {
        throw new Error("Route not found or inactive");
      }

      if (route.availableSpace.lt(packageWeight)) {
        throw new Error(`Insufficient space available. Route has ${route.availableSpace.toString()} grams, but requested ${packageWeight} grams.`);
      }

      const pricePerKg = route.pricePerKg;
      const weightInKgBigNumber = ethers.BigNumber.from(packageWeight).div(1000);
      const basePrice = pricePerKg.mul(weightInKgBigNumber);
      const platformFee = basePrice.mul(5).div(100);
      const totalPrice = totalCostInUSDC
        ? ethers.BigNumber.from(totalCostInUSDC)
        : basePrice.add(platformFee);

      const usdcBalance = await usdc.balanceOf(account);
      if (usdcBalance.lt(totalPrice)) {
        throw new Error(`Insufficient USDC balance. You have ${ethers.utils.formatUnits(usdcBalance, 6)} USDC, but need ${ethers.utils.formatUnits(totalPrice, 6)} USDC`);
      }

      const allowance = await usdc.allowance(account, marketplace.address);
      if (allowance.lt(totalPrice)) {
        console.log("Approving USDC spending...");
        const approveTx = await usdc.approve(marketplace.address, totalPrice, { gasLimit: 300000 });
        await approveTx.wait();
        console.log("USDC approval confirmed");
      }

      console.log("Creating delivery on blockchain with parameters:", { routeId, packageDescription, packageWeight });
      const createTx = await marketplace.createDelivery(routeId, packageDescription, packageWeight, { gasLimit: 500000 });
      console.log("Creation transaction sent:", createTx.hash);
      const receipt = await createTx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction reverted on-chain. The contract rejected the delivery creation.");
      }

      console.log("Delivery creation confirmed:", receipt.transactionHash);
      
      // Reload all deliveries and user-specific deliveries
      console.log("Reloading deliveries after successful creation...");
      await Promise.all([
        loadDeliveries(),
        loadMyDeliveries()
      ]);
      
      // Verify the new delivery was loaded
      const marketplaceRead = getMarketplaceContract(false);
      const deliveryCount = await marketplaceRead.deliveryCount();
      console.log("Current delivery count:", deliveryCount.toNumber());
      
      return true;
    } catch (error: any) {
      console.error("Error creating delivery:", error);
      setError(`Failed to create delivery: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, provider, signer, getMarketplaceContract, getUSDCContract, loadDeliveries, loadMyDeliveries]);

  // Update route status
  const updateRouteStatus = useCallback(async (routeId: number, isActive: boolean) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!account || !signer) {
        setError("Wallet not connected");
        return false;
      }

      const marketplace = getMarketplaceContract(true);
      let tx;
      if (!isActive) {
        console.log(`Deactivating route ${routeId}...`);
        tx = await marketplace.deactivateRoute(routeId, { gasLimit: 300000 });
      } else {
        console.warn("Route activation not implemented in contract");
        setError("Route activation not supported by the contract");
        return false;
      }

      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");

      await loadRoutes();
      await loadMyRoutes();
      return true;
    } catch (error: any) {
      console.error("Error updating route status:", error);
      setError(`Failed to update route status: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, signer, getMarketplaceContract, loadRoutes, loadMyRoutes]);

  // Update delivery status
  const updateDeliveryStatus = useCallback(async (deliveryId: number, newStatus: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!account || !signer) {
        setError("Wallet not connected");
        return false;
      }

      const marketplace = getMarketplaceContract(true);
      let tx;
      switch (newStatus) {
        case DeliveryStatus.Accepted:
          console.log(`Accepting delivery ${deliveryId}...`);
          tx = await marketplace.acceptDelivery(deliveryId, { gasLimit: 300000 });
          break;
        case DeliveryStatus.PickedUp:
          console.log(`Marking delivery ${deliveryId} as picked up...`);
          tx = await marketplace.markAsPickedUp(deliveryId, { gasLimit: 300000 });
          break;
        case DeliveryStatus.Delivered:
          console.log(`Marking delivery ${deliveryId} as delivered...`);
          tx = await marketplace.markAsDelivered(deliveryId, { gasLimit: 300000 });
          break;
        case DeliveryStatus.Completed:
          console.log(`Completing delivery ${deliveryId}...`);
          tx = await marketplace.confirmDelivery(deliveryId, { gasLimit: 300000 });
          break;
        case DeliveryStatus.Disputed:
          console.log(`Disputing delivery ${deliveryId}...`);
          tx = await marketplace.disputeDelivery(deliveryId, { gasLimit: 300000 });
          break;
        default:
          throw new Error("Invalid status");
      }

      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");

      await loadDeliveries();
      await loadMyDeliveries();
      return true;
    } catch (error: any) {
      console.error("Error updating delivery status:", error);
      setError(`Failed to update delivery status: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, signer, getMarketplaceContract, loadDeliveries, loadMyDeliveries]);

  // Record verification
  const recordVerification = useCallback(async (deliveryId: number, proofCID: string, isPickup: boolean) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!account || !signer) {
        setError("Wallet not connected");
        return false;
      }

      const verificationContract = getVerificationContract(true);
      const tx = isPickup
        ? await verificationContract.recordPickup(deliveryId, proofCID, { gasLimit: 300000 })
        : await verificationContract.recordDelivery(deliveryId, proofCID, { gasLimit: 300000 });

      console.log(`Verification transaction sent for delivery ${deliveryId}:`, tx.hash);
      await tx.wait();
      console.log("Verification transaction confirmed");

      await loadVerification(deliveryId);
      return true;
    } catch (error: any) {
      console.error("Error recording verification:", error);
      setError(`Failed to record verification: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, signer, getVerificationContract, loadVerification]);

  // Submit review
  const submitReview = useCallback(async (address: string, isPositive: boolean) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!account || !signer) {
        setError("Wallet not connected");
        return false;
      }

      const marketplace = getMarketplaceContract(true);
      console.log(`Submitting review for ${address}: ${isPositive ? 'Positive' : 'Negative'}`);
      const tx = await marketplace.submitReview(address, isPositive, { gasLimit: 300000 });
      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");

      await loadUserProfile(address);
      return true;
    } catch (error: any) {
      console.error("Error submitting review:", error);
      setError(`Failed to submit review: ${error.message || "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, signer, getMarketplaceContract, loadUserProfile]);

  // Separate effect for initial data loading
  useEffect(() => {
    if (!provider) return;
    
    const loadInitialData = async () => {
      try {
        await loadDeliveries();
        if (account) {
          await loadMyDeliveries();
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, [provider, account]);

  // Context value
  const contextValue = useMemo(
    () => ({
      state,
      loadRoutes,
      loadMyRoutes,
      loadDeliveries,
      loadMyDeliveries,
      acceptDelivery,
      loadVerification,
      loadUserProfile,
      createRoute,
      createDelivery,
      updateRouteStatus,
      updateDeliveryStatus,
      recordVerification,
      submitReview,
      confirmPickup,
      confirmDelivery,
      completeDelivery,
      isLoading,
      error,
      uploadProofToIPFS: uploadToPinata,
    }),
    [
      state,
      loadRoutes,
      loadMyRoutes,
      loadDeliveries,
      loadMyDeliveries,
      acceptDelivery,
      loadVerification,
      loadUserProfile,
      createRoute,
      createDelivery,
      updateRouteStatus,
      updateDeliveryStatus,
      recordVerification,
      submitReview,
      confirmPickup,
      confirmDelivery,
      completeDelivery,
      isLoading,
      error,
    ]
  );

  return <AppDataContext.Provider value={contextValue}>{children}</AppDataContext.Provider>;
};

// Custom hook for using the AppDataContext
export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
};

export default AppDataProvider;