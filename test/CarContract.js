const { expect } = require("chai");
const { ethers } = require("hardhat");

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CarContract contract", function () {
  let initialCarValue = ethers.utils.parseEther("2");
  async function deployCarContractFixture() {
    // Get the ContractFactory and Signers here.
    const CarContract = await ethers.getContractFactory("CarContract");
    const [manufacturer, owner1, owner2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    initialCarValue = ethers.utils.parseEther("2")
    const hardhatCarContract = await CarContract.deploy(initialCarValue, owner1.address);

    await hardhatCarContract.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { CarContract, hardhatCarContract, manufacturer, owner1, owner2 };
  }

  it("should allow the manufacturer to create the contract", async function () {
    const { hardhatCarContract, manufacturer, owner1 } = await loadFixture(deployCarContractFixture);
    expect(await hardhatCarContract.manufacturer()).to.equal(manufacturer.address);
    expect(await hardhatCarContract.currentOwner()).to.equal(owner1.address);
    expect(await hardhatCarContract.state()).to.equal(0);
    expect(await hardhatCarContract.carValue()).to.equal(initialCarValue);
  });

  it("should requestOwnershipTransfer", async function () {
    const { hardhatCarContract, owner2 } = await loadFixture(deployCarContractFixture);
    const carValue = ethers.utils.parseEther("2");
    await hardhatCarContract.requestOwnershipTransfer(owner2.address, carValue);
    expect(await hardhatCarContract.state()).to.equal(1); // RequestedSale
    expect(await hardhatCarContract.newOwner()).to.equal(owner2.address);
    expect(await hardhatCarContract.carValue()).to.equal(initialCarValue);
  });

  it("should allow the manufacturer to approve ownership transfer", async function () {
    const { hardhatCarContract, owner2 } = await loadFixture(deployCarContractFixture);
    const carValue = ethers.utils.parseEther("2");
    await hardhatCarContract.requestOwnershipTransfer(owner2.address, carValue);
    await hardhatCarContract.approveOwnershipTransfer();
    expect(await hardhatCarContract.state()).to.equal(2); // Approved
  });

  it("should allow the new owner to complete ownership transfer", async function () {
    const { hardhatCarContract, owner2, owner1 } = await loadFixture(deployCarContractFixture);
    const carValue = ethers.utils.parseEther("2");
    const owner1BalanceBefore = await owner1.getBalance();
    await hardhatCarContract.requestOwnershipTransfer(owner2.address, carValue);
    await hardhatCarContract.approveOwnershipTransfer();
    await hardhatCarContract.completeOwnershipTransfer({ value: carValue });
    expect(await hardhatCarContract.currentOwner()).to.equal(owner2.address);
    expect(await hardhatCarContract.newOwner()).to.equal("0x0000000000000000000000000000000000000000");
    const owner1BalanceAfter = await owner1.getBalance();
    expect(await hardhatCarContract.state()).to.equal(3); // Completed
    expect(owner1BalanceAfter).to.equal(owner1BalanceBefore.add(carValue));
  });

  it("should allow the manufacturer to cancel ownership transfer", async function () {
    const { hardhatCarContract, owner2, owner1 } = await loadFixture(deployCarContractFixture);
    const carValue = ethers.utils.parseEther("2");
    await hardhatCarContract.requestOwnershipTransfer(owner2.address, carValue);
    await hardhatCarContract.cancelOwnershipTransfer();
    expect(await hardhatCarContract.currentOwner()).to.equal(owner1.address);
    expect(await hardhatCarContract.newOwner()).to.equal("0x0000000000000000000000000000000000000000");
    expect(await hardhatCarContract.state()).to.equal(0); // Created
  });
});
