const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("RoleManager", function () {

  let roleManager, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("RoleManager");
    roleManager   = await Factory.deploy();
    await roleManager.waitForDeployment();
  });

  it("should register a participant with correct role", async function () {
    // Role.Manufacturer = 1
    await roleManager.registerParticipant(addr1.address, 1, "PharmaCo Ltd");
    const p = await roleManager.participants(addr1.address);
    expect(p.name).to.equal("PharmaCo Ltd");
    expect(p.active).to.be.true;
    expect(p.role).to.equal(1);
  });

  it("should return authorized true for correct role", async function () {
    await roleManager.registerParticipant(addr1.address, 2, "FastShip Logistics"); // Role.Logistics
    expect(await roleManager.isAuthorized(addr1.address, 2)).to.be.true;
    expect(await roleManager.isAuthorized(addr1.address, 1)).to.be.false;
  });

  it("should revoke a participant", async function () {
    await roleManager.registerParticipant(addr2.address, 3, "City Hospital"); // Role.Hospital
    await roleManager.revokeParticipant(addr2.address);
    const p = await roleManager.participants(addr2.address);
    expect(p.active).to.be.false;
    expect(await roleManager.isAuthorized(addr2.address, 3)).to.be.false;
  });

  it("should reject role None", async function () {
    await expect(
      roleManager.registerParticipant(addr1.address, 0, "Unknown")
    ).to.be.revertedWith("Invalid role");
  });

  it("should list all registered participants", async function () {
    await roleManager.registerParticipant(addr1.address, 1, "Mfg A");
    await roleManager.registerParticipant(addr2.address, 2, "Log B");
    const list = await roleManager.getAllParticipants();
    expect(list).to.include(addr1.address);
    expect(list).to.include(addr2.address);
  });
});
