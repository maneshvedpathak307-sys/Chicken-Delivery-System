import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/ProductCard.css";

const FALLBACK_IMAGE =
"https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600&auto=format&fit=crop&q=80";

function ProductCard({ product, onAddToCart }) {
const navigate = useNavigate();
const { isAuthenticated } = useAuth();
const [imageError, setImageError] = useState(false);

const productId = product?.id ?? product?.productId;
const productName =
product?.name || product?.productName || "Chicken Product";

const price = Number(
product?.price ?? product?.sellingPrice ?? 0
);

const imageUrl =
product?.imageUrl ||
product?.imageURL ||
product?.image ||
product?.imagePath ||
product?.photoUrl ||
product?.photoURL ||
product?.photo ||
"";

const description =
product?.description || "Fresh quality for your everyday meals.";

const handleAddToCart = () => {
if (!isAuthenticated) {
navigate("/login", {
state: { from: { pathname: "/products" } },
});
return;
}

if (typeof onAddToCart === "function") {
  onAddToCart(product);
} else {
  navigate("/cart");
}

};

return (
<article className="product-card">
<div className="product-card-image-wrap">
<img
className="product-card-image"
src={imageError || !imageUrl ? FALLBACK_IMAGE : imageUrl}
alt={productName}
loading="lazy"
onError={() => setImageError(true)}
/>

    <span className="product-card-badge">
      Fresh Choice
    </span>
  </div>

  <div className="product-card-content">
    <h3 className="product-card-title">{productName}</h3>

    <p className="product-card-description">
      {description}
    </p>

    <div className="product-card-bottom">
      <div className="product-card-price">
        <span>₹</span>
        {price.toFixed(2)}
        {product?.unit && (
          <small> / {product.unit}</small>
        )}
      </div>

      <button
        type="button"
        className="product-card-add-button"
        onClick={handleAddToCart}
        disabled={!productId}
      >
        <span aria-hidden="true">+</span>
        Add to Cart
      </button>
    </div>
  </div>
</article>

);
}

export default ProductCard;