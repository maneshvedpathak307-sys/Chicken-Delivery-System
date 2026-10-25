import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import imageMap from "../../images/image";
import "../../styles/Products.css";

function getProductId(product) {
  return product.id ?? product.productId;
}

function getProductName(product) {
  return product.name || product.productName || "Fresh product";
}

function getProductPrice(product) {
  return product.price ?? product.unitPrice ?? product.sellingPrice;
}

function getProductImage(product) {
  const name = getProductName(product).trim();

  if (imageMap[name]) return imageMap[name];

  const normalizedName = name.toLowerCase();
  const matchingKey = Object.keys(imageMap).find(
    (key) => key.toLowerCase() === normalizedName
  );

  if (matchingKey) return imageMap[matchingKey];

  const nameAliases = [
    { keywords: ["whole chicken", "full chicken", "whole bird"], imageKey: "Whole Chicken" },
    { keywords: ["curry cut", "curry pieces"], imageKey: "Chicken Curry Cut" },
    { keywords: ["breast", "boneless breast"], imageKey: "Chicken Breast Boneless" },
    { keywords: ["drumstick", "drum stick"], imageKey: "Chicken Drumsticks" },
    { keywords: ["chicken wings", "wings"], imageKey: "Chicken Wings" },
    { keywords: ["full leg", "chicken leg with bone"], imageKey: "Chicken Full Leg" },
    { keywords: ["lollipop"], imageKey: "Chicken Lollipop" },
    { keywords: ["leg boneless", "boneless leg"], imageKey: "Chicken Leg Boneless" },
    { keywords: ["keema", "minced chicken", "mince chicken"], imageKey: "Chicken Keema" },
    { keywords: ["liver"], imageKey: "Chicken Liver" },
    { keywords: ["gizzard"], imageKey: "Chicken Gizzard" },
    { keywords: ["thigh boneless", "boneless thigh"], imageKey: "Chicken Thigh Boneless" },
    { keywords: ["soup pieces", "soup chicken"], imageKey: "Chicken Soup Pieces" },
    { keywords: ["eggs", "chicken egg"], imageKey: "Chicken Eggs" },
    { keywords: ["cut pieces", "chicken pieces"], imageKey: "Chicken Cut Pieces" },
  ];

  const alias = nameAliases.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(keyword))
  );

  if (alias && imageMap[alias.imageKey]) {
    return imageMap[alias.imageKey];
  }

  const backendImage =
    product.imageUrl ||
    product.imageURL ||
    product.image ||
    product.imagePath ||
    product.photoUrl ||
    product.photoURL ||
    product.photo ||
    "";

  return typeof backendImage === "string" ? backendImage : "";
}

