package com.chickendelivery.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.chickendelivery.entity.Role;
import com.chickendelivery.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // =========================================================
    // FIND USER BY EMAIL
    // =========================================================

    Optional<User> findByEmail(String email);


    // =========================================================
    // CHECK EMAIL
    // =========================================================

    boolean existsByEmail(String email);


    // =========================================================
    // CHECK PHONE
    // =========================================================

    boolean existsByPhone(String phone);


    // =========================================================
    // COUNT USERS BY ROLE
    // =========================================================

    long countByRole(Role role);


    // =========================================================
    // COUNT USERS BY ACTIVE STATUS
    // =========================================================

    long countByActive(Boolean active);


    // =========================================================
    // GET ALL USERS
    // =========================================================

    List<User> findAllByOrderByIdDesc();
}