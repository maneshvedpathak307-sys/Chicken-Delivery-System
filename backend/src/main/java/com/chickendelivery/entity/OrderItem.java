package com.chickendelivery.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    /*
     * Product name is stored as a snapshot in the order.
     */
    @Column(nullable = false)
    private String productName;

    /*
     * Product weight is stored as a snapshot in the order.
     *
     * Examples:
     * 1 KG
     * 1 PC
     */
    @Column(nullable = false)
    private String weight;

    /*
     * Price at the time of ordering.
     *
     * Chicken:
     * ₹280 per KG
     *
     * Eggs:
     * ₹7.50 per PIECE
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /*
     * BigDecimal is required because chicken can use:
     *
     * 0.250 = 250 g
     * 0.500 = 500 g
     * 0.750 = 750 g
     * 1.000 = 1 KG
     * 1.500 = 1.5 KG
     *
     * Eggs can use:
     *
     * 1
     * 5
     * 10
     * 12
     */
    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal quantity;

    /*
     * Backend-calculated subtotal.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    // =========================
    // CONSTRUCTOR
    // =========================

    public OrderItem() {
    }

    // =========================
    // GETTERS AND SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getWeight() {
        return weight;
    }

    public void setWeight(String weight) {
        this.weight = weight;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}