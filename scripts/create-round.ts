/**
 * Script to create a new game round with an encrypted secret number
 *
 * Usage: npx hardhat run scripts/create-round.ts --network sepolia
 *
 * Environment variables:
 * - SECRET_NUMBER: The secret number (1-100) for this round (default: random)
 * - ROUND_DURATION: Duration in seconds (default: 300 = 5 minutes)
 */

import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  // Get contract address from deployment.json
  const deploymentPath = "./deployment.json";
  const fs = require("fs");
  let contractAddress: string;

  try {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    contractAddress = deployment.contractAddress;
  } catch (error) {
    console.error("❌ Could not read deployment.json. Please deploy the contract first.");
    process.exit(1);
  }

  console.log("🎮 Creating new game round...");
  console.log(`📍 Contract: ${contractAddress}`);
  console.log(`👤 Owner: ${deployer.address}`);

  // Get or generate secret number
  const secretNumber = process.env.SECRET_NUMBER
    ? parseInt(process.env.SECRET_NUMBER)
    : Math.floor(Math.random() * 100) + 1;

  if (secretNumber < 1 || secretNumber > 100) {
    console.error("❌ Secret number must be between 1 and 100");
    process.exit(1);
  }

  // Get round duration (default: 5 minutes)
  const roundDuration = process.env.ROUND_DURATION
    ? parseInt(process.env.ROUND_DURATION)
    : 300;

  console.log(`🔢 Secret number: ${secretNumber}`);
  console.log(`⏱️  Duration: ${roundDuration} seconds (${Math.floor(roundDuration / 60)} minutes)`);

  // Connect to deployed contract
  const GuessNumberGame = await ethers.getContractFactory("GuessNumberGame");
  const game = GuessNumberGame.attach(contractAddress);

  // Initialize fhevmjs for encryption
  const { initFhevm, createFhevmInstance } = require("fhevmjs");
  const { FheOps } = require("@fhevm/solidity");

  console.log("🔐 Initializing FHE encryption...");
  await initFhevm();

  // Create FHE instance
  const instance = await createFhevmInstance({
    networkUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    gatewayUrl: "https://gateway.sepolia.zama.ai",
  });

  // Generate input for encrypted secret number
  const input = instance.createEncryptedInput(contractAddress, deployer.address);
  input.add16(secretNumber);
  const encryptedSecret = input.encrypt();

  const handle = encryptedSecret.handles[0];
  const proof = encryptedSecret.inputProof;

  console.log("📝 Encrypted secret handle:", handle);

  // Entry fee: 0.001 ETH
  const entryFee = ethers.parseEther("0.001");

  console.log("💰 Sending transaction with entry fee:", ethers.formatEther(entryFee), "ETH");

  // Create the round
  const tx = await game.createRound(
    handle,
    proof,
    roundDuration,
    { value: entryFee }
  );

  console.log("⏳ Transaction sent:", tx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await tx.wait();

  if (!receipt) {
    console.error("❌ Transaction failed");
    process.exit(1);
  }

  console.log("✅ Transaction confirmed!");
  console.log(`📦 Block: ${receipt.blockNumber}`);
  console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

  // Parse the RoundCreated event to get the round ID
  const logs = receipt.logs;
  const roundCreatedEvent = logs.find((log: any) => {
    try {
      const parsed = game.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      return parsed?.name === "RoundCreated";
    } catch {
      return false;
    }
  });

  if (roundCreatedEvent) {
    const parsed = game.interface.parseLog({
      topics: roundCreatedEvent.topics as string[],
      data: roundCreatedEvent.data,
    });
    const roundId = parsed?.args[0];
    console.log(`\n🎲 Round Created: #${roundId}`);
    console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);

    // Get round info to verify
    const currentRoundId = await game.currentRoundId();
    console.log(`\n📊 Current round ID: ${currentRoundId}`);
  }

  console.log("\n✨ Game round created successfully!");
  console.log(`🎯 Players can now guess the secret number (1-100)`);
  console.log(`⏰ Round will end in ${Math.floor(roundDuration / 60)} minutes`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
