package com.chickendelivery.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.chickendelivery.dto.AddressRequest;
import com.chickendelivery.dto.AddressResponse;
import com.chickendelivery.entity.Address;
import com.chickendelivery.entity.User;
import com.chickendelivery.repository.AddressRepository;
import com.chickendelivery.repository.UserRepository;

@Service
public class AddressService {

    private final AddressRepository addressRepository;

    private final UserRepository userRepository;

    public AddressService(
            AddressRepository addressRepository,
            UserRepository userRepository) {

        this.addressRepository = addressRepository;

        this.userRepository = userRepository;
    }

    // =========================================================
    // GET MY ADDRESSES
    // =========================================================

    @Transactional(readOnly = true)
    public List<AddressResponse> getMyAddresses(String email) {

        User user = getUserByEmail(email);

        return addressRepository
                .findByUserOrderByDefaultAddressDescIdDesc(user)
                .stream()
                .map(AddressResponse::new)
                .toList();
    }

    // =========================================================
    // ADD ADDRESS
    // =========================================================

    @Transactional
    public AddressResponse addAddress(
            String email,
            AddressRequest request) {

        User user = getUserByEmail(email);

        boolean makeDefault =
                Boolean.TRUE.equals(request.getDefaultAddress());

        // If this is the user's first address,
        // automatically make it default.
        if (addressRepository.findByUserOrderByDefaultAddressDescIdDesc(user)
                .isEmpty()) {

            makeDefault = true;
        }

        if (makeDefault) {
            removeDefaultAddress(user);
        }

        Address address = new Address();

        address.setUser(user);

        address.setFullName(request.getFullName());

        address.setPhone(request.getPhone());

        address.setAddressLine(request.getAddressLine());

        address.setCity(request.getCity());

        address.setState(request.getState());

        address.setPincode(request.getPincode());

        address.setDefaultAddress(makeDefault);

        Address savedAddress =
                addressRepository.save(address);

        return new AddressResponse(savedAddress);
    }

    // =========================================================
    // UPDATE ADDRESS
    // =========================================================

    @Transactional
    public AddressResponse updateAddress(
            String email,
            Long addressId,
            AddressRequest request) {

        User user = getUserByEmail(email);

        Address address =
                addressRepository
                        .findByIdAndUser(addressId, user)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Address not found"));

        boolean makeDefault =
                Boolean.TRUE.equals(request.getDefaultAddress());

        if (makeDefault) {
            removeDefaultAddress(user);
        }

        address.setFullName(request.getFullName());

        address.setPhone(request.getPhone());

        address.setAddressLine(request.getAddressLine());

        address.setCity(request.getCity());

        address.setState(request.getState());

        address.setPincode(request.getPincode());

        address.setDefaultAddress(makeDefault);

        Address updatedAddress =
                addressRepository.save(address);

        return new AddressResponse(updatedAddress);
    }

    // =========================================================
    // SET DEFAULT ADDRESS
    // =========================================================

    @Transactional
    public AddressResponse setDefaultAddress(
            String email,
            Long addressId) {

        User user = getUserByEmail(email);

        Address address =
                addressRepository
                        .findByIdAndUser(addressId, user)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Address not found"));

        removeDefaultAddress(user);

        address.setDefaultAddress(true);

        Address updatedAddress =
                addressRepository.save(address);

        return new AddressResponse(updatedAddress);
    }

    // =========================================================
    // DELETE ADDRESS
    // =========================================================

    @Transactional
    public void deleteAddress(
            String email,
            Long addressId) {

        User user = getUserByEmail(email);

        Address address =
                addressRepository
                        .findByIdAndUser(addressId, user)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Address not found"));

        boolean wasDefault =
                Boolean.TRUE.equals(address.getDefaultAddress());

        addressRepository.delete(address);

        // If the deleted address was default,
        // make the newest remaining address default.
        if (wasDefault) {

            List<Address> remaining =
                    addressRepository
                            .findByUserOrderByDefaultAddressDescIdDesc(user);

            if (!remaining.isEmpty()) {

                Address newDefault = remaining.get(0);

                newDefault.setDefaultAddress(true);

                addressRepository.save(newDefault);
            }
        }
    }

    // =========================================================
    // REMOVE CURRENT DEFAULT
    // =========================================================

    private void removeDefaultAddress(User user) {

        addressRepository
                .findByUserAndDefaultAddressTrue(user)
                .ifPresent(address -> {

                    address.setDefaultAddress(false);

                    addressRepository.save(address);
                });
    }

    // =========================================================
    // FIND USER
    // =========================================================

    private User getUserByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"));
    }
}