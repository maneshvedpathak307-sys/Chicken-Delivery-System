package com.chickendelivery.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.chickendelivery.entity.Address;
import com.chickendelivery.entity.User;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUserOrderByDefaultAddressDescIdDesc(User user);

    Optional<Address> findByIdAndUser(Long id, User user);

    Optional<Address> findByUserAndDefaultAddressTrue(User user);

    void deleteByUser(User user);
}