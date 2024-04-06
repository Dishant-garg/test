import { MediaRenderer, useAddress, useClaimConditions, useContract } from "@thirdweb-dev/react";
import { NFT, toEther } from "@thirdweb-dev/sdk";
import { BUSINESSES_CONTRACT_ADDRESS, STAKING_CONTRACT_ADDRESS } from "../constants/contracts";
import { useState } from "react";

// Props for the NFTCard component
// NFT to display in shop
type Props = {
    nft: NFT;
};

export default function NFTCard({ nft }: Props) {
    // Get the user's address
    // Pass the address to the handle claim function to set approval for the staking contract
    const address = useAddress();

    // Get the businesses contract instance
    // Get the claim conditions for the NFT for cost data
    const { contract: businessesContract } = useContract(BUSINESSES_CONTRACT_ADDRESS, "edition-drop");
    const { data: claimCondition } = useClaimConditions(businessesContract, nft.metadata.id);

    // Get the staking contract instance
    const { contract: stakingContract } = useContract(STAKING_CONTRACT_ADDRESS);

    // Function to calculate the earnings per hour for each business NFT
    const calculateEarnings = (cost: number) => {
        return cost * 0.1;
    };

    // State for the claim state
    const [claimState, setClaimState] = useState<
    "init" | "nftClaim" | "staking">("init");

    // Function to handle the claim of the NFT
    // Claims business NFT and stakes it for the user
    const handleClaim = async () => {
        if(!address){
            return;
        }

        setClaimState("nftClaim");
        try {
            await businessesContract?.erc1155.claim(nft.metadata.id, 1);
            console.log("NFT claimed");

            setClaimState("staking");
            const isAproved = await businessesContract?.isApproved(
                address,
                STAKING_CONTRACT_ADDRESS
            );
            if(!isAproved) {
                await businessesContract?.setApprovalForAll(STAKING_CONTRACT_ADDRESS, true);
            }
            await stakingContract?.call(
                "stake",
                [nft.metadata.id, 1]
            );
        } catch (error) {
            console.error(error);
        } finally {
            setClaimState("init");
        }
    };
    
    return (
        <div className="bg-[#221d34] shadow-2xl shadow-[#221d34] rounded-xl">
            <MediaRenderer className=" p-4 rounded-sm"
                src={nft.metadata.image}
            />
            <div className="p-4">
                <h3>{nft.metadata.name}</h3>
                {claimCondition && claimCondition.length > 0 && (
                    claimCondition.map((condition, index) => (
                        <div key={index} className="py-2">
                            <p>Cost: {toEther(condition.price)} {condition.currencyMetadata.symbol}</p>
                            <p>Earns: {calculateEarnings(parseInt(toEther(condition.price)))} {condition.currencyMetadata.symbol}/Weekly</p>
                        </div>
                    ))
                )}
            </div>
            <button
                className="text-center w-full py-4 bg-[#44285e] rounded-b-xl text-white hover:bg-[#321c47]"
                onClick={handleClaim}
                disabled={claimState !== "init"}
            >{
            claimState === "nftClaim" ? "Purchasing business..." : claimState === "staking" ? "Staking business...": "Buy Now"
            }</button>
        </div>
    );
}