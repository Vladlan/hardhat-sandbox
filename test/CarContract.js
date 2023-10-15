const { expect } = require("chai");
const { ethers } = require("hardhat");

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CarOwnership contract", function () {
  let initialCarValue = ethers.utils.parseEther("2");
  async function deployCarOwnershipFixture() {
    // Get the ContractFactory and Signers here.
    const CarOwnership = await ethers.getContractFactory("CarOwnership");
    const [manufacturer, owner1, owner2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    initialCarValue = ethers.utils.parseEther("2")
    const hardhatCarOwnership = await CarOwnership.deploy(initialCarValue, owner1.address);

    await hardhatCarOwnership.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { CarOwnership, hardhatCarOwnership, manufacturer, owner1, owner2 };
  }

  it("should allow the manufacturer to create the contract", async function () {
    const { hardhatCarOwnership, manufacturer, owner1 } = await loadFixture(deployCarOwnershipFixture);
    expect(await hardhatCarOwnership.manufacturer()).to.equal(manufacturer.address);
    expect(await hardhatCarOwnership.currentOwner()).to.equal(owner1.address);
    expect(await hardhatCarOwnership.state()).to.equal(0);
    expect(await hardhatCarOwnership.carValue()).to.equal(initialCarValue);
  });

  it("should requestOwnershipTransfer", async function () {
    const { hardhatCarOwnership, owner2 } = await loadFixture(deployCarOwnershipFixture);
    const carValue = ethers.utils.parseEther("2");
    await hardhatCarOwnership.requestOwnershipTransfer(owner2.address, carValue);
    expect(await hardhatCarOwnership.state()).to.equal(1); // RequestedSale
    expect(await hardhatCarOwnership.newOwner()).to.equal(owner2.address);
    expect(await hardhatCarOwnership.carValue()).to.equal(initialCarValue);
  });

  it("should allow the manufacturer to approve ownership transfer", async function () {
    const { hardhatCarOwnership, owner2 } = await loadFixture(deployCarOwnershipFixture);
    const carValue = ethers.utils.parseEther("2");
    await hardhatCarOwnership.requestOwnershipTransfer(owner2.address, carValue);
    await hardhatCarOwnership.approveOwnershipTransfer();
    expect(await hardhatCarOwnership.state()).to.equal(2); // Approved
  });

  it("should allow the new owner to complete ownership transfer", async function () {
    const { hardhatCarOwnership, owner2, owner1 } = await loadFixture(deployCarOwnershipFixture);
    const carValue = ethers.utils.parseEther("2");
    const owner1BalanceBefore = await owner1.getBalance();
    await hardhatCarOwnership.requestOwnershipTransfer(owner2.address, carValue);
    await hardhatCarOwnership.approveOwnershipTransfer();
    await hardhatCarOwnership.completeOwnershipTransfer({ value: carValue });
    expect(await hardhatCarOwnership.currentOwner()).to.equal(owner2.address);
    expect(await hardhatCarOwnership.newOwner()).to.equal("0x0000000000000000000000000000000000000000");
    const owner1BalanceAfter = await owner1.getBalance();
    expect(await hardhatCarOwnership.state()).to.equal(3); // Completed
    expect(owner1BalanceAfter).to.equal(owner1BalanceBefore.add(carValue));
  });

  it("should allow the manufacturer to cancel ownership transfer", async function () {
    const { hardhatCarOwnership, owner2, owner1 } = await loadFixture(deployCarOwnershipFixture);
    const carValue = ethers.utils.parseEther("2");
    await hardhatCarOwnership.requestOwnershipTransfer(owner2.address, carValue);
    await hardhatCarOwnership.cancelOwnershipTransfer();
    expect(await hardhatCarOwnership.currentOwner()).to.equal(owner1.address);
    expect(await hardhatCarOwnership.newOwner()).to.equal("0x0000000000000000000000000000000000000000");
    expect(await hardhatCarOwnership.state()).to.equal(0); // Created
  });
});