function formatPrice(price) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return "Price unavailable";

  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [addingProductId, setAddingProductId] = useState(null);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.products)
            ? data.products
            : [];

      setProducts(list);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Map();

    products.forEach((product) => {
      const value =
        product.categoryName ||
        product.category?.name ||
        product.category ||
        "";

      if (typeof value === "string" && value.trim()) {
        const normalized = value.trim();
        uniqueCategories.set(normalized.toLowerCase(), normalized);
      }
    });

    return [...uniqueCategories.values()].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const name = getProductName(product).toLowerCase();
      const description = String(product.description || "").toLowerCase();

      const productCategory = String(
        product.categoryName ||
          product.category?.name ||
          product.category ||
          ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        description.includes(query) ||
        productCategory.includes(query);

      const matchesCategory =
        category === "all" ||
        productCategory === category.toLowerCase();

      const isActive =
        product.active !== false &&
        product.isActive !== false &&
        product.available !== false;

      return matchesSearch && matchesCategory && isActive;
    });

    if (sort === "price-low") {
      filtered.sort(
        (a, b) =>
          (Number(getProductPrice(a)) || 0) -
          (Number(getProductPrice(b)) || 0)
      );
    } else if (sort === "price-high") {
      filtered.sort(
        (a, b) =>
          (Number(getProductPrice(b)) || 0) -
          (Number(getProductPrice(a)) || 0)
      );
    } else if (sort === "name") {
      filtered.sort((a, b) =>
        getProductName(a).localeCompare(getProductName(b))
      );
    }

    return filtered;
  }, [products, search, category, sort]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCartMessage("");
    setCartError("");

    const nextParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set("search", value);
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams, { replace: true });
  };

  // --------------------------------------------------
  // ADD TO CART — REQUIRE LOGIN FOR GUEST USERS
  // --------------------------------------------------

  const handleAddToCart = async (product) => {
    const productId = getProductId(product);

    if (productId == null) {
      setCartError("This product is missing its product ID.");
      setCartMessage("");
      return;
    }

    // Match the existing authentication storage in this project.
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    // Guests must log in before adding products to their cart.
    if (!token || !user) {
      navigate("/login", {
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
          },
          pendingAddProductId: productId,
        },
      });

      return;
    }

    try {
      setAddingProductId(productId);
      setCartError("");
      setCartMessage("");

      const response = await api.post("/cart/items", {
        productId,
        quantity: 1,
      });

      console.log("ADD TO CART RESPONSE:", response.data);

      window.dispatchEvent(new Event("cartUpdated"));

      setCartMessage(`${getProductName(product)} added to your cart.`);
    } catch (requestError) {
      console.error("Add to cart error:", requestError);

      // If authentication expired, ask the user to log in again.
      if (
        requestError.response?.status === 401 ||
        requestError.response?.status === 403
      ) {
        navigate("/login", {
          state: {
            from: {
              pathname: location.pathname,
              search: location.search,
            },
            pendingAddProductId: productId,
          },
        });

        return;
      }

      setCartError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to add this product to your cart."
      );
      setCartMessage("");
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <main className="products-page">
      <section className="products-hero">
        <div className="products-hero-content">
          <span className="products-eyebrow">
            FRESHNESS FOR YOUR KITCHEN
          </span>

          <h1>
            Discover your
            <br />
            <span>fresh favourites.</span>
          </h1>

          <p>
            Browse our available products and find the right
            ingredients for your next meal.
          </p>

          <div className="products-hero-actions">
            <a href="#product-catalog" className="products-hero-button">
              Explore Products <span aria-hidden="true">↓</span>
            </a>

            <Link to="/cart" className="products-hero-cart">
              View Cart <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="products-hero-art" aria-hidden="true">
          <div className="products-hero-circle">
            <span>🍗</span>
          </div>

          <div className="products-hero-badge">
            <span>✓</span>
            Fresh choices
          </div>
        </div>
      </section>

      <section className="products-benefit-strip">
        <div><span>🥬</span><p>Everyday essentials</p></div>
        <div><span>🛒</span><p>Easy online shopping</p></div>
        <div><span>🏠</span><p>Order from home</p></div>
      </section>

      <section className="products-catalog" id="product-catalog">
        <div className="products-heading">
          <div>
            <span className="products-section-label">OUR COLLECTION</span>
            <h2>Shop all products</h2>
            <p>Find your favourites from our available selection.</p>
          </div>

          <Link to="/cart" className="products-cart-link">
            <span aria-hidden="true">🛒</span> Go to Cart
          </Link>
        </div>

        <div className="products-toolbar">
          <div className="products-search">
            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search chicken, eggs, and more..."
              aria-label="Search products"
            />

            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <label className="products-sort">
            <span>Sort by</span>

            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Featured</option>
              <option value="name">Name: A–Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </label>
        </div>

        <div className="products-category-filters">
          <button
            type="button"
            className={category === "all" ? "active" : ""}
            onClick={() => setCategory("all")}
          >
            All Products
          </button>

          {categories.map((item) => (
            <button
              type="button"
              className={category.toLowerCase() === item.toLowerCase() ? "active" : ""}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {cartMessage && (
          <div className="products-notice products-notice-success" role="status">
            <span>✓</span>
            {cartMessage}
            <Link to="/cart">View cart →</Link>
          </div>
        )}

        {cartError && (
          <div className="products-notice products-notice-error" role="alert">
            {cartError}
          </div>
        )}

        {loading ? (
          <div className="products-state">
            <span className="products-spinner" />
            <p>Loading available products...</p>
          </div>
        ) : error ? (
          <div className="products-state">
            <span className="products-state-icon">!</span>
            <h3>We couldn't load the products</h3>
            <p>{error}</p>

            <button
              type="button"
              className="products-retry-button"
              onClick={loadProducts}
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="products-state">
            <span className="products-state-emoji">🔎</span>
            <h3>No products found</h3>
            <p>Try another search or select a different category.</p>

            <button
              type="button"
              className="products-retry-button"
              onClick={() => {
                handleSearchChange("");
                setCategory("all");
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="products-result-count">
              Showing <strong>{filteredProducts.length}</strong>{" "}
              {filteredProducts.length === 1 ? "product" : "products"}
            </div>

            <div className="products-grid">
              {filteredProducts.map((product, index) => {
                const productId = getProductId(product);
                const image = getProductImage(product);
                const name = getProductName(product);
                const price = getProductPrice(product);

                const description =
                  product.description ||
                  "Explore this product from FreshNest.";

                const outOfStock =
                  product.stockQuantity === 0 ||
                  product.quantity === 0 ||
                  product.inStock === false ||
                  product.available === false;

                return (
                  <article
                    className="products-card"
                    key={productId ?? `${name}-${index}`}
                  >
                    <div className="products-card-image">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          loading="lazy"
                          onError={(event) => {
                            const element = event.currentTarget;
                            const backendImage =
                              product.imageUrl ||
                              product.imageURL ||
                              product.image ||
                              product.imagePath ||
                              product.photoUrl ||
                              product.photoURL ||
                              product.photo ||
                              "";

                            if (
                              backendImage &&
                              backendImage !== image &&
                              element.dataset.fallbackTried !== "true"
                            ) {
                              element.dataset.fallbackTried = "true";
                              element.src = backendImage;
                            } else {
                              element.style.display = "none";
                            }
                          }}
                        />
                      ) : (
                        <span className="products-placeholder" role="img" aria-label={name}>
                          🍗
                        </span>
                      )}

                      <span className="products-fresh-tag">FreshNest</span>
                    </div>

                    <div className="products-card-content">
                      <span className="products-card-category">
                        {product.categoryName ||
                          product.category?.name ||
                          product.category ||
                          "Fresh selection"}
                      </span>

                      <h3>{name}</h3>

                      <p className="products-card-description">{description}</p>

                      <div className="products-card-bottom">
                        <div className="products-price">
                          {formatPrice(price)}
                          {product.unit && <small> / {product.unit}</small>}
                        </div>

                        <button
                          type="button"
                          className="products-add-button"
                          disabled={outOfStock || addingProductId === productId}
                          onClick={() => handleAddToCart(product)}
                        >
                          {addingProductId === productId
                            ? "Adding..."
                            : outOfStock
                              ? "Out of Stock"
                              : "+ Add"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="products-bottom-banner">
        <div>
          <span>FRESHNEST PROMISE</span>
          <h2>Your kitchen deserves fresh choices.</h2>
          <p>Explore our selection and shop at your convenience.</p>
        </div>

        <Link to="/orders" className="products-banner-button">
          Track My Orders →
        </Link>
      </section>
    </main>
  );
}