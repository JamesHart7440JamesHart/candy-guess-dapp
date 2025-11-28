/**
 * Script to create a new game round with an encrypted secret number
 *
 * Usage: npx hardhat run scripts/create-round.cjs --network sepolia
 *
 * Environment variables:
 * - SECRET_NUMBER: The secret number (1-100) for this round (default: random)
 * - ROUND_DURATION: Duration in seconds (default: 300 = 5 minutes)
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // Get contract address from deployment.json
  const deploymentPath = path.join(__dirname, "../deployment.json");
  let contractAddress;

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
  const GuessNumberGame = await hre.ethers.getContractFactory("GuessNumberGame");
  const game = GuessNumberGame.attach(contractAddress);

  // Use relayer-sdk for encryption (compatible with Node.js)
  const { RelayerSDK } = await import("@zama-fhe/relayer-sdk");

  console.log("🔐 Initializing FHE encryption with Relayer SDK...");

  const networkUrl = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

  // Initialize RelayerSDK
  const sdk = new RelayerSDK({
    provider: networkUrl,
    chainId: 11155111,
  });

  // Generate encrypted input
  console.log("🔒 Encrypting secret number...");
  const encryptedData = await sdk.createEncryptedInput(contractAddress, deployer.address)
    .add16(secretNumber)
    .encrypt();

  const handle = encryptedData.handles[0];
  const proof = encryptedData.inputProof;

  console.log("📝 Encrypted secret handle:", handle);

  // Entry fee: 0.001 ETH
  const entryFee = hre.ethers.parseEther("0.001");

  console.log("💰 Sending transaction with entry fee:", hre.ethers.formatEther(entryFee), "ETH");

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
  const roundCreatedEvent = logs.find((log) => {
    try {
      const parsed = game.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });
      return parsed?.name === "RoundCreated";
    } catch {
      return false;
    }
  });

  if (roundCreatedEvent) {
    const parsed = game.interface.parseLog({
      topics: roundCreatedEvent.topics,
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
