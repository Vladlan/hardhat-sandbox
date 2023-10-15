// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";


contract CarContract {
    address public manufacturer;
    address payable public currentOwner;
    address payable public newOwner;
    uint public carValue;
    
    enum State { Created, RequestedSale, Approved, Completed }
    State public state;

    event CarContractCreated(address manufacturer);
    event OwnershipRequested(address payable newOwner, uint carValue);
    event OwnershipApproved(address payable newOwner);
    event OwnershipCompleted(address payable newOwner, uint carValue);
    
    modifier onlyManufacturer() {
        require(msg.sender == manufacturer, "Only the manufacturer can perform this action");
        _;
    }

    modifier inState(State _state) {
        require(state == _state, "Invalid state for this operation");
        _;
    }

    constructor(uint _carValue, address payable _currentOwner) public {
        manufacturer = msg.sender;
        currentOwner = payable(_currentOwner);
        state = State.Created;
        emit CarContractCreated(manufacturer);
        carValue = _carValue;
    }

    function requestOwnershipTransfer(address payable _newOwner, uint _carValue) external payable inState(State.Created) {
        require(newOwner != _newOwner, "You cannot transfer ownership to yourself");
        require(carValue >= _carValue, "Sent ETH is less than car value");
        newOwner = _newOwner;
        state = State.RequestedSale;
        emit OwnershipRequested(newOwner, carValue);
    }

    function approveOwnershipTransfer() external onlyManufacturer inState(State.RequestedSale) {
        state = State.Approved;
        emit OwnershipApproved(currentOwner);
    }

    function completeOwnershipTransfer() external payable inState(State.Approved) {
        require(msg.value == carValue, "Sent ETH does not match the car value");
        currentOwner.transfer(carValue);
        currentOwner = newOwner;
        newOwner = payable(address(0));
        state = State.Completed;
        emit OwnershipCompleted(currentOwner, carValue);
    }

    function cancelOwnershipTransfer() external onlyManufacturer inState(State.RequestedSale) {
        state = State.Created;
        newOwner = payable(address(0));
    }
}
